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
import operator
import itertools
import argparse
import pyjq
import copy
import urllib.parse
from netaddr import IPNetwork, IPAddress
from shared.common import get_account, get_regions, is_external_cidr
from shared.query import query_aws, get_parameter_file
from shared.nodes import (
    Account,
    Region,
    Vpc,
    Az,
    Subnet,
    Ec2,
    Elb,
    Elbv2,
    Rds,
    VpcEndpoint,
    Ecs,
    Lambda,
    Redshift,
    ElasticSearch,
    Cidr,
    Connection,
)

__description__ = "Generate network connection information file"

MUTE = False


def log(msg):
    if MUTE:
        return
    print(msg)


def get_vpcs(region, outputfilter):
    vpc_filter = ""
    if "vpc-ids" in outputfilter:
        vpc_filter += " | select (.VpcId | contains({}))".format(
            outputfilter["vpc-ids"]
        )
    if "vpc-names" in outputfilter:
        vpc_filter += ' | select(.Tags != null) | select (.Tags[] | (.Key == "Name") and (.Value | contains({})))'.format(
            outputfilter["vpc-names"]
        )
    vpcs = query_aws(region.account, "ec2-describe-vpcs", region)
    return pyjq.all(".Vpcs[]?{}".format(vpc_filter), vpcs)


def get_azs(vpc):
    azs = query_aws(vpc.account, "ec2-describe-availability-zones", vpc.region)
    resource_filter = ".AvailabilityZones[]"
    return pyjq.all(resource_filter, azs)


def get_vpc_peerings(region):
    vpc_peerings = query_aws(
        region.account, "ec2-describe-vpc-peering-connections", region
    )
    resource_filter = ".VpcPeeringConnections[]?"
    return pyjq.all(resource_filter, vpc_peerings)


def get_subnets(az):
    subnets = query_aws(az.account, "ec2-describe-subnets", az.region)
    resource_filter = (
        '.Subnets[] | select(.VpcId == "{}") | select(.AvailabilityZone == "{}")'
    )
    return pyjq.all(resource_filter.format(az.vpc.local_id, az.local_id), subnets)


def get_ec2s(region):
    instances = query_aws(region.account, "ec2-describe-instances", region.region)
    resource_filter = '.Reservations[]?.Instances[] | select(.State.Name == "running")'
    return pyjq.all(resource_filter, instances)


def get_elbs(region):
    load_balancers = query_aws(
        region.account, "elb-describe-load-balancers", region.region
    )
    return pyjq.all(".LoadBalancerDescriptions[]?", load_balancers)


def get_elbv2s(region):
    # ALBs and NLBs
    load_balancers = query_aws(
        region.account, "elbv2-describe-load-balancers", region.region
    )
    return pyjq.all(".LoadBalancers[]?", load_balancers)


def get_vpc_endpoints(region):
    endpoints = query_aws(region.account, "ec2-describe-vpc-endpoints", region.region)
    return pyjq.all(".VpcEndpoints[]?", endpoints)


def get_rds_instances(region):
    instances = query_aws(region.account, "rds-describe-db-instances", region.region)
    return pyjq.all(".DBInstances[]?", instances)


def get_ecs_tasks(region):
    tasks = []
    clusters = query_aws(region.account, "ecs-list-clusters", region.region)
    for clusterArn in clusters.get("clusterArns", []):
        tasks_json = get_parameter_file(region, "ecs", "list-tasks", clusterArn)
        for taskArn in tasks_json["taskArns"]:
            task_path = "account-data/{}/{}/{}/{}/{}".format(
                region.account.name,
                region.region.name,
                "ecs-describe-tasks",
                urllib.parse.quote_plus(clusterArn),
                urllib.parse.quote_plus(taskArn),
            )
            task = json.load(open(task_path))
            for task in task["tasks"]:
                tasks.append(task)
    return tasks


def get_lambda_functions(region):
    functions = query_aws(region.account, "lambda-list-functions", region.region)
    return pyjq.all(".Functions[]?|select(.VpcConfig!=null)", functions)


def get_redshift(region):
    clusters = query_aws(region.account, "redshift-describe-clusters", region.region)
    return pyjq.all(".Clusters[]?", clusters)


def get_elasticsearch(region):
    es_domains = []
    domain_json = query_aws(region.account, "es-list-domain-names", region.region)
    domains = pyjq.all(".DomainNames[]?", domain_json)
    for domain in domains:
        es = get_parameter_file(
            region, "es", "describe-elasticsearch-domain", domain["DomainName"]
        )["DomainStatus"]
        if "VPCOptions" in es:
            es_domains.append(es)
    return es_domains


