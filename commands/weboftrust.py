import argparse
from os import path, listdir
import json
import yaml
import pyjq
import urllib.parse

from shared.common import parse_arguments, make_list, query_aws, get_regions, get_account_by_id

__description__ = "Create Web Of Trust diagram for accounts"

# TODO: This command would benefit from a few days of work and some sample data sets to improve:
# - How saml providers are identified. Currently only Okta is identified, and that's a hack.
#   Need to look for OneLogin and other providers, need to call "get-saml-provider" and openid in `collect`
# - More vendors, and a dozen don't have logos
# - How IAM admins are identified (need to leverage code from find_admins better)
# - More services and their trust policies.


def get_regional_vpc_peerings(region):
    vpc_peerings = query_aws(
        region.account, "ec2-describe-vpc-peering-connections", region
    )
    resource_filter = ".VpcPeeringConnections[]?"
    return pyjq.all(resource_filter, vpc_peerings)


def get_regional_direct_connects(region):
    direct_connects = query_aws(
        region.account, "/directconnect-describe-connections", region
    )
    resource_filter = ".connections[]?"
    return pyjq.all(resource_filter, direct_connects)


def add_connection(connections, source, target, reason):
    reasons = connections.get(Connection(source, target), [])
    reasons.append(reason)
    connections[Connection(source, target)] = reasons


class Account(object):
    parent = None

    def __init__(self, *args, **kwargs):

        json_blob = kwargs.get("json_blob", None)
        account_id = kwargs.get("account_id", None)

        if json_blob:
            self.name = json_blob["name"]
            self.id = json_blob["id"]
            self.type = json_blob.get("type", "weboftrust_account")
        elif account_id:
            self.name = account_id
            self.id = account_id
            self.type = "unknown_account"
        else:
            raise Exception("No init value provided to Account")

    def cytoscape_data(self):
        response = {
            "data": {
                "id": self.id,
                "name": self.name,
                "type": self.type,
                "weight": len(self.name) * 10,
            }
        }
        if self.parent:
            response["data"]["parent"] = self.parent

        return response


class Region(object):
    def __init__(self, parent, json_blob):
        self.name = json_blob["RegionName"]
        self.account = parent


class Connection(object):
    _source = None
    _target = None
    _type = None

    @property
    def source(self):
        return self._source

    @property
    def target(self):
        return self._target

    def __key(self):
        return (self._source.id, self._target.id, self._source.id, self._type)

    def __eq__(self, other):
        return self.__key() == other.__key()

    def __hash__(self):
        return hash(self.__key())

    def __init__(self, source, target, connection_type):
        self._source = source
        self._target = target
        self._type = connection_type
        self._json = []

    def cytoscape_data(self):
        return {
            "data": {
                "source": self._source.id,
                "target": self._target.id,
                "type": "edge",
            },
            "classes": self._type,
        }


def is_admin_policy(policy_doc):
    # TODO Use find_admin.py code instead of copy pasting it here.
    for stmt in make_list(policy_doc["Statement"]):
        if stmt["Effect"] == "Allow":
            actions = make_list(stmt.get("Action", []))
            for action in actions:
                if action == "*" or action == "*:*" or action == "iam:*":
                    return True
    return False


def get_vpc_peerings(account, nodes, connections):
    # Get VPC peerings
    for region_json in get_regions(account):
        region = Region(account, region_json)
        for vpc_peering in get_regional_vpc_peerings(region):
            # Ensure it is active
            if vpc_peering["Status"]["Code"] != "active":
                continue
            if vpc_peering["AccepterVpcInfo"]["OwnerId"] != account.id:
                peered_account = Account(
                    account_id=vpc_peering["AccepterVpcInfo"]["OwnerId"]
                )
                nodes[peered_account.id] = peered_account
                connections[Connection(account, peered_account, "vpc")] = []
            if vpc_peering["RequesterVpcInfo"]["OwnerId"] != account.id:
                peered_account = Account(
                    account_id=vpc_peering["RequesterVpcInfo"]["OwnerId"]
                )
                nodes[peered_account.id] = peered_account
                connections[Connection(account, peered_account, "vpc")] = []
    return


