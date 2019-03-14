import json
import os.path
import ssl
from datetime import datetime
import urllib
import pyjq
import traceback
import sys
import yaml

from policyuniverse.policy import Policy

from shared.common import parse_arguments, query_aws, get_parameter_file, get_regions
from shared.nodes import Account, Region


__description__ = "Identify potential issues such as public S3 buckets"


class Finding(object):
    region = None
    issue_id = None
    resource_id = None
    resource_details = None

    def __init__(self, region, issue_id, resource_id, resource_details=None):
        self.region = region
        self.issue_id = issue_id
        self.resource_id = resource_id
        self.resource_details = resource_details


class Findings(object):
    findings = None
    current = 0

    def __init__(self):
        self.findings = []

    def add(self, finding):
        self.findings.append(finding)
    
    def __iter__(self):
        for finding in self.findings:
            yield finding



def audit_s3_buckets(findings, region):
    buckets_json = query_aws(region.account, "s3-list-buckets", region)
    buckets = pyjq.all('.Buckets[].Name', buckets_json)
    for bucket in buckets:
        # Check policy
        try:
            policy_file_json = get_parameter_file(region, 's3', 'get-bucket-policy', bucket)
            if policy_file_json is not None:
                # Find the entity we need
                policy_string = policy_file_json['Policy']
                # Load the string value as json
                policy = json.loads(policy_string)
                policy = Policy(policy)
                if policy.is_internet_accessible():
                    if len(policy.statements) == 1 and len(policy.statements[0].actions) == 1 and 's3:GetObject' in policy.statements[0].actions:
                        findings.add(Finding(
                            region,
                            'S3_PUBLIC_POLICY_GETOBJECT_ONLY',
                            bucket))
                    else:
                        findings.add(Finding(
                            region,
                            'S3_PUBLIC_POLICY',
                            bucket,
                            resource_details=policy_string))
                        region, issue_id, resource_id, resource_details
        except Exception as e:
            findings.add(Finding(
                region,
                'EXCEPTION',
                bucket,
                resource_details={'policy': policy_string, 'exception': e, 'location': 'Exception checking policy of S3 bucket'}))
        # Check ACL
        try:
            file_json = get_parameter_file(region, 's3', 'get-bucket-acl', bucket)
            for grant in file_json['Grants']:
                uri = grant['Grantee'].get('URI', "")
                if (uri == 'http://acs.amazonaws.com/groups/global/AllUsers' or
                    uri == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'):
                    findings.add(Finding(
                            region,
                            'S3_PUBLIC_ACL',
                            bucket,
                            resource_details=grant))
        except Exception as e:
            findings.add(Finding(
                region,
                'EXCEPTION',
                bucket,
                resource_details={'grant': grant, 'exception': e, 'location': 'Exception checking ACL of S3 bucket'}))


def audit_s3_block_policy(findings, region):
    caller_identity_json = query_aws(region.account, "sts-get-caller-identity", region)
    block_policy_json = get_parameter_file(region, 's3control', 'get-public-access-block', caller_identity_json['Account'])
    if block_policy_json is None:
        findings.add(Finding(
            region,
            'S3_ACCESS_BLOCK_OFF',
            None))
    else:
        conf = block_policy_json['PublicAccessBlockConfiguration']
        if not conf['BlockPublicAcls'] or not conf['BlockPublicPolicy'] or not conf['IgnorePublicAcls'] or not conf['RestrictPublicBuckets']:
            findings.add(Finding(
            region,
            'S3_ACCESS_BLOCK_ALL_ACCESS_TYPES',
            None,
            resource_details=block_policy_json))


def audit_guardduty(findings, region):
    for region_json in get_regions(region.account):
        region = Region(region.account, region_json)
        detector_list_json = query_aws(region.account, "guardduty-list-detectors", region)
        if not detector_list_json:
            # GuardDuty must not exist in this region (or the collect data is old)
            continue
        is_enabled = False
        for detector in detector_list_json['DetectorIds']:
            detector_json = get_parameter_file(region, 'guardduty', 'get-detector', detector)
            if detector_json['Status'] == 'ENABLED':
                is_enabled = True
        if not is_enabled:
            findings.add(Finding(
                region,
                'GUARDDUTY_OFF',
                None,
                None))

def audit_cloudtrail(findings, region):
    json_blob = query_aws(region.account, "cloudtrail-describe-trails", region)
    if len(json_blob['trailList']) == 0:
        findings.add(Finding(
            region,
            'CLOUDTRAIL_OFF',
            None,
            None))
    else:
        multiregion = False
        for trail in json_blob['trailList']:
            if trail['IsMultiRegionTrail']:
                multiregion = True
                break
        if not multiregion:
            findings.add(Finding(
                region,
                'CLOUDTRAIL_NOT_MULTIREGION',
                None,
                None))


def audit_password_policy(findings, region):
    json_blob = query_aws(region.account, "iam-get-account-password-policy", region)
    if json_blob is None or json_blob.get('PasswordPolicy', {}) == {}:
        findings.add(Finding(
            region,
            'PASSWORD_POLICY_NOT_SET',
            None,
            None))
    else:
        if json_blob['PasswordPolicy'].get('MinimumPasswordLength', 0) < 12:
            findings.add(Finding(
                region,
                'PASSWORD_POLICY_CHARACTER_MINIMUM',
                None,
                resource_details={'MinimumPasswordLength': json_blob['PasswordPolicy'].get('MinimumPasswordLength', 0)}))

        lacking_character_requirements = []
        if not json_blob['PasswordPolicy'].get('RequireNumbers', False):
            lacking_character_requirements.append('RequireNumbers')
        if not json_blob['PasswordPolicy'].get('RequireSymbols', False):
            lacking_character_requirements.append('RequireSymbols')
        if not json_blob['PasswordPolicy'].get('RequireLowercaseCharacters', False):
            lacking_character_requirements.append('RequireLowercaseCharacters')
        if not json_blob['PasswordPolicy'].get('RequireUppercaseCharacters', False):
            lacking_character_requirements.append('RequireUppercaseCharacters')
        if len(lacking_character_requirements) > 0:
            findings.add(Finding(
                region,
                'PASSWORD_POLICY_CHARACTER_SET_REQUIREMENTS',
                None,
                resource_details={'Policy lacks': lacking_character_requirements}))


def audit_root_user(findings, region):
    json_blob = query_aws(region.account, "iam-get-account-summary", region)

    root_user_access_keys = json_blob.get('SummaryMap', {}).get('AccountAccessKeysPresent', 0)
    if root_user_access_keys != 0:
        findings.add(Finding(
            region,
            'ROOT_USER_HAS_ACCESS_KEYS',
            None,
            resource_details={'Number of access keys': root_user_access_keys}))
        print('- Root user has {} access keys'.format(root_user_access_keys))

    root_user_mfa = json_blob.get('SummaryMap', {}).get('AccountMFAEnabled', 0)
    if root_user_mfa != 1:
        findings.add(Finding(
            region,
            'ROOT_USER_HAS_NO_MFA',
            None,
            None))


def audit_users(findings, region):
    MAX_DAYS_SINCE_LAST_USAGE = 90

    def days_between(s1, s2):
        """s1 and s2 are date strings, such as 2018-04-08T23:33:20+00:00 """
        time_format = "%Y-%m-%dT%H:%M:%S"

        d1 = datetime.strptime(s1.split("+")[0], time_format)
        d2 = datetime.strptime(s2.split("+")[0], time_format)
        return abs((d1-d2).days)

    # TODO: Convert all of this into a table

    json_blob = query_aws(region.account, "iam-get-credential-report", region)
    csv_lines = json_blob['Content'].split('\n')
    collection_date = json_blob['GeneratedTime']

    # Skip header
    csv_lines.pop(0)

    # Header:
    # user,arn,user_creation_time,password_enabled,password_last_used,password_last_changed,
    # password_next_rotation,mfa_active,access_key_1_active,access_key_1_last_rotated,
    # access_key_1_last_used_date,access_key_1_last_used_region,access_key_1_last_used_service,
    # access_key_2_active,access_key_2_last_rotated,access_key_2_last_used_date,
    # access_key_2_last_used_region,access_key_2_last_used_service,cert_1_active,cert_1_last_rotated,
    # cert_2_active,cert_2_last_rotated
    for line in csv_lines:
        parts = line.split(',')
        user = {
            'user': parts[0],
            'arn': parts[1],
            'user_creation_time': parts[2],
            'password_enabled': parts[3],
            'password_last_used': parts[4],
            'password_last_changed': parts[5],
            'password_next_rotation': parts[6],
            'mfa_active': parts[7],
            'access_key_1_active': parts[8],
            'access_key_1_last_rotated': parts[9],
            'access_key_1_last_used_date': parts[10],
            'access_key_1_last_used_region': parts[11],
            'access_key_1_last_used_service': parts[12],
            'access_key_2_active': parts[13],
            'access_key_2_last_rotated': parts[14],
            'access_key_2_last_used_date': parts[15],
            'access_key_2_last_used_region': parts[16],
            'access_key_2_last_used_service': parts[17],
            'cert_1_active': parts[18],
            'cert_1_last_rotated': parts[19],
            'cert_2_active': parts[20],
            'cert_2_last_rotated': parts[21]
        }

        if user['password_enabled'] == 'true':
            if user['mfa_active'] == 'false':
                findings.add(Finding(
                    region,
                    'USER_WITH_PASSWORD_LOGIN_BUT_NO_MFA',
                    user['user'],
                    None))

            if user['password_last_used'] == 'no_information':
                findings.add(Finding(
                    region,
                    'USER_HAS_NEVER_LOGGED_IN',
                    user['user'],
                    None))
            else:
                password_last_used_days = days_between(collection_date, user['password_last_used'])
                if password_last_used_days > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(Finding(
                        region,
                        'USER_HAS_NOT_LOGGED_IN_FOR_OVER_MAX_DAYS',
                        user['user'],
                        resource_details={'Number of days since last login': password_last_used_days}))

        if user['access_key_1_active'] == "true" and user['access_key_2_active'] == "true":
            findings.add(Finding(
                    region,
                    'USER_HAS_TWO_ACCESS_KEYS',
                    user['user'],
                    None))

        if user['access_key_1_active'] == "true":
            if user['access_key_1_last_used_date'] == "N/A":
                findings.add(Finding(
                    region,
                    'USER_HAS_UNUSED_ACCESS_KEY',
                    user['user'],
                    resource_details={'Unused key': 1}))
            else:
                days_since_key_use = days_between(collection_date, user['access_key_1_last_used_date'])
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(Finding(
                        region,
                        'USER_HAS_NOT_USED_ACCESS_KEY_FOR_MAX_DAYS',
                        user['user'],
                        resource_details={'Days since key 1 used:': days_since_key_use}))
        if user['access_key_2_active'] == "true":
            if user['access_key_2_last_used_date'] == "N/A":
                findings.add(Finding(
                    region,
                    'USER_HAS_UNUSED_ACCESS_KEY',
                    user['user'],
                    resource_details={'Unused key': 2}))
            else:
                days_since_key_use = days_between(collection_date, user['access_key_2_last_used_date'])
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(Finding(
                        region,
                        'USER_HAS_NOT_USED_ACCESS_KEY_FOR_MAX_DAYS',
                        user['user'],
                        resource_details={'Days since key 2 used:': days_since_key_use}))


def audit_route53(findings, region):
    json_blob = query_aws(region.account, "route53domains-list-domains", region)
    for domain in json_blob.get('Domains', []):
        if not domain['AutoRenew']:
            findings.add(Finding(
                region,
                'DOMAIN_NOT_SET_TO_RENEW',
                domain['DomainName'],
                None))
        if not domain['TransferLock']:
            findings.add(Finding(
                region,
                'DOMAIN_HAS_NO_TRANSFER_LOCK',
                domain['DomainName'],
                None))


def audit_ebs_snapshots(findings, region):
    json_blob = query_aws(region.account, "ec2-describe-snapshots", region)
    for snapshot in json_blob['Snapshots']:
        try:
            file_json = get_parameter_file(region, 'ec2', 'describe-snapshot-attribute', snapshot['SnapshotId'])
            if file_json == None:
                # Not technically an exception, but an unexpected situation
                findings.add(Finding(
                    region,
                    'EXCEPTION',
                    snapshot,
                    resource_details={'location': 'EBS snapshot has no attributes'}))
                continue
            for attribute in file_json['CreateVolumePermissions']:
                if attribute.get('Group', 'self') != 'self':
                    findings.add(Finding(
                        region,
                        'EBS_SNAPSHOT_PUBLIC',
                        snapshot,
                        resource_details={'Entities allowed to restore': attribute['Group']}))
        except OSError:
            findings.add(Finding(
                region,
                'EXCEPTION',
                None,
                resource_details={
                    'location': 'Could not open EBS snapshot file', 
                    'file_name': file_name}))


def audit_rds_snapshots(findings, region):
    json_blob = query_aws(region.account, "rds-describe-db-snapshots", region)
    for snapshot in json_blob.get('DBSnapshots', []):
        try:
            file_json = get_parameter_file(region, 'rds', 'describe-db-snapshot-attributes', snapshot['DBSnapshotIdentifier'])
            for attribute in file_json['DBSnapshotAttributesResult']['DBSnapshotAttributes']:
                if attribute['AttributeName'] == 'restore':
                    if "all" in attribute['AttributeValues']:
                        print('- RDS snapshot in {} is public: {}, entities allowed to restore: {}'.format(region.name, snapshot, attribute['AttributeValues']))
        except OSError:
            print('WARNING: Could not open {}'.format(file_name))


def audit_rds(findings, region):
    json_blob = query_aws(region.account, "rds-describe-db-instances", region)
    for instance in json_blob.get('DBInstances', []):
        if instance['PubliclyAccessible']:
            print('- RDS instance in {} has public IP: {}'.format(region.name, instance['DBInstanceIdentifier']))
        if instance.get('DBSubnetGroup', {}).get('VpcId', '') == '':
            print('- RDS instance in {} is in VPC classic: {}'.format(region.name, instance['DBInstanceIdentifier']))


def audit_amis(findings, region):
    json_blob = query_aws(region.account, "ec2-describe-images", region)
    for image in json_blob.get('Images', []):
        if image['Public']:
            print('- AMI is public: {} in {}'.format(image['ImageId'], region.name))


def audit_ecr_repos(findings, region):
    json_blob = query_aws(region.account, "ecr-describe-repositories", region)
    for repo in json_blob.get('repositories', []):
        name = repo['repositoryName']

        # Check policy
        policy_file_json = get_parameter_file(region, 'ecr', 'get-repository-policy', name)
        if policy_file_json is None:
            # This means only the owner can access the repo, so this is fine.
            # The collect command would have received the exception 
            # `RepositoryPolicyNotFoundException` for this to happen.
            continue
        # Find the entity we need
        policy_string = policy_file_json['policyText']
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible ECR repo {}: {}'.format(name, policy_string))


def audit_redshift(findings, region):
    json_blob = query_aws(region.account, "redshift-describe-clusters", region)
    for cluster in json_blob.get('Clusters', []):
        if cluster['PubliclyAccessible']:
            print('- Redshift is public: {} in {}'.format(cluster['ClusterIdentifier'], region.name))


def audit_es(findings, region):
    json_blob = query_aws(region.account, 'es-list-domain-names', region)
    for domain in json_blob.get('DomainNames', []):
        name = domain['DomainName']

        # Check policy
        policy_file_json = get_parameter_file(region, 'es', 'describe-elasticsearch-domain', name)
        # Find the entity we need
        policy_string = policy_file_json['DomainStatus']['AccessPolicies']
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)

        # ES clusters or either public, with an "Endpoint" (singular), which is bad, or
        # they are VPC-only, in which case they have an "Endpoints" (plural) array containing a "vpc" element
        if policy_file_json['DomainStatus'].get('Endpoint', '') != '' or policy_file_json['DomainStatus'].get('Endpoints', {}).get('vpc', '') == '':
            if policy.is_internet_accessible():
                print('- Internet accessible ElasticSearch cluster {}: {}'.format(name, policy_string))


