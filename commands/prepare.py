"""
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
---------------------------------------------------------------------------
"""

import json
import itertools
import argparse
import pyjq
from netaddr import IPNetwork, IPAddress
from shared.common import get_account, query_aws, get_regions, is_external_cidr
from shared.nodes import Account, Region, Vpc, Az, Subnet, Ec2, Elb, Rds, Cidr, Connection

__description__ = "Generate network connection information file"

MUTE = False

def log(msg):
    if MUTE:
        return
    print(msg)


def get_vpcs(region, outputfilter):
    vpc_filter = ""
    if "vpc-ids" in outputfilter:
        vpc_filter += " | select (.VpcId | contains({}))".format(outputfilter["vpc-ids"])
    if "vpc-names" in outputfilter:
        vpc_filter += ' | select(.Tags != null) | select (.Tags[] | (.Key == "Name") and (.Value | contains({})))'.format(outputfilter["vpc-names"])
    vpcs = query_aws(region.account, "ec2-describe-vpcs", region)
    return pyjq.all('.Vpcs[]{}'.format(vpc_filter), vpcs)


def get_azs(vpc):
    azs = query_aws(vpc.account, "ec2-describe-availability-zones", vpc.region)
    resource_filter = '.AvailabilityZones[]'
    return pyjq.all(resource_filter, azs)


def get_vpc_peerings(region):
    vpc_peerings = query_aws(region.account, "ec2-describe-vpc-peering-connections", region)
    resource_filter = '.VpcPeeringConnections[]'
    return pyjq.all(resource_filter, vpc_peerings)


def get_subnets(az):
    subnets = query_aws(az.account, "ec2-describe-subnets", az.region)
    resource_filter = '.Subnets[] | select(.VpcId == "{}") | select(.AvailabilityZone == "{}")'
    return pyjq.all(resource_filter.format(az.vpc.local_id, az.local_id), subnets)


def get_ec2s(subnet):
    instances = query_aws(subnet.account, "ec2-describe-instances", subnet.region)
    resource_filter = '.Reservations[].Instances[] | select(.SubnetId == "{}") | select(.State.Name == "running")'
    return pyjq.all(resource_filter.format(subnet.local_id), instances)


def get_elbs(subnet):
    # ELBs
    elb_instances = query_aws(subnet.account, "elb-describe-load-balancers", subnet.region)
    elb_resource_filter = '.LoadBalancerDescriptions[] | select(.VPCId == "{}") | select(.Subnets[] == "{}")'
    elbs = pyjq.all(elb_resource_filter.format(subnet.vpc.local_id, subnet.local_id), elb_instances)

    # ALBs and NLBs
    alb_instances = query_aws(subnet.account, "elbv2-describe-load-balancers", subnet.region)
    alb_resource_filter = '.LoadBalancers[] | select(.VpcId == "{}") | select(.AvailabilityZones[].SubnetId == "{}")'
    albs = pyjq.all(alb_resource_filter.format(subnet.vpc.local_id, subnet.local_id), alb_instances)

    return elbs + albs


def get_rds_instances(subnet):
    instances = query_aws(subnet.account, "rds-describe-db-instances", subnet.region)
    resource_filter = '.DBInstances[] | select(.DBSubnetGroup.Subnets != null and .DBSubnetGroup.Subnets[].SubnetIdentifier  == "{}")'
    return pyjq.all(resource_filter.format(subnet.local_id), instances)


def get_sgs(vpc):
    sgs = query_aws(vpc.account, "ec2-describe-security-groups", vpc.region)
    return pyjq.all('.SecurityGroups[] | select(.VpcId == "{}")'.format(vpc.local_id), sgs)


def get_external_cidrs(account, config):
    external_cidrs = []
    unique_cidrs = {}
    for region in account.children:
        for vpc in region.children:
            sgs = get_sgs(vpc)

            # Get external IPs
            for sg in sgs:
                cidrs = pyjq.all('.IpPermissions[].IpRanges[].CidrIp', sg)
                for cidr in cidrs:
                    unique_cidrs[cidr] = 1

    # Remove private CIDR ranges
    for cidr in unique_cidrs.keys():
        if is_external_cidr(cidr):
            # It's something else, so add it
            external_cidrs.append(Cidr(cidr, get_cidr_name(cidr, config)))
    return external_cidrs