def get_direct_connects(account, nodes, connections):
    for region_json in get_regions(account):
        region = Region(account, region_json)
        for direct_connect in get_regional_direct_connects(region):
            name = direct_connect["location"]
            location = Account(account_id=name)
            location.type = "directconnect"
            # TODO: I could get a slightly nicer name if I had data for `directconnect describe-locations`
            nodes[name] = location
            connections[Connection(account, location, "directconnect")] = []
    return


def get_iam_trusts(account, nodes, connections, connections_to_get):
    # Get IAM
    iam = query_aws(
        account,
        "iam-get-account-authorization-details",
        Region(account, {"RegionName": "us-east-1"}),
    )

    saml_providers = query_aws(
        account,
        "iam-list-saml-providers",
        Region(account, {"RegionName": "us-east-1"})
    )["SAMLProviderList"]

    for role in pyjq.all(".RoleDetailList[]", iam):
        principals = pyjq.all(".AssumeRolePolicyDocument.Statement[].Principal", role)
        for principal in principals:
            assume_role_nodes = set()
            federated_principals = principal.get("Federated", None)

            if federated_principals:
                if not isinstance(federated_principals, list):
                    federated_principals = [federated_principals]

                for federated_principal in federated_principals:
                    try:
                        # Validate that the federated principal and the SAML provider is coming from known accounts.
                        # WoT will show us the direction of that trust for further inspection.
                        # this enables cross_account_admin_sts (STS between accounts)
                        for saml in saml_providers:
                            if saml['Arn'] == federated_principal:
                                saml_provider_arn = saml['Arn']
                            elif get_account_by_id(account_id=federated_principal.split(':')[4]):
                                if get_account_by_id(account_id=saml['Arn'].split(':')[4]):
                                    saml_provider_arn = saml['Arn']

                        if 'saml-provider/okta' in saml_provider_arn.lower():
                            node = Account(
                                json_blob={"id": "okta", "name": "okta", "type": "Okta"}
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/onelogin" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "onelogin",
                                    "name": "onelogin",
                                    "type": "Onelogin",
                                }
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/waad" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "WAAD",
                                    "name": "WAAD",
                                    "type": "waad",
                                }
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/allcloud-sso" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "AllCloud-SSO",
                                    "name": "AllCloud-SSO",
                                    "type": "AllCloud-SSO",
                                }
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/adfs" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={"id": "adfs", "name": "adfs", "type": "ADFS"}
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/auth0" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={"id": "auth0", "name": "auth0", "type": "auth0"}
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/google" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "google",
                                    "name": "google",
                                    "type": "google",
                                }
                            )
                            assume_role_nodes.add(node)
                        elif "saml-provider/gsuite" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "gsuite",
                                    "name": "gsuite",
                                    "type": "gsuite",
                                }
                            )
                            assume_role_nodes.add(node)
                        elif "cognito-identity.amazonaws.com" in saml_provider_arn.lower():
                            continue
                        elif "www.amazon.com" in saml_provider_arn.lower():
                            node = Account(
                                json_blob={
                                    "id": "Amazon.com",
                                    "name": "Amazon.com",
                                    "type": "Amazon",
                                }
                            )
                            continue
                        else:
                            raise Exception(
                                "Unknown federation provider: {}".format(saml_provider_arn.lower())
                            )

                    except (StopIteration, IndexError):
                        if "cognito-identity.amazonaws.com" in federated_principal.lower():
                            # TODO: Should show this somehow
                            continue
                        elif ":oidc-provider/" in federated_principal.lower():
                            # TODO: handle OpenID Connect identity providers
                            # https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html
                            continue
                        raise Exception('Principal {} is not a configured SAML provider'.format(federated_principal))
            if principal.get("AWS", None):
                principal = principal["AWS"]
                if not isinstance(principal, list):
                    principal = [principal]
                for p in principal:
                    if "arn:aws" not in p:
                        # The role can simply be something like "AROA..."
                        continue
                    parts = p.split(":")
                    account_id = parts[4]
                    assume_role_nodes.add(Account(account_id=account_id))

            for node in assume_role_nodes:
                if nodes.get(node.id, None) is None:
                    nodes[node.id] = node
                access_type = "iam"
                # TODO: Identify all admins better.  Use code from find_admins.py
                for m in role["AttachedManagedPolicies"]:
                    for p in pyjq.all(".Policies[]", iam):
                        if p["Arn"] == m["PolicyArn"]:
                            for policy_doc in p["PolicyVersionList"]:
                                if policy_doc["IsDefaultVersion"] == True:
                                    if is_admin_policy(policy_doc["Document"]):
                                        access_type = "admin"
                for policy in role["RolePolicyList"]:
                    policy_doc = policy["PolicyDocument"]
                    if is_admin_policy(policy_doc):
                        access_type = "admin"

                if (access_type == "admin" and connections_to_get["admin"]) or (
                    access_type != "admin" and connections_to_get["iam_nonadmin"]
                ):
                    connections[Connection(node, account, access_type)] = []
    return


