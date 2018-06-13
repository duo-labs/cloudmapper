from __future__ import print_function
import sys
import json
import pyjq
from shared.common import parse_arguments
from commands.prepare import build_data_structure

__description__ = "Find publicly exposed services and their ports"

# TODO Look for IPv6 also
# TODO Look at more services from https://github.com/arkadiyt/aws_public_ips
# TODO Integrate into something to more easily port scan and screenshot web services

def regroup_ranges(rgs):
    """
    Functions to reduce sets of ranges.

    Examples:
    [[80,80],[80,80]] -> [80,80]
    [[80,80],[0,65000]] -> [0,65000]

    Taken from https://stackoverflow.com/questions/47656430/given-a-list-of-tuples-representing-ranges-condense-the-ranges-write-a-functio
    """

    def overlap(r1, r2):
        """
        Check for overlap in ranges.
        Returns -1 to ensure ranges like (2, 3) and (4, 5) merge into (2, 5)
        """
        return r1[1] >= r2[0] - 1

    def merge_range(r1, r2):
        s1, e1 = r1
        s2, e2 = r2
        return (min(s1, s2), max(e1, e2))

    assert all([s <= e for s, e in rgs])
    if len(rgs) == 0:
        return rgs

    rgs.sort()

    regrouped = [rgs[0]]

    for r2 in rgs[1:]:
        r1 = regrouped.pop()
        if overlap(r1, r2):
            regrouped.append(merge_range(r1, r2))
        else:
            regrouped.append(r1)
            regrouped.append(r2)

    return regrouped


def port_ranges_string(port_ranges):
    """
    Given an array of tuple port ranges return a string that makes this more readable.
    Ex. [[80,80],[443,445]] -> "80,443-445"
    """

    def port_range_string(port_range):
        if port_range[0] == port_range[1]:
            return '{}'.format(port_range[0])
        return '{}-{}'.format(port_range[0], port_range[1])
    return ','.join(map(port_range_string, port_ranges))


def log_warning(msg):
    print('WARNING: {}'.format(msg), file=sys.stderr)


def public(accounts, config):
    for account in accounts:
        # Get the data from the `prepare` command
        outputfilter = {'internal_edges': False, 'read_replicas': False, 'inter_rds_edges': False, 'azs': False, 'collapse_by_tag': None, 'mute': True}
        network = build_data_structure(account, config, outputfilter)

        # Look at all the edges for ones connected to the public Internet (0.0.0.0/0)
        for edge in pyjq.all('.[].data|select(.type=="edge")|select(.source=="0.0.0.0/0")', network):

            # Find the node at the other end of this edge
            target = {'arn': edge['target'], 'account': account['name']}
            target_node = pyjq.first('.[].data|select(.id=="{}")'.format(target['arn']), network, {})

            # Depending on the type of node, identify what the IP or hostname is
            if target_node['type'] == 'elb':
                target['type'] = 'elb'
                target['hostname'] = target_node['node_data']['DNSName']
            elif target_node['type'] == 'autoscaling':
                target['type'] = 'autoscaling'
                target['hostname'] = target_node['node_data'].get('PublicIpAddress', '')
                if target['hostname'] == '':
                    target['hostname'] = target_node['node_data']['PublicDnsName']
            elif target_node['type'] == 'rds':
                target['type'] = 'rds'
                target['hostname'] = target_node['node_data']['Endpoint']['Address']
            elif target_node['type'] == 'ec2':
                target['type'] = 'ec2'
                dns_name = target_node['node_data'].get('PublicDnsName', '')
                target['hostname'] = target_node['node_data'].get('PublicIpAddress', dns_name)
            else:
                print(pyjq.first('.[].data|select(.id=="{}")|[.type, (.node_data|keys)]'.format(target['arn']), network, {}))

            # Check if any protocol is allowed (indicated by IpProtocol == -1)
            ingress = pyjq.all('.[].IpPermissions[]', edge.get('node_data', {}))
            if pyjq.first('.[]|select(.IpProtocol=="-1")|.IpProtocol', ingress, '1') == '-1':
                log_warning('All protocols allowed access to {}'.format(target))
                range_string = '0-65535'
            else:
                # from_port and to_port mean the beginning and end of a port range
                # We only care about TCP (6) and UDP (17)
                # For more info see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html
                selection = 'select((.IpProtocol=="tcp") or (.IpProtocol=="udp")) | select(.IpRanges[].CidrIp=="0.0.0.0/0")'
                port_ranges = pyjq.all('.[]|{}| [.FromPort,.ToPort]'.format(selection), ingress)
                range_string = port_ranges_string(regroup_ranges(port_ranges))

            target['ports'] = range_string
            if target['ports'] == "":
                issue_msg = 'No ports open for tcp or udp (probably can only be pinged). Rules that are not tcp or udp: {} -- {}'
                log_warning(issue_msg.format(json.dumps(pyjq.all('.[]|select((.IpProtocol!="tcp") and (.IpProtocol!="udp"))'.format(selection), ingress)), account))
            print(json.dumps(target, indent=4, sort_keys=True))


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    public(accounts, config)