def get_sgs(vpc):
    sgs = query_aws(vpc.account, "ec2-describe-security-groups", vpc.region)
    return pyjq.all(
        '.SecurityGroups[]? | select(.VpcId == "{}")'.format(vpc.local_id), sgs
    )


def get_external_cidrs(account, config):
    external_cidrs = []
    unique_cidrs = {}
    for region in account.children:
        for vpc in region.children:
            sgs = get_sgs(vpc)

            # Get external IPs
            for sg in sgs:
                cidrs = pyjq.all(".IpPermissions[].IpRanges[].CidrIp", sg)
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
        for sg in instance.security_groups:
            sg_to_instance_mapping.setdefault(sg, {})[instance] = True

    # For each security group, find all the instances that are allowed to connect to instances
    # within that group.
    for sg in get_sgs(vpc):
        # Get the CIDRs that are allowed to connect
        for cidr in pyjq.all(".IpPermissions[].IpRanges[].CidrIp", sg):
            if not is_external_cidr(cidr):
                # This is a private IP, ex. 10.0.0.0/16

                # See if we should skip this
                if not outputfilter.get("internal_edges", True):
                    continue

                # Find all instances in this VPC and peered VPCs that are in this CIDR
                for sourceVpc in itertools.chain(vpc.peers, (vpc,)):

                    # Ensure it is possible for instances in this VPC to be in the CIDR
                    if not (
                        IPNetwork(sourceVpc.cidr) in IPNetwork(cidr)
                        or IPNetwork(cidr) in IPNetwork(sourceVpc.cidr)
                    ):
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
                                for targetInstance in sg_to_instance_mapping.get(
                                    sg["GroupId"], {}
                                ):
                                    add_connection(
                                        connections, sourceInstance, targetInstance, sg
                                    )

            else:
                # This is an external IP (ie. not in a private range).
                for instance in sg_to_instance_mapping.get(sg["GroupId"], {}):
                    # Ensure it has a public IP, as resources with only private IPs can't be reached
                    if instance.is_public:
                        cidrs[cidr].is_used = True
                        add_connection(connections, cidrs[cidr], instance, sg)
                    else:
                        if cidr == "0.0.0.0/0":
                            # Resource is not public, but allows anything to access it,
                            # so mark set all the resources in the VPC as allowing access to it.
                            for source_instance in vpc.leaves:
                                add_connection(
                                    connections, source_instance, instance, sg
                                )

        if outputfilter.get("internal_edges", True):
            # Connect allowed in Security Groups
            for ingress_sg in pyjq.all(
                ".IpPermissions[].UserIdGroupPairs[].GroupId", sg
            ):
                # We have an SG and a list of SG's it allows in
                for target in sg_to_instance_mapping.get(sg["GroupId"], {}):
                    # We have an instance and a list of SG's it allows in
                    for source in sg_to_instance_mapping.get(ingress_sg, {}):
                        if (
                            not outputfilter.get("inter_rds_edges", True)
                            and (
                                source.node_type == "rds"
                                or source.node_type == "rds_rr"
                            )
                            and (
                                target.node_type == "rds"
                                or target.node_type == "rds_rr"
                            )
                        ):
                            continue
                        add_connection(connections, source, target, sg)

    # Connect everything to the Gateway endpoints
    for targetResource in vpc.leaves:
        if targetResource.has_unrestricted_ingress:
            for sourceVpc in itertools.chain(vpc.peers, (vpc,)):
                for sourceResource in sourceVpc.leaves:
                    add_connection(connections, sourceResource, targetResource, [])

    # Remove connections for source nodes that cannot initiate traffic (ex. VPC endpoints)
    for connection in list(connections):
        if not connection.source.can_egress:
            del connections[connection]

    return connections


def add_node_to_subnets(region, node, nodes):
    """
    Given a node, find all the subnets it thinks it belongs to,
    and duplicate it and add it a child of those subnets
    """

    # Remove node from dictionary
    del nodes[node.arn]

    # Add a new node (potentially the same one) back to the dictionary
    for vpc in region.children:
        if len(node.subnets) == 0 and node._parent and vpc.local_id == node._parent.local_id:
            # VPC Gateway Endpoints (S3 and DynamoDB) reside in a VPC, not a subnet
            # So set the relationship between the VPC and the node
            nodes[node.arn] = node
            vpc.addChild(node)
            break

        for az in vpc.children:
            for subnet in az.children:
                for node_subnet in node.subnets:
                    if node_subnet == subnet.local_id:
                        # Copy the node
                        subnet_node = copy.copy(node)
                        # Set the subnet name on the copy, and potentially a new arn
                        subnet_node.set_subnet(subnet)

                        # Add to the set
                        nodes[subnet_node.arn] = subnet_node
                        subnet.addChild(subnet_node)