def get_cidr_name(cidr, config):
    return config["cidrs"].get(cidr, {}).get("name", None)


def add_connection(connections, source, target, reason):
    reasons = connections.get(Connection(source, target), [])
    reasons.append(reason)
    connections[Connection(source, target)] = reasons


def get_connections(cidrs, vpc, outputfilter):
    """
    For a VPC, for each instance, find all of the other instances that can connect to it,
    including those in peered VPCs.
    Note I do not consider subnet ACLs, routing tables, or some other network concepts.
    """
    connections = {}

    # Get mapping of security group names to nodes that have that security group
    sg_to_instance_mapping = {}
    for instance in vpc.leaves:
        for sg in instance.security_groups():
            sg_to_instance_mapping.setdefault(sg, {})[instance] = True

    # For each security group, find all the instances that are allowed to connect to instances
    # within that group.
    for sg in get_sgs(vpc):
        # Get the CIDRs that are allowed to connect
        for cidr in pyjq.all('.IpPermissions[].IpRanges[].CidrIp', sg):
            if not is_external_cidr(cidr):
                # This is a private IP, ex. 10.0.0.0/16

                # See if we should skip this
                if not outputfilter["internal_edges"]:
                    continue

                # Find all instances in this VPC and peered VPCs that are in this CIDR
                for sourceVpc in itertools.chain(vpc.peers, (vpc,)):

                    # Ensure it is possible for instances in this VPC to be in the CIDR
                    if not (IPNetwork(sourceVpc.cidr) in IPNetwork(cidr) or
                            IPNetwork(cidr) in IPNetwork(sourceVpc.cidr)):
                        # The CIDR from the security group does not overlap with the CIDR of the VPC,
                        # so skip it
                        continue

                    # For each instance, check if one of its IPs is within the CIDR
                    for sourceInstance in sourceVpc.leaves:
                        for ip in sourceInstance.ips:
                            if IPAddress(ip) in IPNetwork(cidr):
                                # Instance found that can connect to instances in the SG
                                # So connect this instance (sourceInstance) to every instance
                                # in the SG.
                                for targetInstance in sg_to_instance_mapping.get(sg["GroupId"], {}):
                                    add_connection(connections, sourceInstance, targetInstance, sg)

            else:
                # This is an external IP (ie. not in a private range).
                for instance in sg_to_instance_mapping.get(sg["GroupId"], {}):
                    # Ensure it has a public IP, as resources with only private IPs can't be reached
                    if instance.is_public:
                        cidrs[cidr].is_used = True
                        add_connection(connections, cidrs[cidr], instance, sg)

        if outputfilter["internal_edges"]:
            # Connect allowed in Security Groups
            for ingress_sg in pyjq.all('.IpPermissions[].UserIdGroupPairs[].GroupId', sg):
                # We have an SG and a list of SG's it allows in
                for target in sg_to_instance_mapping.get(sg["GroupId"], {}):
                    # We have an instance and a list of SG's it allows in
                    for source in sg_to_instance_mapping.get(ingress_sg, {}):
                        if (not outputfilter["inter_rds_edges"] and
                                (source.node_type == "rds" or source.node_type == "rds_rr") and
                                (target.node_type == "rds" or target.node_type == "rds_rr")):
                            continue
                        add_connection(connections, source, target, sg)

    return connections


