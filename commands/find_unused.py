from __future__ import print_function
from shared.common import parse_arguments
from commands.prepare import build_data_structure
import pyjq
from shared.common import parse_arguments, make_list, query_aws, get_regions
from shared.nodes import Account, Region
import json

__description__ = "Find unused resources in accounts"


def run(arguments):
    _, accounts, config = parse_arguments(arguments)

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
    unused_resources = []
    for account in accounts:
        unused_resources_for_account = []
        for region_json in get_regions(Account(None, account)):
            unused_resources_for_region = {}
            used_sgs = set()
            outputfilter["regions"] = '"{}"'.format(region_json["RegionName"])
            network = build_data_structure(account, config, outputfilter)

            for edge in pyjq.all('.[].data|select(.type=="edge")', network):
                for sg in edge.get("node_data", []):
                    if type(sg) is not list:
                        used_sgs.add(sg.get("GroupId", None))

            region = Region(Account(None, account), region_json)
            defined_sgs = query_aws(
                Account(None, account), "ec2-describe-security-groups", region
            )

            defined_sg_set = {}

            for sg in pyjq.all(".SecurityGroups[]", defined_sgs):
                defined_sg_set[sg["GroupId"]] = sg

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

            unused_resources_for_region["security_groups"] = unused_sgs

            unused_resources_for_account.append(
                {
                    "name": region_json["RegionName"],
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