def get_resource_nodes(region, outputfilter):
    nodes = {}
    # EC2 nodes
    for ec2_json in get_ec2s(region):
        node = Ec2(
            region,
            ec2_json,
            outputfilter.get("collapse_by_tag", False),
            outputfilter.get("collapse_asgs", False),
        )
        nodes[node.arn] = node

    # RDS nodes
    for rds_json in get_rds_instances(region):
        node = Rds(region, rds_json)
        if not outputfilter.get("read_replicas", False) and node.node_type == "rds_rr":
            continue
        nodes[node.arn] = node

    # ELB nodes
    for elb_json in get_elbs(region):
        node = Elb(region, elb_json)
        nodes[node.arn] = node

    for elb_json in get_elbv2s(region):
        node = Elbv2(region, elb_json)
        nodes[node.arn] = node

    # PrivateLink and VPC Endpoints
    for vpc_endpoint_json in get_vpc_endpoints(region):
        node = VpcEndpoint(region, vpc_endpoint_json)
        nodes[node.arn] = node

    # ECS tasks
    for ecs_json in get_ecs_tasks(region):
        node = Ecs(region, ecs_json)
        nodes[node.arn] = node

    # Lambda functions
    for lambda_json in get_lambda_functions(region):
        node = Lambda(region, lambda_json)
        nodes[node.arn] = node

    # Redshift clusters
    for node_json in get_redshift(region):
        node = Redshift(region, node_json)
        nodes[node.arn] = node

    # ElasticSearch clusters
    for node_json in get_elasticsearch(region):
        node = ElasticSearch(region, node_json)
        nodes[node.arn] = node

    return nodes


