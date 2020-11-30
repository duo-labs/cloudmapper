from __future__ import print_function
import argparse
import json
import datetime
import os.path
from abc import ABCMeta
from six import add_metaclass
from jinja2 import Template
from enum import Enum

from logging import CRITICAL
from logging import getLogger
from policyuniverse.policy import Policy
from shared.common import parse_arguments, get_regions
from shared.query import query_aws, get_parameter_file
from shared.nodes import Account, Region

__description__ = "Create IAM report"
getLogger("policyuniverse").setLevel(CRITICAL)


class OutputFormat(Enum):
    json = "json"
    html = "html"


REPORT_OUTPUT_FILE = os.path.join("web", "account-data", "iam_report")


def tolink(s):
    # TODO sanitize
    return s


def load_credential_report():
    users = []

    json_blob = query_aws(region.account, "iam-get-credential-report", region)
    csv_lines = json_blob["Content"].split("\n")

    # Skip header
    csv_lines.pop(0)

    # Header:
    # user,arn,user_creation_time,password_enabled,password_last_used,password_last_changed,
    # password_next_rotation,mfa_active,access_key_1_active,access_key_1_last_rotated,
    # access_key_1_last_used_date,access_key_1_last_used_region,access_key_1_last_used_service,
    # access_key_2_active,access_key_2_last_rotated,access_key_2_last_used_date,
    # access_key_2_last_used_region,access_key_2_last_used_service,cert_1_active,cert_1_last_rotated,
    # cert_2_active,cert_2_last_rotated
    for line in csv_lines:
        parts = line.split(",")
        user = {
            "user": parts[0],
            "arn": parts[1],
            "user_creation_time": parts[2],
            "password_enabled": parts[3],
            "password_last_used": parts[4],
            "password_last_changed": parts[5],
            "password_next_rotation": parts[6],
            "mfa_active": parts[7],
            "access_key_1_active": parts[8],
            "access_key_1_last_rotated": parts[9],
            "access_key_1_last_used_date": parts[10],
            "access_key_1_last_used_region": parts[11],
            "access_key_1_last_used_service": parts[12],
            "access_key_2_active": parts[13],
            "access_key_2_last_rotated": parts[14],
            "access_key_2_last_used_date": parts[15],
            "access_key_2_last_used_region": parts[16],
            "access_key_2_last_used_service": parts[17],
            "cert_1_active": parts[18],
            "cert_1_last_rotated": parts[19],
            "cert_2_active": parts[20],
            "cert_2_last_rotated": parts[21],
        }
        users.append[user]
    return users


def get_access_advisor(region, principal_stats, json_account_auth_details, args):
    for principal_auth in [
        *json_account_auth_details["UserDetailList"],
        *json_account_auth_details["RoleDetailList"],
    ]:
        stats = {}
        stats["auth"] = principal_auth
        job_id = get_parameter_file(
            region,
            "iam",
            "generate-service-last-accessed-details",
            principal_auth["Arn"],
        )["JobId"]
        json_last_access_details = get_parameter_file(
            region, "iam", "get-service-last-accessed-details", job_id
        )
        stats["last_access"] = json_last_access_details

        stats["is_inactive"] = True

        job_completion_date = datetime.datetime.strptime(
            json_last_access_details["JobCompletionDate"][0:10], "%Y-%m-%d"
        )

        for service in json_last_access_details["ServicesLastAccessed"]:
            if "LastAuthenticated" in service:
                last_access_date = datetime.datetime.strptime(
                    service["LastAuthenticated"][0:10], "%Y-%m-%d"
                )
                service["days_since_last_use"] = (
                    job_completion_date - last_access_date
                ).days
                if service["days_since_last_use"] < args.max_age:
                    stats["is_inactive"] = False
                    break

        principal_stats[principal_auth["Arn"]] = stats


def get_service_count_and_used(service_last_accessed):
    service_count = 0
    service_used_count = 0
    for service_last_access in service_last_accessed:
        service_count += 1
        if service_last_access["TotalAuthenticatedEntities"] > 0:
            service_used_count += 1
    return {"service_count": service_count, "service_used_count": service_used_count}


def html_service_chart(principal, services_used, services_granted):
    chartid = "serviceChart" + principal
    return (
        '<div style="width:30%"><canvas id="{}" width="100" height="15"></canvas></div>'
        + '<script>makeServiceUnusedChart("{}", {}, {});</script>'
    ).format(chartid, chartid, services_used, services_granted - services_used)