def get_s3_trusts(account, nodes, connections):
    policy_dir = "./account-data/{}/us-east-1/s3-get-bucket-policy/".format(
        account.name
    )
    for s3_policy_file in [
        f
        for f in listdir(policy_dir)
        if path.isfile(path.join(policy_dir, f))
        and path.getsize(path.join(policy_dir, f)) > 4
    ]:
        s3_policy = json.load(open(path.join(policy_dir, s3_policy_file)))
        s3_policy = json.loads(s3_policy["Policy"])
        s3_bucket_name = urllib.parse.unquote_plus(s3_policy_file)
        for s in s3_policy["Statement"]:
            principals = s.get("Principal", None)
            if principals is None:
                if s.get("NotPrincipal", None) is not None:
                    print(
                        "WARNING: Use of NotPrincipal in {} for {}: {}".format(
                            account.name, s3_bucket_name, s
                        )
                    )
                    continue
                print(
                    "WARNING: Malformed statement in {} for {}: {}".format(
                        account.name, s3_bucket_name, s
                    )
                )
                continue

            for principal in principals:
                assume_role_nodes = set()
                if principal == "AWS":
                    trusts = principals[principal]
                    if not isinstance(trusts, list):
                        trusts = [trusts]
                    for trust in trusts:
                        if "arn:aws" not in trust:
                            # The role can simply be something like "*"
                            continue
                        parts = trust.split(":")
                        account_id = parts[4]
                        assume_role_nodes.add(Account(account_id=account_id))
                for node in assume_role_nodes:
                    if nodes.get(node.id, None) is None:
                        nodes[node.id] = node
                    access_type = "s3_read"
                    actions = s["Action"]
                    if not isinstance(actions, list):
                        actions = [actions]
                    for action in actions:
                        if not action.startswith("s3:List") and not action.startswith(
                            "s3:Get"
                        ):
                            access_type = "s3"
                            break
                    connections[Connection(node, account, access_type)] = []
    return


def get_nodes_and_connections(account_data, nodes, connections, args):
    account = Account(json_blob=account_data)
    nodes[account.id] = account

    connections_to_get = {
        "vpc": True,
        "direct_connect": True,
        "admin": True,
        "iam_nonadmin": True,
        "s3": True,
    }
    if args.network_only:
        connections_to_get = dict.fromkeys(connections_to_get, False)
        connections_to_get["vpc"] = True
        connections_to_get["direct_connect"] = True
    if args.admin_only:
        connections_to_get = dict.fromkeys(connections_to_get, False)
        connections_to_get["admin"] = True

    if connections_to_get["vpc"]:
        get_vpc_peerings(account, nodes, connections)
    if connections_to_get["direct_connect"]:
        get_direct_connects(account, nodes, connections)
    if connections_to_get["admin"] or connections_to_get["iam_nonadmin"]:
        get_iam_trusts(account, nodes, connections, connections_to_get)
    if connections_to_get["s3"]:
        get_s3_trusts(account, nodes, connections)


