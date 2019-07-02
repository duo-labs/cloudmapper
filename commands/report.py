from __future__ import print_function
import argparse
import json
import yaml
import os.path
import pprint
from jinja2 import Template

from shared.common import parse_arguments, get_regions, get_account_stats, get_collection_date, get_access_advisor_active_counts
from shared.nodes import Account, Region
from shared.public import get_public_nodes
from shared.audit import audit

__description__ = "Create report"

REPORT_OUTPUT_FILE = os.path.join('web', 'account-data', 'report.html')

COLOR_PALETTE = [
    'rgba(141,211,199,1)', 'rgba(255,255,179,1)', 'rgba(190,186,218,1)', 'rgba(251,128,114,1)', 'rgba(128,177,211,1)', 'rgba(253,180,98,1)', 'rgba(179,222,105,1)', 'rgba(252,205,229,1)', 'rgba(217,217,217,1)', 'rgba(188,128,189,1)', 'rgba(204,235,197,1)', 'rgba(255,237,111,1)', 'rgba(191,67,66,1)', 'rgba(231,215,193,1)', 'rgba(167,138,127,1)', 'rgba(201,213,181,1)', 'rgba(115,87,81,1)', 'rgba(140,28,19,1)', 'rgba(109,100,102,1)','rgba(244,146,146,1)','rgba(249,189,154,1)','rgba(136,132,255,1)','rgba(88,106,106,1)']

SEVERITIES = [
    {'name': 'High', 'color': 'rgba(216, 91, 84, 1)'},  # Red
    {'name': 'Critical', 'color': 'rgba(216, 91, 84, 1)'},  # Red
    {'name': 'Medium', 'color': 'rgba(252, 209, 83, 1)'},  # Orange
    {'name': 'Low', 'color': 'rgba(255, 255, 102, 1)'},  # Yellow
    {'name': 'Info', 'color': 'rgba(154, 214, 156, 1)'},  # Green
    {'name': 'Verbose', 'color': 'rgba(133, 163, 198, 1)'}]  # Blue

ACTIVE_COLOR = 'rgb(139, 214, 140)'
BAD_COLOR = 'rgb(204, 120, 120)'
INACTIVE_COLOR = 'rgb(244, 178, 178)'