def audit_cloudfront(findings, region):
    json_blob = query_aws(region.account, 'cloudfront-list-distributions', region)

    for distribution in json_blob.get('DistributionList', {}).get('Items', []):
        if not distribution['Enabled']:
            continue

        minimum_protocol_version = distribution.get('ViewerCertificate', {}) \
            .get('MinimumProtocolVersion', '')
        if minimum_protocol_version == 'SSLv3':
            print('- CloudFront is using insecure minimum protocol version {} for {} in {}'.format(minimum_protocol_version, distribution['DomainName'], region.name))
        
        domain = distribution['DomainName']


def audit_ec2(findings, region):
    json_blob = query_aws(region.account, 'ec2-describe-instances', region)
    route_table_json = query_aws(region.account, 'ec2-describe-route-tables', region)

    ec2_classic_count = 0
    for reservation in json_blob.get('Reservations', []):
        for instance in reservation.get('Instances', []):
            if instance.get('State', {}).get('Name', '') == 'terminated':
                # Ignore EC2's that are off
                continue

            if 'vpc' not in instance.get('VpcId', ''):
                ec2_classic_count += 1

            if not instance.get('SourceDestCheck', True):
                print('- EC2 SourceDestCheck is off: {}'.format(instance['InstanceId']))

                route_to_instance = None
                for table in route_table_json['RouteTables']:
                    if table['VpcId'] == instance.get('VpcId', ''):
                        for route in table['Routes']:
                            if route.get('InstanceId', '') == instance['InstanceId']:
                                route_to_instance = route
                                break
                    if route_to_instance is not None:
                        break

                if route_to_instance is None:
                    print('  - No routes to instance, SourceDestCheck is not doing anything')
                else:
                    print('  -Routes: {}'.format(route_to_instance))

    if ec2_classic_count != 0:
        print('- EC2 classic instances found: {}'.format(ec2_classic_count))