def build_data_structure(account_data, config, outputfilter):
    cytoscape_json = []

    if outputfilter.get("mute", False):
        global MUTE
        MUTE = True

    account = Account(None, account_data)
    log("Building data for account {} ({})".format(account.name, account.local_id))

    cytoscape_json.append(account.cytoscape_data())

    # Iterate through each region and add all the VPCs, AZs, and Subnets
    for region_json in get_regions(account, outputfilter):
        region = Region(account, region_json)

        # Build the tree hierarchy
        for vpc_json in get_vpcs(region, outputfilter):
            vpc = Vpc(region, vpc_json)

            for az_json in get_azs(vpc):
                # Availibility zones are not a per VPC construct, but VPC's can span AZ's,
                # so I make VPC a higher level construct
                az = Az(vpc, az_json)

                for subnet_json in get_subnets(az):
                    # If we ignore AZz, then tie the subnets up the VPC as the parent
                    if outputfilter.get("azs", False):
                        parent = az
                    else:
                        parent = vpc

                    subnet = Subnet(parent, subnet_json)
                    az.addChild(subnet)
                vpc.addChild(az)
            region.addChild(vpc)
        account.addChild(region)

        # In each region, iterate through all the resource types
        nodes = get_resource_nodes(region, outputfilter)

        # Filter out nodes based on tags
        if len(outputfilter.get("tags", [])) > 0:
            for node_id in list(nodes):
                has_match = False
                node = nodes[node_id]
                # For each node, look to see if its tags match one of the tag sets
                # Ex. --tags Env=Prod --tags Team=Dev,Name=Bastion
                for tag_set in outputfilter.get("tags", []):
                    conditions = [c.split("=") for c in tag_set.split(",")]
                    condition_matches = 0
                    # For a tag set, see if all conditions match, ex. [["Team","Dev"],["Name","Bastion"]]
                    for pair in conditions:
                        # Given ["Team","Dev"], see if it matches one of the tags in the node
                        if node.tags:
                            for tag in node.tags:
                                if (
                                    tag.get("Key", "") == pair[0]
                                    and tag.get("Value", "") == pair[1]
                                ):
                                    condition_matches += 1
                    # We have a match if all of the conditions matched
                    if condition_matches == len(conditions):
                        has_match = True

                # If there were no matches, remove the node
                if not has_match:
                    del nodes[node_id]

        # Add the nodes to their respective subnets
        for node_arn in list(nodes):
            node = nodes[node_arn]
            add_node_to_subnets(region, node, nodes)

        # From the root of the tree (the account), add in the children if there are leaves
        # If not, mark the item for removal
        if region.has_leaves:
            cytoscape_json.append(region.cytoscape_data())

            region_children_to_remove = set()
            for vpc in region.children:
                if vpc.has_leaves:
                    cytoscape_json.append(vpc.cytoscape_data())

                    vpc_children_to_remove = set()
                    for vpc_child in vpc.children:
                        if vpc_child.has_leaves:
                            if outputfilter.get("azs", False):
                                cytoscape_json.append(vpc_child.cytoscape_data())
                            elif vpc_child.node_type != "az":
                                # Add VPC children that are not AZs, such as Gateway endpoints
                                cytoscape_json.append(vpc_child.cytoscape_data())

                            az_children_to_remove = set()
                            for subnet in vpc_child.children:
                                if subnet.has_leaves:
                                    cytoscape_json.append(subnet.cytoscape_data())

                                    for leaf in subnet.leaves:
                                        cytoscape_json.append(
                                            leaf.cytoscape_data(subnet.arn)
                                        )
                                else:
                                    az_children_to_remove.add(subnet)
                            for subnet in az_children_to_remove:
                                vpc_child.removeChild(subnet)
                        else:
                            vpc_children_to_remove.add(vpc_child)
                    for az in vpc_children_to_remove:
                        vpc.removeChild(az)
                else:
                    region_children_to_remove.add(vpc)
            for vpc in region_children_to_remove:
                region.removeChild(vpc)

        log("- {} nodes built in region {}".format(len(nodes), region.local_id))

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

    #
    # Collapse CIDRs
    #

    # Get a list of the current CIDRs
    current_cidrs = []
    for cidr_string in cidrs:
        current_cidrs.append(cidr_string)

    # Iterate through them
    for cidr_string in current_cidrs:
        # Find CIDRs in the config that our CIDR falls inside
        # It may fall inside multiple ranges
        matching_known_cidrs = {}
        for named_cidr in config["cidrs"]:
            if IPNetwork(cidr_string) in IPNetwork(named_cidr):
                # Match found
                matching_known_cidrs[named_cidr] = IPNetwork(named_cidr).size

        if len(matching_known_cidrs) > 0:
            # A match was found. Find the smallest matching range.
            sorted_matches = sorted(
                matching_known_cidrs.items(), key=operator.itemgetter(1)
            )
            # Get first item to get (CIDR,size); and first item of that to get just the CIDR
            smallest_matched_cidr_string = sorted_matches[0][0]
            smallest_matched_cidr_name = config["cidrs"][smallest_matched_cidr_string][
                "name"
            ]

            # Check if we have a CIDR node that doesn't match the smallest one possible.
            if (
                cidrs[cidr_string].name
                != config["cidrs"][smallest_matched_cidr_string]["name"]
            ):
                # See if we need to create the larger known range
                if cidrs.get(smallest_matched_cidr_string, "") == "":
                    cidrs[smallest_matched_cidr_string] = Cidr(
                        smallest_matched_cidr_string, smallest_matched_cidr_name
                    )

                # The existing CIDR node needs to be removed and rebuilt as the larger known range
                del cidrs[cidr_string]

                # Get the larger known range
                new_source = cidrs[smallest_matched_cidr_string]
                new_source.is_used = True

                # Find all the connections to the old node
                connections_to_remove = []
                for c in connections:
                    if c.source.node_type == "ip" and c.source.arn == cidr_string:
                        connections_to_remove.append(c)

                # Create new connections to the new node
                for c in connections_to_remove:
                    r = connections[c]
                    del connections[c]
                    connections[Connection(new_source, c._target)] = r

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
    if (
        total_number_of_nodes > MAX_NODES_FOR_WARNING
        or len(connections) > MAX_EDGES_FOR_WARNING
    ):
        log(
            "WARNING: There are {} total nodes and {} total edges.".format(
                total_number_of_nodes, len(connections)
            )
        )
        log(
            "  This will be difficult to display and may be too complex to make sense of."
        )
        log(
            "  Consider reducing the number of items in the diagram by viewing a single"
        )
        log("   region, ignoring internal edges, or other filtering.")

    return cytoscape_json


def prepare(account, config, outputfilter):
    """Collect the data and write it to a file"""
    cytoscape_json = build_data_structure(account, config, outputfilter)
    if not outputfilter["node_data"]:
        filtered_cytoscape_json=[]
        for node in cytoscape_json:
            filtered_node = node.copy()
            filtered_node['data']['node_data'] = {}
            filtered_cytoscape_json.append(filtered_node)
        cytoscape_json = filtered_cytoscape_json
    with open("web/data.json", "w") as outfile:
        json.dump(cytoscape_json, outfile, indent=4)