def build_data_structure(account_data, config, outputfilter):
    cytoscape_json = []

    if outputfilter.get('mute', False):
        global MUTE
        MUTE = True

    account = Account(None, account_data)
    log("Building data for account {} ({})".format(account.name, account.local_id))

    cytoscape_json.append(account.cytoscape_data())
    for region_json in get_regions(account, outputfilter):
        node_count_per_region = 0
        region = Region(account, region_json)

        for vpc_json in get_vpcs(region, outputfilter):
            vpc = Vpc(region, vpc_json)

            for az_json in get_azs(vpc):
                # Availibility zones are not a per VPC construct, but VPC's can span AZ's,
                # so I make VPC a higher level construct
                az = Az(vpc, az_json)

                for subnet_json in get_subnets(az):
                    # If we ignore AZz, then tie the subnets up the VPC as the parent
                    if outputfilter["azs"]:
                        parent = az
                    else:
                        parent = vpc

                    subnet = Subnet(parent, subnet_json)

                    # Get EC2's
                    for ec2_json in get_ec2s(subnet):
                        ec2 = Ec2(subnet, ec2_json,
                                  outputfilter["collapse_by_tag"],
                                  outputfilter["collapse_asgs"])
                        subnet.addChild(ec2)

                    # Get RDS's
                    for rds_json in get_rds_instances(subnet):
                        rds = Rds(subnet, rds_json)
                        if not outputfilter["read_replicas"] and rds.node_type == "rds_rr":
                            continue
                        subnet.addChild(rds)

                    # Get ELB's
                    for elb_json in get_elbs(subnet):
                        elb = Elb(subnet, elb_json)
                        subnet.addChild(elb)

                    # If there are leaves, then add this subnet to the final graph
                    if len(subnet.leaves) > 0:
                        node_count_per_region += len(subnet.leaves)
                        for leaf in subnet.leaves:
                            cytoscape_json.append(leaf.cytoscape_data())
                        cytoscape_json.append(subnet.cytoscape_data())
                        az.addChild(subnet)

                if az.has_leaves:
                    if outputfilter["azs"]:
                        cytoscape_json.append(az.cytoscape_data())
                    vpc.addChild(az)

            if vpc.has_leaves:
                cytoscape_json.append(vpc.cytoscape_data())
                region.addChild(vpc)

        if region.has_leaves:
            cytoscape_json.append(region.cytoscape_data())
            account.addChild(region)

        log("- {} nodes built in region {}".format(node_count_per_region, region.local_id))

    # Get VPC peerings
    for region in account.children:
        for vpc_peering in get_vpc_peerings(region):
            # For each peering, find the accepter and the requester
            accepter_id = vpc_peering["AccepterVpcInfo"]["VpcId"]
            requester_id = vpc_peering["RequesterVpcInfo"]["VpcId"]
            accepter = None
            requester = None
            for vpc in region.children:
                if accepter_id == vpc.local_id:
                    accepter = vpc
                if requester_id == vpc.local_id:
                    requester = vpc
            # If both have been found, add each as peers to one another
            if accepter and requester:
                accepter.addPeer(requester)
                requester.addPeer(accepter)

    # Get external cidr nodes
    cidrs = {}
    for cidr in get_external_cidrs(account, config):
        cidrs[cidr.arn] = cidr

    # Find connections between nodes
    # Only looking at Security Groups currently, which are a VPC level construct
    connections = {}
    for region in account.children:
        for vpc in region.children:
            for c, reasons in get_connections(cidrs, vpc, outputfilter).items():
                r = connections.get(c, [])
                r.extend(reasons)
                connections[c] = r

    # Add external cidr nodes
    used_cidrs = 0
    for _, cidr in cidrs.items():
        if cidr.is_used:
            used_cidrs += 1
            cytoscape_json.append(cidr.cytoscape_data())
    log("- {} external CIDRs built".format(used_cidrs))

    total_number_of_nodes = len(cytoscape_json)

    # Add the mapping to our graph
    for c, reasons in connections.items():
        if c.source == c.target:
            # Ensure we don't add connections with the same nodes on either side
            continue
        c._json = reasons
        cytoscape_json.append(c.cytoscape_data())
    log("- {} connections built".format(len(connections)))

    # Check if we have a lot of data, and if so, show a warning
    # Numbers chosen here are arbitrary
    MAX_NODES_FOR_WARNING = 200
    MAX_EDGES_FOR_WARNING = 500
    if total_number_of_nodes > MAX_NODES_FOR_WARNING or len(connections) > MAX_EDGES_FOR_WARNING:
        log("WARNING: There are {} total nodes and {} total edges.".format(total_number_of_nodes, len(connections)))
        log("  This will be difficult to display and may be too complex to make sense of.")
        log("  Consider reducing the number of items in the diagram by viewing a single")
        log("   region, ignoring internal edges, or other filtering.")

    return cytoscape_json