@add_metaclass(ABCMeta)
class graph_node(object):
    __key = ""
    __children = None
    __parents = None
    __name = ""

    def cytoscape_data(self):
        response = {
            "data": {"id": self.key(), "name": self.name(), "type": self.get_type()}
        }

        return response

    def key(self):
        return self.__key

    def set_key(self, key):
        self.__key = key

    def set_name(self, name):
        self.__name = name

    def name(self):
        if self.__name == "":
            return self.key()
        return self.__name

    def is_principal(self):
        pass

    def get_type(self):
        pass

    def add_child(self, node):
        self.__children.append(node)

    def add_parent(self, node):
        self.__parents.append(node)

    def children(self):
        return self.__children

    def parents(self):
        return self.__parents

    def get_services_allowed(self):
        services = {}
        for child in self.children():
            for service, source in child.get_services_allowed().items():
                source_list = services.get(service, [])
                if self.is_principal():
                    source_path = source
                else:
                    source_path = []
                    for s in source:
                        source_path.append("{}.{}".format(self.name(), s))
                source_list.extend(source_path)
                services[service] = source_list
        return services

    def __init__(self):
        self.__children = []
        self.__parents = []


class user_node(graph_node):
    __auth = None

    def is_principal(self):
        return True

    def get_type(self):
        return "user"

    def __init__(self, auth, auth_graph):
        super().__init__()
        self.set_key(auth["Arn"])
        self.set_name(auth["UserName"])
        self.__auth = auth

        for policy in auth["AttachedManagedPolicies"]:
            policy_node = auth_graph[policy["PolicyArn"]]
            self.add_child(policy_node)
            policy_node.add_parent(self)

        for policy in auth.get("UserPolicyList", []):
            policy_node = inline_policy_node(self, policy)
            auth_graph[policy_node.key()] = policy_node

        for group_name in auth.get("GroupList", []):
            group_key = self.key()[0:26] + "group" + auth['Path'] + group_name
            group_node = auth_graph[group_key]
            group_node.add_parent(self)
            self.add_child(group_node)


class role_node(graph_node):
    def is_principal(self):
        return True

    def get_type(self):
        return "role"

    def __init__(self, auth, auth_graph):
        super().__init__()
        self.set_key(auth["Arn"])
        self.set_name(auth["RoleName"])

        for policy in auth["AttachedManagedPolicies"]:
            policy_node = auth_graph[policy["PolicyArn"]]
            self.add_child(policy_node)
            policy_node.add_parent(self)

        for policy in auth.get("RolePolicyList", []):
            policy_node = inline_policy_node(self, policy)
            auth_graph[policy_node.key()] = policy_node


class group_node(graph_node):
    def is_principal(self):
        return False

    def get_type(self):
        return "group"

    def __init__(self, auth, auth_graph):
        super().__init__()
        self.set_key(auth["Arn"])
        self.set_name(auth["GroupName"])

        for policy in auth["AttachedManagedPolicies"]:
            policy_node = auth_graph[policy["PolicyArn"]]
            self.add_child(policy_node)
            policy_node.add_parent(self)

        for policy in auth.get("GroupPolicyList", []):
            policy_node = inline_policy_node(self, policy)
            auth_graph[policy_node.key()] = policy_node


class policy_node(graph_node):
    __policy_document = {}
    __policy_summary = None

    def is_principal(self):
        return False

    def get_services_allowed(self):
        response = {}
        services = self.__policy_summary.action_summary().keys()
        for service in services:
            response[service] = [self.name()]
        return response

    def set_policy_document(self, doc):
        self.__policy_document = doc
        self.__policy_summary = Policy(doc)


class managed_policy_node(policy_node):
    def get_type(self):
        return "managed policy"

    def __init__(self, auth):
        super().__init__()
        self.set_key(auth["Arn"])
        self.set_name(auth["PolicyName"])
        for policy_doc in auth["PolicyVersionList"]:
            if policy_doc["IsDefaultVersion"]:
                self.set_policy_document(policy_doc["Document"])


class inline_policy_node(policy_node):
    def get_type(self):
        return "inline policy"

    def __init__(self, parent, auth):
        super().__init__()
        self.set_key(parent.key() + "/policy/" + auth["PolicyName"])
        self.set_key(auth["PolicyName"])
        parent.add_child(self)
        self.add_parent(parent)
        self.set_policy_document(auth["PolicyDocument"])


def get_iam_graph(auth):
    iam_graph = {}

    for policy in auth["Policies"]:
        iam_graph[policy["Arn"]] = managed_policy_node(policy)
        for policy_version in policy["PolicyVersionList"]:
            if policy_version["IsDefaultVersion"]:
                iam_graph[policy["Arn"]].set_policy_document(policy_version["Document"])

    for group in auth["GroupDetailList"]:
        iam_graph[group["Arn"]] = group_node(group, iam_graph)

    for user in auth["UserDetailList"]:
        iam_graph[user["Arn"]] = user_node(user, iam_graph)

    for role in auth["RoleDetailList"]:
        iam_graph[role["Arn"]] = role_node(role, iam_graph)

    return iam_graph


