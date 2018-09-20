from __future__ import print_function
import sys
import argparse
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
    ('ec2', {
        'name': 'EC2 instances',
        'query': '.Reservations[].Instances|length',
        'source': 'ec2-describe-instances'}),
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
    ('autoscaling', {
		'name': 'Autoscaling groups',
		'query': '.AutoScalingGroups|length',
		'source': 'autoscaling-describe-auto-scaling-groups'}),
    ('elasticbeanstalk', {
		'name': 'ElasticBeanstalks',
		'query': '.Applications|length',
		'source': 'elasticbeanstalk-describe-applications'}),
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
		'source': 'lambda-list-functions'})
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


def output_image(accounts, account_stats, resources, output_image_file):
    # Display graph
    import matplotlib
    matplotlib.use('Agg')
    import pandas as pd
    import seaborn as sns
    import matplotlib.pyplot as plt
    from pandas.plotting import table

    # Reverse order of accounts so they appear in the graph correctly
    accounts = list(reversed(accounts))

    account_names = ['Resource']
    for account in accounts:
        account_names.append(account['name'])

    data = []
    for resource in resources:
        resource_array = [resources[resource]['name']]
        for account in accounts:
            count = sum(account_stats[account['name']][resource].values())
            resource_array.append(count)
        data.append(resource_array)

    df = pd.DataFrame(
        columns=account_names,
        data=data)

    sns.set()
    plot = df.set_index('Resource').T.plot(kind='barh', stacked=True, fontsize=10, figsize=[8,0.3*len(accounts)])
    plt.legend(loc='center left', bbox_to_anchor=(1.0, 0.5))
    fig = plot.get_figure()
    # TODO: Set color cycle as explained here https://stackoverflow.com/questions/8389636/creating-over-20-unique-legend-colors-using-matplotlib
    # This is needed because there are 17 resources graphed, but only 10 colors in the cycle.
    # So if you have only S3 buckets and CloudFront, you end up with two blue bands
    # next to each other.

    fig.savefig(output_image_file, format='png', bbox_inches='tight', dpi=200)
    print('Image saved to {}'.format(output_image_file), file=sys.stderr)


def stats(accounts, config, args):
    '''Collect stats'''

    # Collect counts
    account_stats = {}
    for account in accounts:
        account_stats[account['name']] = get_account_stats(account)

    # Print header
    print('\t'.rjust(20) + '\t'.join(a['name'] for a in accounts))

    for resource in resources:
        output_line = resources[resource]['name'].ljust(20)
        for account in accounts:
            count = sum(account_stats[account['name']][resource].values())
            output_line += ('\t' + str(count)).ljust(8)
        print(output_line)

    if not args.no_output_image:
        output_image(accounts, account_stats, resources, args.output_image)

def run(arguments):
    parser = argparse.ArgumentParser()

    parser.add_argument('--output_image',
        help='Name of output image', default='resource_stats.png', type=str)
    parser.add_argument("--no_output_image", help="Don't create output image",
        default=False, action='store_true')

    args, accounts, config = parse_arguments(arguments, parser)

    stats(accounts, config, args)
