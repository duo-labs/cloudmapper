import json
import itertools
import os.path
import urllib.parse
from os import listdir
from collections import OrderedDict
import pyjq
from shared.nodes import Account, Region
from shared.common import parse_arguments, query_aws, get_regions, log_debug

__description__ = "Print counts of resources for accounts"

# This dict maintains the ordering
# I'd prefer to put this in a separate yaml file, but I want to preserve the order.
resources = OrderedDict([
    ('s3', {
        'name': 'S3 buckets',
        'query': '.Buckets|length',
        'source': 's3-list-buckets'}),
    ('user', {
        'name': 'IAM users',
        'query': '.UserDetailList|length',
        'source': 'iam-get-account-authorization-details'}),
    ('role', {
        'name': 'IAM roles',
        'query': '.RoleDetailList|length',
        'source': 'iam-get-account-authorization-details'}),
    ('hosted_zone', {
        'name': 'Route53 hosted zones',
        'query': '.HostedZones|length',
        'source': 'route53-list-hosted-zones'}),
    ('route53_record', {
        'name': 'Route53 records'}),
    ('domain', {
        'name': 'Route53 domains',
        'query': '.Domains|length',
        'source': 'route53domains-list-domains'}),
    ('ec2', {
        'name': 'EC2 instances',
        'query': '.Reservations[].Instances|length',
        'source': 'ec2-describe-instances'}),
    ('ec2-image', {
        'name': 'EC2 AMIs',
        'query': '.Images|length',
        'source': 'ec2-describe-images'}),
    ('network-acl', {
        'name': 'Network ACLs',
        'query': '.NetworkAcls|length',
        'source': 'ec2-describe-network-acls'}),
    ('route-table', {
        'name': 'Route tables',
		'query': '.RouteTables|length',
        'source': 'ec2-describe-route-tables'}),
    ('ec2-snapshot', {
        'name': 'EC2 snapshots',
		'query': '.Snapshots|length',
        'source': 'ec2-describe-snapshots'}),
    ('vpc-endpoint', {
        'name': 'VPC endpoints',
		'query': '.VpcEndpointConnections|length',
        'source': 'ec2-describe-vpc-endpoint-connections'
		}),
    ('vpn-connection', {
		'name': 'VPN connections',
		'query': '.VpnConnections|length',
		'source': 'ec2-describe-vpn-connections'}),
    ('directconnect', {
		'name': 'DirectConnects',
		'query': '.connections|length',
		'source': 'directconnect-describe-connections'}),
    ('elb', {
		'name': 'ELBs',
		'query': '.LoadBalancerDescriptions|length',
		'source': 'elb-describe-load-balancers'}),
    ('elbv2', {
		'name': 'ELBv2s',
		'query': '.LoadBalancers|length',
		'source': 'elbv2-describe-load-balancers'}),
    ('rds', {
		'name': 'RDS instances',
		'query': '.DBInstances|length',
		'source': 'rds-describe-db-instances'}),
    ('redshift', {
		'name': 'Redshift clusters',
		'query': '.Clusters|length',
		'source': 'redshift-describe-clusters'}),
    ('es', {
		'name': 'ElasticSearch domains',
		'query': '.DomainNames|length',
		'source': 'es-list-domain-names'}),
    ('elasticache', {
		'name': 'Elasticache clusters',
		'query': '.CacheClusters|length',
		'source': 'elasticache-describe-cache-clusters'}),
    ('sns', {
		'name': 'SNS topics',
		'query': '.Topics|length',
		'source': 'sns-list-topics'}),
    ('sqs', {
		'name': 'SQS queues',
		'query': '.QueueUrls|length',
		'source': 'sqs-list-queues'}),
    ('cloudfront', {
		'name': 'CloudFronts',
		'query': '.DistributionList|length',
		'source': 'cloudfront-list-distributions',
		'region': 'us-east-1'}),
    ('cloudsearch', {
		'name': 'CloudSearch domains',
		'query': '.DomainStatusList|length',
		'source': 'cloudsearch-describe-domains'}),
    ('ecr-repository', {
		'name': 'ECR repositories',
		'query': '.repositories|length',
		'source': 'ecr-describe-repositories'}),
    ('cloudformation', {
		'name': 'CloudFormation stacks',
		'query': '.Stacks|length',
		'source': 'cloudformation-describe-stacks'}),
    ('autoscaling', {
		'name': 'Autoscaling groups',
		'query': '.AutoScalingGroups|length',
		'source': 'autoscaling-describe-auto-scaling-groups'}),
    ('elasticbeanstalk', {
		'name': 'ElasticBeanstalks',
		'query': '.Applications|length',
		'source': 'elasticbeanstalk-describe-applications'}),
    ('efs', {
		'name': 'EFS',
		'query': '.FileSystems|length',
		'source': 'efs-describe-file-systems.json'}),
    ('firehose', {
		'name': 'Firehose streams',
		'query': '.DeliveryStreamNames|length',
		'source': 'firehose-list-delivery-streams'}),
    ('glacier', {
		'name': 'Glacier vaults',
		'query': '.VaultList|length',
		'source': 'glacier-list-vaults'}),
    ('kms-key', {
		'name': 'KMS keys',
		'query': '.Keys|length',
		'source': 'kms-list-keys'}),
    ('lambda', {
		'name': 'Lambda functions',
		'query': '.Functions|length',
		'source': 'lambda-list-functions'}),
    ('cloudwatch-alarm', {
		'name': 'Cloudwatch alarms',
		'query': '.MetricAlarms|length',
		'source': 'cloudwatch-describe-alarms'}),
    ('config-rule', {
		'name': 'Config rules',
		'query': '.ConfigRules|length',
		'source': 'config-describe-config-rules'}),
    ('event-rule', {
		'name': 'Event rules',
		'query': '.Rules|length',
		'source': 'events-list-rules'}),
    ('log-group', {
		'name': 'Log groups',
         'query': '.logGroups|length',
		'source': 'logs-describe-log-groups'})
])