def audit_sg(findings, region):
    # TODO Check if security groups allow large CIDR range (ex. 1.2.3.4/3)
    # TODO Check if an SG allows overlapping CIDRs, such as 10.0.0.0/8 and then 0.0.0.0/0
    # TODO Check if an SG restricts IPv4 and then opens IPv6 or vice versa.
    pass


def audit_lambda(findings, region):
    # Check for publicly accessible functions.  They should be called from apigateway or something else.
    json_blob = query_aws(region.account, "lambda-list-functions", region)
    for function in json_blob.get('Functions', []):
        name = function['FunctionName']

        # Check policy
        policy_file_json = get_parameter_file(region, 'lambda', 'get-policy', name)
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json['Policy']
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible Lambda {}: {}'.format(name, policy_string))


def audit_glacier(findings, region):
    # Check for publicly accessible vaults.
    json_blob = query_aws(region.account, "glacier-list-vaults", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for vault in json_blob.get('VaultList', []):
        name = vault['VaultName']

        # Check policy
        policy_file_json = get_parameter_file(region, 'glacier', 'get-vault-access-policy', name)
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json['policy']['Policy']
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible Glacier vault {}: {}'.format(name, policy_string))


def audit_kms(findings, region):
    # Check for publicly accessible KMS keys.
    json_blob = query_aws(region.account, "kms-list-keys", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for key in json_blob.get('Keys', []):
        name = key['KeyId']

        # Check policy
        policy_file_json = get_parameter_file(region, 'kms', 'get-key-policy', name)
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json['Policy']
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible KMS {}: {}'.format(name, policy_string))


def audit_sqs(findings, region):
    # Check for publicly accessible sqs.
    json_blob = query_aws(region.account, "sqs-list-queues", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for queue in json_blob.get('QueueUrls', []):
        queue_name = queue.split("/")[-1]
        # Check policy
        queue_attributes = get_parameter_file(region, 'sqs', 'get-queue-attributes', queue)
        if queue_attributes is None:
            # No policy
            continue

        # Find the entity we need
        attributes = queue_attributes['Attributes']
        if 'Policy' in attributes:
            policy_string = attributes['Policy']
        else:
            # No policy set
            continue

        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible SQS {}: {}'.format(queue_name, policy_string))


def audit_sns(findings, region):
    # Check for publicly accessible sns.
    json_blob = query_aws(region.account, "sns-list-topics", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for topic in json_blob.get('Topics', []):
        # Check policy
        attributes = get_parameter_file(region, 'sns', 'get-topic-attributes', topic['TopicArn'])
        if attributes is None:
            # No policy
            continue

        # Find the entity we need
        attributes = attributes['Attributes']
        if 'Policy' in attributes:
            policy_string = attributes['Policy']
        else:
            # No policy set
            continue

        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            print('- Internet accessible SNS {}: {}'.format(topic['TopicArn'], policy_string))


def audit_lightsail(findings, region):
    # Just check if lightsail is in use
    json_blob = query_aws(region.account, "lightsail-get-instances", region)
    if json_blob is None:
        # Service not supported in the region
        return
    
    if len(json_blob.get('instances', [])) > 0:
        print('- Lightsail used ({} instances) in region {}'.format(json_blob['instances'], region.name))
    
    json_blob = query_aws(region.account, "lightsail-get-load-balancers", region)
    if json_blob is None:
        # Service not supported in the region
        return
    
    if len(json_blob.get('loadBalancers', [])) > 0:
        print('- Lightsail used ({} load balancers) in region {}'.format(json_blob['loadBalancers'], region.name))



def audit(accounts, config):
    """Audit the accounts"""

    findings = Findings()

    for account in accounts:
        account = Account(None, account)
        print('Finding resources in account {} ({})'.format(account.name, account.local_id))

        for region_json in get_regions(account):
            region = Region(account, region_json)
            try:
                if region.name == 'us-east-1':
                    audit_s3_buckets(findings, region)
                    audit_cloudtrail(findings, region)
                    audit_password_policy(findings, region)
                    audit_root_user(findings, region)
                    audit_users(findings, region)
                    audit_route53(findings, region)
                    audit_cloudfront(findings, region)
                    audit_s3_block_policy(findings, region)
                    audit_guardduty(findings, region)
                audit_ebs_snapshots(findings, region)
                audit_rds_snapshots(findings, region)
                audit_rds(findings, region)
                audit_amis(findings, region)
                audit_ecr_repos(findings, region)
                audit_redshift(findings, region)
                audit_es(findings, region)
                audit_ec2(findings, region)
                audit_sg(findings, region)
                audit_lambda(findings, region)
                audit_glacier(findings, region)
                audit_kms(findings, region)
                audit_sqs(findings, region)
                audit_sns(findings, region)
                audit_lightsail(findings, region)
            except Exception as e:
                print('Exception in {} in {}'.format(region.account.name, region.name), file=sys.stderr)
                traceback.print_exc()


        with open("audit_config.yaml", 'r') as f:
            audit_config = yaml.safe_load(f)
        # TODO: Check the file is formatted correctly

        # Print findings
        for finding in findings:
            conf = audit_config[finding.issue_id]  
            print('{} - {}: {} ({}): {}'.format(
                conf['severity'].upper(),
                conf['title'],
                finding.region.account.name,
                finding.region.name,
                finding.resource_id))


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    audit(accounts, config)
