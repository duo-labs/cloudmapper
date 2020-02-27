from __future__ import print_function
import json
import os
import pyjq

from shared.nodes import Account, Region, is_public_ip
from commands.prepare import build_data_structure
from shared.common import get_regions, query_aws


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
            return "{}".format(port_range[0])
        return "{}-{}".format(port_range[0], port_range[1])

    return ",".join(map(port_range_string, port_ranges))


def get_public_nodes(account, config, use_cache=False):
    # TODO Look for IPv6 also
    # TODO Look at more services from https://github.com/arkadiyt/aws_public_ips
    # TODO Integrate into something to more easily port scan and screenshot web services

    # Try reading from cache
    cache_file_path = "account-data/{}/public_nodes.json".format(account["name"])
    # if use_cache:
    #     if os.path.isfile(cache_file_path):
    #         with open(cache_file_path) as f:
    #             return json.load(f), []

    # Get the data from the `prepare` command
    outputfilter = {
        "internal_edges": False,
        "read_replicas": False,
        "inter_rds_edges": False,
        "azs": False,
        "collapse_by_tag": None,
        "collapse_asgs": True,
        "mute": True,
    }
    network = build_data_structure(account, config, outputfilter)

    public_nodes = []
    warnings = []

    # Look at all the edges for ones connected to the public Internet (0.0.0.0/0)
    for edge in pyjq.all(
        '.[].data|select(.type=="edge")|select(.source=="0.0.0.0/0")', network
    ):

        # Find the node at the other end of this edge
        target = {"arn": edge["target"], "account": account["name"]}
        target_node = pyjq.first(
            '.[].data|select(.id=="{}")'.format(target["arn"]), network, {}
        )

        # Depending on the type of node, identify what the IP or hostname is
        if target_node["type"] == "elb":
            target["type"] = "elb"
            target["hostname"] = target_node["node_data"]["DNSName"]
        elif target_node["type"] == "elbv2":
            target["type"] = "elbv2"
            target["hostname"] = target_node["node_data"]["DNSName"]
        elif target_node["type"] == "autoscaling":
            target["type"] = "autoscaling"
            target["hostname"] = target_node["node_data"].get("PublicIpAddress", "")
            if target["hostname"] == "":
                target["hostname"] = target_node["node_data"]["PublicDnsName"]
        elif target_node["type"] == "rds":
            target["type"] = "rds"
            target["hostname"] = target_node["node_data"]["Endpoint"]["Address"]
        elif target_node["type"] == "ec2":
            target["type"] = "ec2"
            dns_name = target_node["node_data"].get("PublicDnsName", "")
            target["hostname"] = target_node["node_data"].get(
                "PublicIpAddress", dns_name
            )
            target["tags"] = target_node["node_data"].get("Tags", [])
        elif target_node["type"] == "ecs":
            target["type"] = "ecs"
            target["hostname"] = ""
            for ip in target_node["node_data"]["ips"]:
                if is_public_ip(ip):
                    target["hostname"] = ip
        elif target_node["type"] == "redshift":
            target["type"] = "redshift"
            target["hostname"] = (
                target_node["node_data"].get("Endpoint", {}).get("Address", "")
            )
        else:
            # Unknown node
            raise Exception("Unknown type: {}".format(target_node["type"]))

        # Check if any protocol is allowed (indicated by IpProtocol == -1)
        ingress = pyjq.all(".[]", edge.get("node_data", {}))

        sg_group_allowing_all_protocols = pyjq.first(
            '.[]|select(.IpPermissions[]?|.IpProtocol=="-1")|.GroupId', ingress, None
        )
        public_sgs = {}
        if sg_group_allowing_all_protocols is not None:
            warnings.append(
                "All protocols allowed access to {} due to {}".format(
                    target, sg_group_allowing_all_protocols
                )
            )
            # I would need to redo this code in order to get the name of the security group
            public_sgs[sg_group_allowing_all_protocols] = {"public_ports": "0-65535"}
        
        # from_port and to_port mean the beginning and end of a port range
        # We only care about TCP (6) and UDP (17)
        # For more info see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html
        port_ranges = []
        for sg in ingress:
            sg_port_ranges = []
            for ip_permission in sg.get("IpPermissions", []):
                selection = 'select((.IpProtocol=="tcp") or (.IpProtocol=="udp")) | select(.IpRanges[].CidrIp=="0.0.0.0/0")'
                sg_port_ranges.extend(
                    pyjq.all(
                        "{}| [.FromPort,.ToPort]".format(selection), ip_permission
                    )
                )
                selection = 'select(.IpProtocol=="-1") | select(.IpRanges[].CidrIp=="0.0.0.0/0")'
                sg_port_ranges.extend(
                    pyjq.all(
                        "{}| [0,65535]".format(selection), ip_permission
                    )
                )
            public_sgs[sg["GroupId"]] = {
                "GroupName": sg["GroupName"],
                "public_ports": port_ranges_string(regroup_ranges(sg_port_ranges)),
            }
            port_ranges.extend(sg_port_ranges)
        range_string = port_ranges_string(regroup_ranges(port_ranges))

        target["ports"] = range_string
        target["public_sgs"] = public_sgs
        if target["ports"] == "":
            issue_msg = "No ports open for tcp or udp (probably can only be pinged). Rules that are not tcp or udp: {} -- {}"
            warnings.append(
                issue_msg.format(
                    json.dumps(
                        pyjq.all(
                            '.[]|select((.IpProtocol!="tcp") and (.IpProtocol!="udp"))'.format(
                                selection
                            ),
                            ingress,
                        )
                    ),
                    account,
                )
            )
        public_nodes.append(target)

    # For the network diagram, if an ELB has availability across 3 subnets, I put one node in each subnet.
    # We don't care about that when we want to know what is public and it makes it confusing when you
    # see 3 resources with the same hostname, when you view your environment as only having one ELB.
    # This same issue exists for RDS.
    # Reduce these to single nodes.

    reduced_nodes = {}

    for node in public_nodes:
        reduced_nodes[node["hostname"]] = node

    public_nodes = []
    for _, node in reduced_nodes.items():
        public_nodes.append(node)

    account = Account(None, account)
    for region_json in get_regions(account):
        region = Region(account, region_json)
        # Look for CloudFront
        if region.name == "us-east-1":
            json_blob = query_aws(
                region.account, "cloudfront-list-distributions", region
            )

            for distribution in json_blob.get("DistributionList", {}).get("Items", []):
                if not distribution["Enabled"]:
                    continue

                target = {"arn": distribution["ARN"], "account": account.name}
                target["type"] = "cloudfront"
                target["hostname"] = distribution["DomainName"]
                target["ports"] = "80,443"

                public_nodes.append(target)

        # Look for API Gateway
        json_blob = query_aws(region.account, "apigateway-get-rest-apis", region)
        if json_blob is not None:
            for api in json_blob.get("items", []):
                target = {"arn": api["id"], "account": account.name}
                target["type"] = "apigateway"
                target["hostname"] = "{}.execute-api.{}.amazonaws.com".format(
                    api["id"], region.name
                )
                target["ports"] = "80,443"

                public_nodes.append(target)

    # Write cache file
    with open(cache_file_path, "w") as f:
        f.write(json.dumps(public_nodes, indent=4, sort_keys=True))

    return public_nodes, warnings