def get_account_stats(account):
    """Returns stats for an account"""
    account = Account(None, account)
    log_debug('Collecting stats in account {} ({})'.format(account.name, account.local_id))

    # Init stats to {}
    stats = OrderedDict()
    for k in resources:
        stats[k] = {}

    for region_json in get_regions(account):
        region = Region(account, region_json)

        for key, resource in resources.items():
            # Skip global services (just CloudFront)
            if ('region' in resource) and (resource['region'] != region.name):
                continue

            # Check exceptions that require special code to perform the count
            if key == 'route53_record':
                path = 'account-data/{}/{}/{}'.format(
                    account.name,
                    region.name,
                    'route53-list-resource-record-sets')
                if os.path.isdir(path):
                    stats[key][region.name] = 0
                    for f in listdir(path):
                        json_data = json.load(open(os.path.join(path, urllib.parse.quote_plus(f))))
                        stats[key][region.name] += sum(pyjq.all('.ResourceRecordSets|length', json_data))
            else:
                # Normal path
                stats[key][region.name] = sum(pyjq.all(resource['query'], 
                    query_aws(region.account, resource['source'], region)))

    return stats


def stats(accounts, config):
    '''Collect stats'''

    # Collect counts
    account_stats = {}
    for account in accounts:
        account_stats[account['name']] = get_account_stats(account)

    # Print header
    print('\t' + '\t'.join(a['name'] for a in accounts))

    for resource in resources:
        output_line = resources[resource]['name'].ljust(20)
        for account in accounts:
            count = sum(account_stats[account['name']][resource].values())
            #if count == 0:
            #    count = ''
            output_line += ("\t"+str(count)).ljust(8)
        print(output_line)

def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    stats(accounts, config)