def prepare(account, config, outputfilter):
    """Collect the data and write it to a file"""
    cytoscape_json = build_data_structure(account, config, outputfilter)

    with open('web/data.json', 'w') as outfile:
        json.dump(cytoscape_json, outfile, indent=4)
def run(arguments):
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Config file name",
                        default="config.json", type=str)
    parser.add_argument("--account", help="Account to collect from",
                        required=False, type=str, dest='account_name')
    parser.add_argument("--regions", help="Regions to restrict to (ex. us-east-1,us-west-2)",
                        default=None, type=str)
    parser.add_argument("--vpc-ids", help="VPC ids to restrict to (ex. vpc-1234,vpc-abcd)",
                        default=None, type=str)
    parser.add_argument("--vpc-names", help="VPC names to restrict to (ex. prod,dev)",
                        default=None, type=str)
    parser.add_argument("--internal-edges", help="Show all connections (default)",
                        dest='internal_edges', action='store_true')
    parser.add_argument("--no-internal-edges", help="Only show connections to external CIDRs",
                        dest='internal_edges', action='store_false')
    parser.add_argument("--inter-rds-edges", help="Show connections between RDS instances",
                        dest='inter_rds_edges', action='store_true')
    parser.add_argument("--no-inter-rds-edges", help="Do not show connections between RDS instances (default)",
                        dest='inter_rds_edges', action='store_false')
    parser.add_argument("--read-replicas", help="Show RDS read replicas (default)",
                        dest='read_replicas', action='store_true')
    parser.add_argument("--no-read-replicas", help="Do not show RDS read replicas",
                        dest='read_replicas', action='store_false')
    parser.add_argument("--azs", help="Show availability zones (default)",
                        dest='azs', action='store_true')
    parser.add_argument("--no-azs", help="Do not show availability zones",
                        dest='azs', action='store_false')
    parser.add_argument("--collapse-by-tag", help="Collapse nodes with the same tag to a single node",
                        dest='collapse_by_tag', default=None, type=str)
    parser.add_argument("--collapse-asgs", help="Show a single node for Auto Scaling Groups instead of all contained instances (default)",
                        dest='collapse_asgs', action='store_true')
    parser.add_argument("--no-collapse-asgs", help="Show all EC2 instances of Auto Scaling Groups",
                        dest='collapse_asgs', action='store_false')

    parser.set_defaults(internal_edges=True)
    parser.set_defaults(inter_rds_edges=False)
    parser.set_defaults(read_replicas=True)
    parser.set_defaults(azs=True)
    parser.set_defaults(collapse_asgs=True)

    args = parser.parse_args(arguments)

    outputfilter = {}
    if args.regions:
        # Regions are given as 'us-east-1,us-west-2'. Split this by the comma,
        # wrap each with quotes, and add the comma back. This is needed for how we do filtering.
        outputfilter["regions"] = ','.join(['"' + r + '"' for r in args.regions.split(',')])
    if args.vpc_ids:
        outputfilter["vpc-ids"] = ','.join(['"' + r + '"' for r in args.vpc_ids.split(',')])
    if args.vpc_names:
        outputfilter["vpc-names"] = ','.join(['"' + r + '"' for r in args.vpc_names.split(',')])

    outputfilter["internal_edges"] = args.internal_edges
    outputfilter["read_replicas"] = args.read_replicas
    outputfilter["inter_rds_edges"] = args.inter_rds_edges
    outputfilter["azs"] = args.azs
    outputfilter["collapse_by_tag"] = args.collapse_by_tag
    outputfilter["collapse_asgs"] = args.collapse_asgs

    # Read accounts file
    try:
        config = json.load(open(args.config))
    except IOError:
        exit("ERROR: Unable to load config file \"{}\"".format(args.config))
    except ValueError as e:
        exit("ERROR: Config file \"{}\" could not be loaded ({}), see config.json.demo for an example".format(args.config, e))
    account = get_account(args.account_name, config, args.config)

    prepare(account, config, outputfilter)
