from __future__ import print_function
from shared.common import parse_arguments
from commands.prepare import build_data_structure
import pyjq
from shared.common import parse_arguments, make_list, query_aws, get_regions
from shared.nodes import Account, Region
import json

__description__ = "Find unused resources in accounts"

def find_unused_security_groups(region):
    used_sgs = set()

    defined_sgs = query_aws(
        region.account, "ec2-describe-security-groups", region
    )

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


def run(arguments):
    _, accounts, config = parse_arguments(arguments)

    unused_resources = []
    for account in accounts:
        unused_resources_for_account = []
        for region_json in get_regions(Account(None, account)):
            region = Region(Account(None, account), region_json)

            unused_resources_for_region = {}
            unused_resources_for_region["security_groups"] = find_unused_security_groups(region)

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
    print(json.dumps(unused_resources, indent=2, sort_keys=True))