def weboftrust(args, accounts, config):
    """Collect the data and write it to a file"""

    nodes = {}
    connections = {}
    for account in accounts:
        # Check if the account data exists
        if not path.exists(
            "./account-data/{}/us-east-1/iam-get-account-authorization-details.json".format(
                account["name"]
            )
        ):
            print("INFO: Skipping account {}".format(account["name"]))
            continue
        get_nodes_and_connections(account, nodes, connections, args)

    cytoscape_json = []
    parents = set()

    with open("vendor_accounts.yaml", "r") as f:
        vendor_accounts = yaml.safe_load(f)

    # Add nodes
    for _, n in nodes.items():

        # Set up parent relationship
        for known_account in config["accounts"]:
            if n.id == known_account["id"]:
                if known_account.get("tags", False):
                    parent_name = known_account["tags"][0]
                    n.parent = parent_name
                    parents.add(parent_name)

        # Ensure we don't modify the type of accounts that we are scanning,
        # so first check if this account was one that was scanned
        was_scanned = False
        for scanned_account in accounts:
            if n.id == scanned_account["id"]:
                was_scanned = True

                # TODO: This is a hack to set this again here, as I had an account of type 'unknown_account' somehow
                n.type = "weboftrust_account"
                n.name = scanned_account["name"]
                break

        if not was_scanned:
            for vendor in vendor_accounts:
                if n.id in vendor["accounts"]:
                    n.name = vendor["name"]
                    n.type = vendor.get("type", vendor["name"])

            # Others
            for known_account in config["accounts"]:
                if n.id == known_account["id"]:
                    n.name = known_account["name"]
                    n.type = "known_account"
                    if known_account.get("tags", False):
                        n.parent = known_account["tags"][0]
                        parents.add(n.parent)
                    break

            if n.type == "unknown_account":
                print("Unknown account: {}".format(n.id))

            # Ignore AWS accounts unless the argument was given not to
            if n.type == "aws" and not args.show_aws_owned_accounts:
                continue

        cytoscape_json.append(n.cytoscape_data())

    # Add compound parent nodes
    for p in parents:
        n = Account(account_id=p)
        n.type = "account_grouping"
        cytoscape_json.append(n.cytoscape_data())

    num_connections = 0
    # Add the mapping to our graph
    for c, reasons in connections.items():
        if c.source.id == c.target.id:
            # Ensure we don't add connections with the same nodes on either side
            continue
        if (
            c._type != "admin"
            and connections.get(Connection(c.source, c.target, "admin"), False)
            is not False
        ):
            # Don't show an iam connection if we have an admin connection between the same nodes
            continue
        if (c._type == "s3_read") and (
            connections.get(Connection(c.source, c.target, "s3"), False) is not False
        ):
            # Don't show an s3 connection if we have an iam or admin connection between the same nodes
            continue
        # print('{} -> {}'.format(c.source.id, c.target.id))
        c._json = reasons
        cytoscape_json.append(c.cytoscape_data())
        num_connections += 1
    print("- {} connections built".format(num_connections))

    return cytoscape_json


def run(arguments):
    parser = argparse.ArgumentParser()
    # TODO: Have flags for each connection type
    parser.add_argument(
        "--network_only",
        help="Show networking connections only",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--admin_only",
        help="Show admin connections only",
        default=False,
        action="store_true",
    )

    parser.add_argument(
        "--show_aws_owned_accounts",
        help="Show accounts owned by AWS (defaults to hiding)",
        default=False,
        action="store_true",
    )
    args, accounts, config = parse_arguments(arguments, parser)

    if args.network_only and args.admin_only:
        print("ERROR: You cannot use network_only and admin_only at the same time")
        exit(-1)

    cytoscape_json = weboftrust(args, accounts, config)
    with open("web/data.json", "w") as outfile:
        json.dump(cytoscape_json, outfile, indent=4)