def report(accounts, config, args):
    '''Create report'''

    # Create directory for output file if it doesn't already exists
    try:
        os.mkdir(os.path.dirname(REPORT_OUTPUT_FILE))
    except OSError:
        # Already exists
        pass

    # Read template
    with open(os.path.join('templates', 'report.html'), 'r') as report_template:
        template = Template(report_template.read())

    # Data to be passed to the template
    t = {}

    # Get account names and id's
    t['accounts'] = []
    for account in accounts:
        t['accounts'].append({
            'name': account['name'],
            'id': account['id'],
            'collection_date': get_collection_date(account)})

    # Get resource count info
    # Collect counts
    account_stats = {}
    print('* Getting resource counts')
    for account in accounts:
        account_stats[account['name']] = get_account_stats(account,args.stats_all_resources)
        print('  - {}'.format(account['name']))

    # Get names of resources
    # TODO: Change the structure passed through here to be a dict of dict's like I do for the regions
    t['resource_names'] = ['']
    # Just look at the resource names of the first account as they are all the same
    first_account = list(account_stats.keys())[0]
    for name in account_stats[first_account]['keys']:
        t['resource_names'].append(name)

    # Create jinja data for the resource stats per account
    t['resource_stats'] = []
    for account in accounts:
        for resource_name in t['resource_names']:
            if resource_name == '':
                resource_row = [account['name']]
            else:
                count = sum(account_stats[account['name']][resource_name].values())
                resource_row.append(count)

        t['resource_stats'].append(resource_row)

    t['resource_names'].pop(0)

    # Get region names
    t['region_names'] = []
    account = accounts[0]
    account = Account(None, account)
    for region in get_regions(account):
        region = Region(account, region)
        t['region_names'].append(region.name)

    # Get stats for the regions
    region_stats = {}
    region_stats_tooltip = {}
    for account in accounts:
        account = Account(None, account)
        region_stats[account.name] = {}
        region_stats_tooltip[account.name] = {}
        for region in get_regions(account):
            region = Region(account, region)
            count = 0
            for resource_name in t['resource_names']:
                n = account_stats[account.name][resource_name].get(region.name, 0)
                count += n

                if n > 0:
                    if region.name not in region_stats_tooltip[account.name]:
                        region_stats_tooltip[account.name][region.name] = ''
                    region_stats_tooltip[account.name][region.name] += '{}:{}<br>'.format(resource_name, n)

            if count > 0:
                has_resources = 'Y'
            else:
                has_resources = 'N'
            region_stats[account.name][region.name] = has_resources

    t['region_stats'] = region_stats
    t['region_stats_tooltip'] = region_stats_tooltip

    # Pass the account names
    t['account_names'] = []
    for a in accounts:
        t['account_names'].append(a['name'])

    t['resource_data_set'] = []

    # Pass data for the resource chart
    color_index = 0
    for resource_name in t['resource_names']:
        resource_counts = []
        for account_name in t['account_names']:
            resource_counts.append(sum(account_stats[account_name][resource_name].values()))

        resource_data = {
            'label': resource_name,
            'data': resource_counts,
            'backgroundColor': COLOR_PALETTE[color_index],
            'borderWidth': 1
        }
        t['resource_data_set'].append(resource_data)

        color_index = (color_index + 1) % len(COLOR_PALETTE)

    # Get IAM access dat
    print('* Getting IAM data')
    t['iam_active_data_set'] = [
        {
            'label': 'Active users',
            'stack': 'users',
            'data': [],
            'backgroundColor': 'rgb(162, 203, 249)',
            'borderWidth': 1
        },
        {
            'label': 'Inactive users',
            'stack': 'users',
            'data': [],
            'backgroundColor': INACTIVE_COLOR,
            'borderWidth': 1
        },
        {
            'label': 'Active roles',
            'stack': 'roles',
            'data': [],
            'backgroundColor': ACTIVE_COLOR,
            'borderWidth': 1
        },
        {
            'label': 'Inactive roles',
            'stack': 'roles',
            'data': [],
            'backgroundColor': INACTIVE_COLOR,
            'borderWidth': 1
        }
    ]

    for account in accounts:
        account = Account(None, account)
        print('  - {}'.format(account.name))

        account_stats = get_access_advisor_active_counts(account, args.max_age)

        # Add to dataset
        t['iam_active_data_set'][0]['data'].append(account_stats['users']['active'])
        t['iam_active_data_set'][1]['data'].append(account_stats['users']['inactive'])
        t['iam_active_data_set'][2]['data'].append(account_stats['roles']['active'])
        t['iam_active_data_set'][3]['data'].append(account_stats['roles']['inactive'])

    print('* Getting public resource data')
    # TODO Need to cache this data as this can take a long time
    t['public_network_resource_type_names'] = ['ec2', 'elb', 'elbv2', 'rds', 'redshift', 'ecs', 'autoscaling', 'cloudfront', 'apigateway']
    t['public_network_resource_types'] = {}

    t['public_ports'] = []
    t['account_public_ports'] = {}

    for account in accounts:
        print('  - {}'.format(account['name']))

        t['public_network_resource_types'][account['name']] = {}
        t['account_public_ports'][account['name']] = {}

        for type_name in t['public_network_resource_type_names']:
            t['public_network_resource_types'][account['name']][type_name] = 0

        public_nodes, _ = get_public_nodes(account, config, use_cache=True)

        for public_node in public_nodes:
            if public_node['type'] in t['public_network_resource_type_names']:
                t['public_network_resource_types'][account['name']][public_node['type']] += 1
            else:
                raise Exception('Unknown type {} of public node'.format(public_node['type']))

            if public_node['ports'] not in t['public_ports']:
                t['public_ports'].append(public_node['ports'])

            t['account_public_ports'][account['name']][public_node['ports']] = t['account_public_ports'][account['name']].get(public_node['ports'], 0) + 1

    # Pass data for the public port chart
    t['public_ports_data_set'] = []
    color_index = 0
    for ports in t['public_ports']:
        port_counts = []
        for account_name in t['account_names']:
            port_counts.append(t['account_public_ports'][account_name].get(ports, 0))

        # Fix the port range name for '' when ICMP is being allowed
        if ports == '':
            ports = 'ICMP only'

        port_data = {
            'label': ports,
            'data': port_counts,
            'backgroundColor': COLOR_PALETTE[color_index],
            'borderWidth': 1
        }
        t['public_ports_data_set'].append(port_data)

        color_index = (color_index + 1) % len(COLOR_PALETTE)

    print('* Auditing accounts')
    findings = audit(accounts)

    with open("audit_config.yaml", 'r') as f:
        audit_config = yaml.safe_load(f)

    t['findings_severity_by_account_chart'] = []

    # Figure out the counts of findings for each account

    # Create chart for finding type counts
    findings_severity_by_account = {}
    for account in accounts:
        findings_severity_by_account[account['name']] = {}
        for severity in SEVERITIES:
            findings_severity_by_account[account['name']][severity['name']] = {}

        for finding in findings:
            conf = audit_config[finding.issue_id]
            sev = conf['severity']
            count = 0
            if sev in findings_severity_by_account[finding.account_name]:
                count = findings_severity_by_account[finding.account_name][sev].get(finding.issue_id, 0)
            findings_severity_by_account[finding.account_name][sev][finding.issue_id] = count + 1

    t['findings_severity_by_account_chart'] = []
    for severity in SEVERITIES:
        severity_counts_by_account = []
        for _ in accounts:
            severity_counts_by_account.append(len(findings_severity_by_account[finding.account_name][severity['name']]))

        t['findings_severity_by_account_chart'].append({
            'label': severity['name'],
            'data': severity_counts_by_account,
            'backgroundColor': severity['color'],
            'borderWidth': 1
        })

    # Create list by severity
    t['severities'] = {}
    for severity in SEVERITIES:
        t['severities'][severity['name']] = {}
    for finding in findings:
        conf = audit_config[finding.issue_id]
        t['severities'][conf['severity']][finding.issue_id] = {
            'title': conf['title'],
            'id': finding.issue_id}
        #t['severities'][severity['name']] = severity_issue_list

    # Create chart for finding counts
    finding_type_set = {}

    for f in findings:
        finding_type_set[f.issue_id] = 1

    t['finding_counts_by_account_chart'] = []
    for finding_type in finding_type_set:
        finding_counts = []
        for account in accounts:
            count = 0
            for severity in findings_severity_by_account[account['name']]:
                count += findings_severity_by_account[account['name']][severity].get(finding_type, 0)
            finding_counts.append(count)

        t['finding_counts_by_account_chart'].append({
            'label': finding_type,
            'data': finding_counts,
            'backgroundColor': COLOR_PALETTE[color_index],
            'borderWidth': 1
        })

        color_index = (color_index + 1) % len(COLOR_PALETTE)

    t['findings'] = {}
    for finding in findings:
        conf = audit_config[finding.issue_id]
        group = t['findings'].get(conf['group'], {})

        # Get the severity struct
        for severity in SEVERITIES:
            if severity['name'] == conf['severity']:
                break

        issue = group.get(finding.issue_id, {
            'title': conf['title'],
            'description': conf.get('description', ''),
            'severity': conf['severity'],
            'severity_color': severity['color'],
            'is_global': conf.get('is_global', False),
            'accounts': {}})

        account_hits = issue['accounts'].get(finding.region.account.local_id,
                                             {
                                                 'account_name': finding.region.account.name,
                                                 'regions': {}
                                             })

        region_hits = account_hits['regions'].get(finding.region.name, {
            'hits': []})

        pprint.pprint(finding.resource_details)
        region_hits['hits'].append({
            'resource': finding.resource_id,
            #'details': json.dumps(finding.resource_details, indent=4)
        })

        account_hits['regions'][finding.region.name] = region_hits
        issue['accounts'][finding.region.account.local_id] = account_hits

        group[finding.issue_id] = issue
        t['findings'][conf['group']] = group

    # Generate report from template
    with open(REPORT_OUTPUT_FILE, 'w') as f:
        f.write(template.render(t=t))

    print('Report written to {}'.format(REPORT_OUTPUT_FILE))


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--max-age",
        help="Number of days a user or role hasn't been used before it's marked inactive",
        default=90,
        type=int)
    parser.add_argument(
        "--stats_all_resources",
        help="Show stats for all resource types",
        action='store_true',
        default=False,
        dest='stats_all_resources')
    args, accounts, config = parse_arguments(arguments, parser)

    report(accounts, config, args)
