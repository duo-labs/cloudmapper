from __future__ import print_function
from shared.common import parse_arguments, get_regions
from shared.query import query_aws, get_parameter_file
from shared.nodes import Account, Region


__description__ = "[Deprecated] Map API Gateway end-points"


def api_endpoints(accounts, config):
    for account in accounts:
        account = Account(None, account)
        for region_json in get_regions(account):
            region = Region(account, region_json)

            # Look for API Gateway
            json_blob = query_aws(region.account, "apigateway-get-rest-apis", region)
            if json_blob is None:
                continue
            for api in json_blob.get("items", []):
                rest_id = api["id"]
                deployments = get_parameter_file(
                    region, "apigateway", "get-deployments", rest_id
                )
                if deployments is None:
                    continue
                for deployment in deployments["items"]:
                    deployment_id = deployment["id"]
                    stages = get_parameter_file(
                        region, "apigateway", "get-stages", rest_id
                    )
                    if stages is None:
                        continue
                    for stage in stages["item"]:
                        if stage["deploymentId"] == deployment_id:
                            resources = get_parameter_file(
                                region, "apigateway", "get-resources", rest_id
                            )
                            if resources is None:
                                continue
                            for resource in resources["items"]:
                                print(
                                    "{}.execute-api.{}.amazonaws.com/{}{}".format(
                                        api["id"],
                                        region.name,
                                        stage["stageName"],
                                        resource["path"],
                                    )
                                )


def run(arguments):
    print("*** DEPRECARTED: Not enough of data is collected for this command to run successfully ***\n\n")
    _, accounts, config = parse_arguments(arguments)
    api_endpoints(accounts, config)