def build_cytoscape_graph(iam_graph):
    cytoscape_json = []
    for k in iam_graph:
        node = iam_graph[k]
        if len(node.children()) > 0 or len(node.parents()) > 0:
            cytoscape_json.append(iam_graph[k].cytoscape_data())

    for k in iam_graph:
        node = iam_graph[k]
        for child in node.children():
            edge = {
                "data": {"source": node.key(), "target": child.key(), "type": "edge"}
            }
            cytoscape_json.append(edge)

    return cytoscape_json


def iam_report(accounts, config, args):
    """Create IAM report"""
    principal_stats = {}
    json_account_auth_details = None

    # Ensure only one account is given
    if len(accounts) > 1:
        raise Exception("This command only works with one account at a time")
    account = accounts.pop()

    # Create directory for output file if it doesn't already exists
    try:
        os.mkdir(os.path.dirname(REPORT_OUTPUT_FILE))
    except OSError:
        # Already exists
        pass

    # Read template
    with open(os.path.join("templates", "iam_report.html"), "r") as report_template:
        template = Template(report_template.read())

    # Data to be passed to the template
    t = {}

    account = Account(None, account)
    principal_stats = {}

    print("Creating IAM report for: {}".format(account.name))

    t["account_name"] = account.name
    t["account_id"] = account.local_id
    t["report_generated_time"] = datetime.datetime.now().strftime("%Y-%m-%d")

    t["graph"] = ""
    if args.show_graph:
        t["graph"] = '<br><iframe width=700 height=700 src="./map.html"></iframe>'

    for region_json in get_regions(account):
        region = Region(account, region_json)
        if region.name == "us-east-1":
            json_account_auth_details = query_aws(
                region.account, "iam-get-account-authorization-details", region
            )
            get_access_advisor(region, principal_stats, json_account_auth_details, args)

    users = []
    roles = []
    inactive_principals = []
    for principal, stats in principal_stats.items():
        if "RoleName" in stats["auth"]:
            stats["short_name"] = stats["auth"]["RoleName"]
            stats["type"] = "role"
            if stats["is_inactive"]:
                inactive_principals.append(principal)
                continue
            roles.append(principal)
        else:
            stats["short_name"] = stats["auth"]["UserName"]
            stats["type"] = "user"
            if stats["is_inactive"]:
                inactive_principals.append(principal)
                continue
            users.append(principal)

    print("* Generating IAM graph")
    # This needs to be generated even if we don't show the graph,
    # because this data is needed for other functionality in this command
    iam_graph = get_iam_graph(json_account_auth_details)
    cytoscape_json = build_cytoscape_graph(iam_graph)

    with open(os.path.join("web", "account-data", "data.json"), "w") as outfile:
        json.dump(cytoscape_json, outfile, indent=4)

    print("* Generating the rest of the report")

    t["users"] = []
    for principal in sorted(users):
        service_counts = get_service_count_and_used(
            principal_stats[principal]["last_access"]["ServicesLastAccessed"]
        )
        t["users"].append(
            {
                "arn": principal,
                "name": principal_stats[principal]["auth"]["UserName"],
                "services_used": service_counts["service_used_count"],
                "services_granted": service_counts["service_count"],
            }
        )

    t["roles"] = []
    for principal in sorted(roles):
        service_counts = get_service_count_and_used(
            principal_stats[principal]["last_access"]["ServicesLastAccessed"]
        )
        t["roles"].append(
            {
                "arn": principal,
                "name": principal_stats[principal]["auth"]["RoleName"],
                "services_used": service_counts["service_used_count"],
                "services_granted": service_counts["service_count"],
            }
        )

    t["inactive_principals"] = []
    for principal in sorted(inactive_principals):
        # Choose icon
        icon = '<i class="fas fa-user-astronaut"></i>'
        if principal_stats[principal]["type"] == "user":
            icon = '<i class="fas fa-user"></i>'

        t["inactive_principals"].append(
            {
                "arn": principal,
                "icon": icon,
                "name": principal_stats[principal]["short_name"],
            }
        )

    t["principals"] = []
    for principal, stats in principal_stats.items():
        if stats["is_inactive"]:
            continue

        p = {}
        p["arn"] = principal

        if "RoleName" in stats["auth"]:
            p["icon"] = '<i class="fas fa-user-astronaut"></i>'
            p["arn"] = stats["auth"]["Arn"]
            p["name"] = stats["auth"]["RoleName"]

        if "UserName" in stats["auth"]:
            p["icon"] = '<i class="fas fa-user"></i>'
            p["arn"] = stats["auth"]["Arn"]
            p["name"] = stats["auth"]["UserName"]

        principal_node = iam_graph[stats["auth"]["Arn"]]
        privilege_sources = principal_node.get_services_allowed()

        # Show access advisor info
        # Get collection date
        report_date = datetime.datetime.strptime(
            stats["last_access"]["JobCompletionDate"][0:10], "%Y-%m-%d"
        )

        # Show services
        p["services"] = []
        for service in stats["last_access"]["ServicesLastAccessed"]:
            last_use = "-"
            if service.get("LastAuthenticated", "-") != "-":
                last_use = (
                    report_date
                    - datetime.datetime.strptime(
                        service["LastAuthenticated"][0:10], "%Y-%m-%d"
                    )
                ).days

            style = ""
            if last_use == "-" or last_use > 90:
                style = "bad"

            source = privilege_sources.get(service["ServiceNamespace"], ["unknown"])
            source = ";".join(source)

            p["services"].append(
                {
                    "style": style,
                    "name": service["ServiceName"],
                    "last_use": last_use,
                    "source": source,
                }
            )

        # List groups
        groups = stats["auth"].get("GroupList", [])
        p["groups"] = []
        arn_prefix = stats["auth"]["Arn"][0:26]
        for group in groups:
            p["groups"].append(
                {"link_id": tolink(arn_prefix + "group/" + group), "name": group}
            )

        # List attached policies
        policies = stats["auth"]["AttachedManagedPolicies"]
        p["managed_policies"] = []
        for policy in policies:
            p["managed_policies"].append(
                {"link_id": tolink(policy["PolicyArn"]), "name": policy["PolicyName"]}
            )

        # Show inline policies
        policies = stats["auth"].get("UserPolicyList", [])
        policies.extend(stats["auth"].get("RolePolicyList", []))
        p["inline_policies"] = []
        for policy in policies:
            p["inline_policies"].append(
                {
                    "name": policy["PolicyName"],
                    "document": json.dumps(policy["PolicyDocument"], indent=4),
                }
            )

        # Show AssumeRolePolicyDocument
        if "RoleName" in stats["auth"]:
            p["assume_role"] = json.dumps(
                stats["auth"]["AssumeRolePolicyDocument"], indent=4
            )

        t["principals"].append(p)

    t["groups"] = []
    for group in json_account_auth_details["GroupDetailList"]:
        g = {"link_id": tolink(group["Arn"]), "name": group["GroupName"]}

        # List members
        group_node = iam_graph[group["Arn"]]
        g["members"] = []
        for parent in group_node.parents():
            g["members"].append(
                {"link_id": tolink(parent.key()), "name": parent.name()}
            )

        g["managed_policies"] = []
        for policy in group["AttachedManagedPolicies"]:
            g["managed_policies"].append(
                {"link_id": tolink(policy["PolicyArn"]), "name": policy["PolicyName"]}
            )

        g["inline_policies"] = []
        for policy in group["GroupPolicyList"]:
            g["inline_policies"].append(
                {
                    "name": policy["PolicyName"],
                    "document": json.dumps(policy["PolicyDocument"], indent=4),
                }
            )

        t["groups"].append(g)

    t["policies"] = []
    for policy in json_account_auth_details["Policies"]:
        p = {
            "link_id": tolink(policy["Arn"]),
            "name": policy["PolicyName"],
            "managed": "",
        }

        if "arn:aws:iam::aws:policy" in policy["Arn"]:
            p["managed"] = '<i class="fab fa-amazon"></i>AWS managed policy<br>'

        # Attachments
        policy_node = iam_graph[policy["Arn"]]
        p["attachments"] = []
        for parent in policy_node.parents():
            p["attachments"].append(
                {"link_id": tolink(parent.key()), "name": parent.name()}
            )

        for version in policy["PolicyVersionList"]:
            if version["IsDefaultVersion"]:
                p["document"] = json.dumps(version["Document"], indent=4)

        t["policies"].append(p)

    # Generate report from template
    if args.requested_output == OutputFormat.html:
        with open("{}.html".format(REPORT_OUTPUT_FILE), "w") as f:
            f.write(template.render(t=t))
    elif args.requested_output == OutputFormat.json:
        with open("{}.json".format(REPORT_OUTPUT_FILE), "w") as f:
            json.dump(t, f)

    print("Report written to {}.{}".format(REPORT_OUTPUT_FILE, args.requested_output.value))


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--max-age",
        help="Number of days a user or role hasn't been used before it's marked dead. Default: 90",
        default=90,
        type=int,
    )
    parser.add_argument(
        "--graph",
        help="Display a graph. Default: False",
        dest="show_graph",
        action="store_true",
    )
    parser.add_argument(
        "--output",
        help="Set the output type for the report. [json | html]. Default: html",
        default=OutputFormat.html,
        type=OutputFormat,
        dest="requested_output"
    )
    parser.set_defaults(show_graph=False)
    args, accounts, config = parse_arguments(arguments, parser)

    iam_report(accounts, config, args)
