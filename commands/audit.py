import json
import os.path
import ssl
from datetime import datetime
import urllib
import pyjq
import traceback
import sys

from policyuniverse.policy import Policy

from shared.common import parse_arguments, query_aws, get_parameter_file, get_regions
from shared.nodes import Account, Region


__description__ = "Identify potential issues such as public S3 buckets"


def audit_s3_buckets(region):
    buckets_json = query_aws(region.account, "s3-list-buckets", region)
    buckets = pyjq.all('.Buckets[].Name', buckets_json)
    for bucket in buckets:
        # Check policy
        try:
            policy_file_json = get_parameter_file(region, 's3', 'get-bucket-policy', bucket)
            # Find the entity we need
            policy_string = policy_file_json['Policy']
            # Load the string value as json
            policy = json.loads(policy_string)
            policy = Policy(policy)
            if policy.is_internet_accessible():
                print('- Internet accessible S3 bucket {}: {}'.format(bucket, policy_string))
        except:
            pass

        # Check ACL
        try:
            file_json = get_parameter_file(region, 's3', 'get-bucket-acl', bucket)
            for grant in file_json['Grants']:
                uri = grant['Grantee'].get('URI', "")
                if (uri == 'http://acs.amazonaws.com/groups/global/AllUsers' or
                    uri == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers'):
                    print('- Public grant to S3 bucket {}: {}'.format(bucket, grant))
        except:
            pass


def audit_cloudtrail(region):
    json_blob = query_aws(region.account, "cloudtrail-describe-trails", region)
    if len(json_blob['trailList']) == 0:
        print('- CloudTrail is off')
    else:
        multiregion = False
        for trail in json_blob['trailList']:
            if trail['IsMultiRegionTrail']:
                multiregion = True
                break
        if not multiregion:
            print('- CloudTrail is not multiregion')


def audit_password_policy(region):
    json_blob = query_aws(region.account, "iam-get-account-password-policy", region)
    if json_blob is None or json_blob.get('PasswordPolicy', {}) == {}:
        print('- No password policy set')
    else:
        if json_blob['PasswordPolicy'].get('MinimumPasswordLength', 0) < 12:
            print('- Password policy minimum length set to: {}'.format(json_blob['PasswordPolicy'].get('MinimumPasswordLength', 0)))

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
            print('- Password policy lacks: {}'.format(", ".join(lacking_character_requirements)))


def audit_root_user(region):
    json_blob = query_aws(region.account, "iam-get-account-summary", region)

    root_user_access_keys = json_blob.get('SummaryMap', {}).get('AccountAccessKeysPresent', 0)
    if root_user_access_keys != 0:
        print('- Root user has {} access keys'.format(root_user_access_keys))

    root_user_mfa = json_blob.get('SummaryMap', {}).get('AccountMFAEnabled', 0)
    if root_user_mfa != 1:
        print('- Root user has no MFA')


def audit_users(region):
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

    users_with_passwords = 0
    users_with_password_but_no_mfa = 0

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
            users_with_passwords += 1
            if user['mfa_active'] == 'false':
                users_with_password_but_no_mfa += 1
                print('- User with password login, but no MFA: {}'.format(user['user']))

            if user['password_last_used'] == 'no_information':
                print('- User has not logged in: {}'.format(user['user']))
            else:
                password_last_used_days = days_between(collection_date, user['password_last_used'])
                if password_last_used_days > MAX_DAYS_SINCE_LAST_USAGE:
                    print('- User has not logged in for {} days: {}'.format(password_last_used_days, user['user']))

        if user['access_key_1_active'] == "true" and user['access_key_2_active'] == "true":
            print('- User with 2 active access keys: {}'.format(user['user']))

        if user['access_key_1_active'] == "true":
            if user['access_key_1_last_used_date'] == "N/A":
                print('- User has key1, but has never used it: {}'.format(user['user']))
            else:
                days_since_key_use = days_between(collection_date, user['access_key_1_last_used_date'])
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    print('- User has not used key1 in {} days: {}'.format(days_since_key_use, user['user']))

        if user['access_key_2_active'] == "true":
            if user['access_key_2_last_used_date'] == "N/A":
                print('- User has key2, but has never used it: {}'.format(user['user']))
            else:
                days_since_key_use = days_between(collection_date, user['access_key_2_last_used_date'])
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    print('- User has not used key2 in {} days: {}'.format(days_since_key_use, user['user']))

    # Print summary
    if users_with_password_but_no_mfa != 0:
        print('- Of {} users with passwords, {} had no MFA ({:0.2f}%)'.format(users_with_passwords, users_with_password_but_no_mfa, float(users_with_password_but_no_mfa)/float(users_with_passwords)*100.0))


def audit_route53(region):
    json_blob = query_aws(region.account, "route53domains-list-domains", region)
    for domain in json_blob.get('Domains', []):
        if not domain['AutoRenew']:
            print('- Route53 domain not set to autorenew: {}'.format(domain['DomainName']))
        if not domain['TransferLock']:
            print('- Route53 domain transfer lock not set: {}'.format(domain['DomainName']))


def audit_ebs_snapshots(region):
    json_blob = query_aws(region.account, "ec2-describe-snapshots", region)
    for snapshot in json_blob['Snapshots']:
        try:
            file_json = get_parameter_file(region, 'ec2', 'describe-snapshot-attribute', snapshot['SnapshotId'])
            for attribute in file_json['CreateVolumePermissions']:
                if attribute.get('Group', 'self') != 'self':
                    print('- EBS snapshot in {} is public: {}, entities allowed to restore: {}'.format(region.name, snapshot, attribute['Group']))
        except OSError:
            print('WARNING: Could not open {}'.format(file_name))


def audit_rds_snapshots(region):
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


def audit_rds(region):
    json_blob = query_aws(region.account, "rds-describe-db-instances", region)
    for instance in json_blob.get('DBInstances', []):
        if instance['PubliclyAccessible']:
            print('- RDS instance in {} is public: {}'.format(region.name, instance['DBInstanceIdentifier']))
        if instance.get('DBSubnetGroup', {}).get('VpcId', '') == '':
            print('- RDS instance in {} is in VPC classic: {}'.format(region.name, instance['DBInstanceIdentifier']))


def audit_amis(region):
    json_blob = query_aws(region.account, "ec2-describe-images", region)
    for image in json_blob.get('Images', []):
        if image['Public']:
            print('- AMI is public: {} in {}'.format(image['ImageId'], region.name))


def audit_ecr_repos(region):
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


def audit_redshift(region):
    json_blob = query_aws(region.account, "redshift-describe-clusters", region)
    for cluster in json_blob.get('Clusters', []):
        if cluster['PubliclyAccessible']:
            print('- Redshift is public: {} in {}'.format(cluster['ClusterIdentifier'], region.name))


def audit_es(region):
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


def audit_cloudfront(region):
    json_blob = query_aws(region.account, 'cloudfront-list-distributions', region)

    # Ignore cert issues, as urlopen doesn't understand '*.s3.amazonaws.com'
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    for distribution in json_blob.get('DistributionList', {}).get('Items', []):
        if not distribution['Enabled']:
            continue

        minimum_protocol_version = distribution.get('ViewerCertificate', {}) \
            .get('MinimumProtocolVersion', '')
        if minimum_protocol_version == 'SSLv3':
            print('- CloudFront is using insecure minimum protocol version {} for {} in {}'.format(minimum_protocol_version, distribution['DomainName'], region.name))
        
        domain = distribution['DomainName']

        # TODO: Not sure if this works.  I'm trying to see if I can access the cloudfront distro,
        # or if I get a 403
        # This is from https://github.com/MindPointGroup/cloudfrunt/blob/master/cloudfrunt.py
        try:
            urllib.request.urlopen('https://' + domain, context=ctx)
        except urllib.error.HTTPError as e:
            if e.code == 403 and 'Bad request' in str(e.fp.read()):
                print('- CloudFront distribution {} is missing origin'.format(distribution['DomainName']))


def audit_ec2(region):
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


def audit_elb(region):
    json_blob = query_aws(region.account, 'elb-describe-load-balancers', region)
    for description in json_blob.get('LoadBalancerDescriptions', []):
        if len(description['Instances']) == 0:
            # Checks if there are backend's or not. Not a security risk, just odd that this is so common,
            # and wastes money, but this just clutters my report.
            #print('- ELB has no backend instances: {} in {}'.format(
            #      description['DNSName'],
            #      region.name))
            pass


def audit_sg(region):
    # TODO Check if security groups allow large CIDR range (ex. 1.2.3.4/3)
    # TODO Check if an SG allows overlapping CIDRs, such as 10.0.0.0/8 and then 0.0.0.0/0
    # TODO Check if an SG restricts IPv4 and then opens IPv6 or vice versa.
    pass


def audit_lambda(region):
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


def audit_glacier(region):
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


def audit_kms(region):
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


def audit_sqs(region):
    # Check for publicly accessible sqs.
    json_blob = query_aws(region.account, "sqs-list-queues", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for queue in json_blob.get('QueueUrls', []):
        # Check policy
        attributes = get_parameter_file(region, 'sqs', 'get-queue-attributes', queue)
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
            print('- Internet accessible SQS {}: {}'.format(name, policy_string))


def audit_sns(region):
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


def audit_lightsail(region):
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

    for account in accounts:
        account = Account(None, account)
        print('Finding resources in account {} ({})'.format(account.name, account.local_id))

        for region_json in get_regions(account):
            region = Region(account, region_json)
            try:
                if region.name == 'us-east-1':
                    audit_s3_buckets(region)
                    audit_cloudtrail(region)
                    audit_password_policy(region)
                    audit_root_user(region)
                    audit_users(region)
                    audit_route53(region)
                    audit_cloudfront(region)
                audit_ebs_snapshots(region)
                audit_rds_snapshots(region)
                audit_rds(region)
                audit_amis(region)
                audit_ecr_repos(region)
                audit_redshift(region)
                audit_es(region)
                audit_ec2(region)
                audit_elb(region)
                audit_sg(region)
                audit_lambda(region)
                audit_glacier(region)
                audit_kms(region)
                audit_sqs(region)
                audit_sns(region)
                audit_lightsail(region)
            except Exception as e:
                print('Exception in {} in {}'.format(region.account.name, region.name), file=sys.stderr)
                traceback.print_exc()


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    audit(accounts, config)