def run(arguments):
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config", help="Config file name", default="config.json", type=str
    )
    parser.add_argument(
        "--account",
        help="Account to collect from",
        required=False,
        type=str,
        dest="account_name",
    )
    parser.add_argument(
        "--regions",
        help="Regions to restrict to (ex. us-east-1,us-west-2)",
        default=None,
        type=str,
    )
    parser.add_argument(
        "--vpc-ids",
        help="VPC ids to restrict to (ex. vpc-1234,vpc-abcd)",
        default=None,
        type=str,
    )
    parser.add_argument(
        "--vpc-names",
        help="VPC names to restrict to (ex. prod,dev)",
        default=None,
        type=str,
    )
    parser.add_argument(
        "--tags",
        help="Filter nodes matching tags (ex. Name=batch,Env=prod), where the tag matches are AND'd together. Use this tag multiple times to OR sets (ex. --tags Env=prod --tags Env=Dev)",
        dest="tags",
        default=None,
        type=str,
        action="append",
    )
    parser.add_argument(
        "--internal-edges",
        help="Show all connections (default)",
        dest="internal_edges",
        action="store_true",
    )
    parser.add_argument(
        "--no-internal-edges",
        help="Only show connections to external CIDRs",
        dest="internal_edges",
        action="store_false",
    )
    parser.add_argument(
        "--inter-rds-edges",
        help="Show connections between RDS instances",
        dest="inter_rds_edges",
        action="store_true",
    )
    parser.add_argument(
        "--no-inter-rds-edges",
        help="Do not show connections between RDS instances (default)",
        dest="inter_rds_edges",
        action="store_false",
    )
    parser.add_argument(
        "--read-replicas",
        help="Show RDS read replicas (default)",
        dest="read_replicas",
        action="store_true",
    )
    parser.add_argument(
        "--no-read-replicas",
        help="Do not show RDS read replicas",
        dest="read_replicas",
        action="store_false",
    )
    parser.add_argument(
        "--azs",
        help="Show availability zones (default)",
        dest="azs",
        action="store_true",
    )
    parser.add_argument(
        "--no-azs",
        help="Do not show availability zones",
        dest="azs",
        action="store_false",
    )
    parser.add_argument(
        "--collapse-by-tag",
        help="Collapse nodes with the same tag to a single node",
        dest="collapse_by_tag",
        default=None,
        type=str,
    )
    parser.add_argument(
        "--collapse-asgs",
        help="Show a single node for Auto Scaling Groups instead of all contained instances (default)",
        dest="collapse_asgs",
        action="store_true",
    )
    parser.add_argument(
        "--no-collapse-asgs",
        help="Show all EC2 instances of Auto Scaling Groups",
        dest="collapse_asgs",
        action="store_false",
    )
    parser.add_argument(
        "--no-node-data",
        help="Do not show node data",
        dest="node_data",
        action="store_false",
    )
    parser.set_defaults(internal_edges=True)
    parser.set_defaults(inter_rds_edges=False)
    parser.set_defaults(read_replicas=True)
    parser.set_defaults(azs=True)
    parser.set_defaults(collapse_asgs=True)
    parser.set_defaults(node_data=True)
    args = parser.parse_args(arguments)

    outputfilter = {}
    if args.regions:
        # Regions are given as 'us-east-1,us-west-2'. Split this by the comma,
        # wrap each with quotes, and add the comma back. This is needed for how we do filtering.
        outputfilter["regions"] = ",".join(
            ['"' + r + '"' for r in args.regions.split(",")]
        )
    if args.vpc_ids:
        outputfilter["vpc-ids"] = ",".join(
            ['"' + r + '"' for r in args.vpc_ids.split(",")]
        )
    if args.vpc_names:
        outputfilter["vpc-names"] = ",".join(
            ['"' + r + '"' for r in args.vpc_names.split(",")]
        )
    if args.tags:
        outputfilter["tags"] = args.tags

    outputfilter["internal_edges"] = args.internal_edges
    outputfilter["read_replicas"] = args.read_replicas
    outputfilter["inter_rds_edges"] = args.inter_rds_edges
    outputfilter["azs"] = args.azs
    outputfilter["collapse_by_tag"] = args.collapse_by_tag
    outputfilter["collapse_asgs"] = args.collapse_asgs
    outputfilter["node_data"] = args.node_data

    # Read accounts file
    try:
        config = json.load(open(args.config))
    except IOError:
        exit('ERROR: Unable to load config file "{}"'.format(args.config))
    except ValueError as e:
        exit(
            'ERROR: Config file "{}" could not be loaded ({}), see config.json.demo for an example'.format(
                args.config, e
            )
        )
    account = get_account(args.account_name, config, args.config)

    prepare(account, config, outputfilter)
