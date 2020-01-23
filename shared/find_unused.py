import pyjq

from shared.common import query_aws, get_regions
from shared.nodes import Account, Region
from commands.prepare import get_resource_nodes


def find_unused_security_groups(region):
    # Get the defined security groups, then find all the Security Groups associated with the
    # ENIs.  Then diff these to find the unused Security Groups.
    used_sgs = set()

    defined_sgs = query_aws(region.account, "ec2-describe-security-groups", region)

    network_interfaces = query_aws(
        region.account, "ec2-describe-network-interfaces", region
    )

    defined_sg_set = {}

    for sg in pyjq.all(".SecurityGroups[]", defined_sgs):
        defined_sg_set[sg["GroupId"]] = sg

    for used_sg in pyjq.all(
        ".NetworkInterfaces[].Groups[].GroupId", network_interfaces
    ):
        used_sgs.add(used_sg)

    # Get the data from the `prepare` command
    outputfilter = {
        "internal_edges": True,
        "read_replicas": True,
        "inter_rds_edges": True,
        "azs": False,
        "collapse_by_tag": None,
        "collapse_asgs": True,
        "mute": True,
    }
    nodes = get_resource_nodes(region, outputfilter)

    for _, node in nodes.items():
        used_sgs.update(node.security_groups)

    unused_sg_ids = set(defined_sg_set) - used_sgs
    unused_sgs = []
    for sg_id in unused_sg_ids:
        unused_sgs.append(
            {
                "id": sg_id,
                "name": defined_sg_set[sg_id]["GroupName"],
                "description": defined_sg_set[sg_id].get("Description", ""),
            }
        )
    return unused_sgs


def find_unused_volumes(region):
    unused_volumes = []
    volumes = query_aws(region.account, "ec2-describe-volumes", region)
    for volume in pyjq.all('.Volumes[]|select(.State=="available")', volumes):
        unused_volumes.append({"id": volume["VolumeId"]})

    return unused_volumes


def find_unused_elastic_ips(region):
    unused_ips = []
    ips = query_aws(region.account, "ec2-describe-addresses", region)
    for ip in pyjq.all(".Addresses[] | select(.AssociationId == null)", ips):
        unused_ips.append({"id": ip.get("AllocationId", "Un-allocated IP"), "ip": ip["PublicIp"]})

    return unused_ips


def find_unused_network_interfaces(region):
    unused_network_interfaces = []
    network_interfaces = query_aws(
        region.account, "ec2-describe-network-interfaces", region
    )
    for network_interface in pyjq.all(
        '.NetworkInterfaces[]|select(.Status=="available")', network_interfaces
    ):
        unused_network_interfaces.append(
            {"id": network_interface["NetworkInterfaceId"]}
        )

    return unused_network_interfaces

def find_unused_elastic_load_balancers(region):
    unused_elastic_load_balancers = []
    elastic_load_balancers = query_aws(region.account, "elb-describe-load-balancers", region)
    for elastic_load_balancer in pyjq.all(".LoadBalancerDescriptions[] | select(.Instances == [])", elastic_load_balancers):
        unused_elastic_load_balancers.append({"LoadBalancerName": elastic_load_balancer["LoadBalancerName"]})
        
    return unused_elastic_load_balancers


def add_if_exists(dictionary, key, value):
    if value:
        dictionary[key] = value


def find_unused_resources(accounts):
    unused_resources = []
    for account in accounts:
        unused_resources_for_account = []
        for region_json in get_regions(Account(None, account)):
            region = Region(Account(None, account), region_json)

            unused_resources_for_region = {}

            add_if_exists(
                unused_resources_for_region,
                "security_groups",
                find_unused_security_groups(region),
            )
            add_if_exists(
                unused_resources_for_region, "volumes", find_unused_volumes(region)
            )
            add_if_exists(
                unused_resources_for_region,
                "elastic_ips",
                find_unused_elastic_ips(region),
            )
            add_if_exists(
                unused_resources_for_region,
                "network_interfaces",
                find_unused_network_interfaces(region),
            )
            add_if_exists(
                unused_resources_for_region,
                "elastic_load_balancers",
                find_unused_elastic_load_balancers(region),
            )

            unused_resources_for_account.append(
                {
                    "region": region_json["RegionName"],
                    "unused_resources": unused_resources_for_region,
                }
            )
        unused_resources.append(
            {
                "account": {"id": account["id"], "name": account["name"]},
                "regions": unused_resources_for_account,
            }
        )
    return unused_resources
