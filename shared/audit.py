import json
import yaml
from os.path import exists
import pyjq
import traceback
import re
import pkgutil
import importlib
import inspect

from logging import CRITICAL
from logging import getLogger
from policyuniverse.policy import Policy

from netaddr import IPNetwork
from shared.common import (
    make_list,
    get_regions,
    is_unblockable_cidr,
    is_external_cidr,
    Finding,
    get_collection_date,
    days_between,
)
from shared.query import query_aws, get_parameter_file
from shared.nodes import Account, Region, get_name
from shared.iam_audit import find_admins_in_account

# Global
custom_filter = None
getLogger("policyuniverse").setLevel(CRITICAL)


class Findings(object):
    findings = None
    current = 0

    def __init__(self):
        self.findings = []

    def add(self, finding):
        self.findings.append(finding)

    def __iter__(self):
        for finding in self.findings:
            yield finding

    def __len__(self):
        return len(self.findings)


def finding_is_filtered(finding, conf, minimum_severity="LOW"):
    minimum_severity = minimum_severity.upper()
    severity_choices = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "MUTE"]
    finding_severity = conf["severity"].upper()
    if severity_choices.index(finding_severity) > severity_choices.index(
        minimum_severity
    ):
        return True

    for resource_to_ignore in conf.get("ignore_resources", []):
        ignore_regex = re.compile("^" + resource_to_ignore + "$")
        if re.search(ignore_regex, finding.resource_id):
            return True

    if custom_filter and custom_filter(finding, conf):
        return True

    return False


def load_audit_config():
    with open("audit_config.yaml", "r") as f:
        audit_config = yaml.safe_load(f)
    # TODO: Check the file is formatted correctly

    if exists("config/audit_config_override.yaml"):
        with open("config/audit_config_override.yaml", "r") as f:
            audit_override = yaml.safe_load(f)

            # Over-write the values from audit_config
            if audit_override:
                for finding_id in audit_override:
                    if finding_id not in audit_config:
                        audit_config[finding_id] = {
                            "title": "Unknown",
                            "description": "Unknown",
                            "severity": "High",
                            "group": "unknown",
                        }
                    for k in audit_override[finding_id]:
                        audit_config[finding_id][k] = audit_override[finding_id][k]
    return audit_config


def audit_s3_buckets(findings, region):
    buckets_json = query_aws(region.account, "s3-list-buckets", region)
    buckets = pyjq.all(".Buckets[].Name", buckets_json)
    for bucket in buckets:
        # Check policy
        try:
            policy_file_json = get_parameter_file(
                region, "s3", "get-bucket-policy", bucket
            )
            if policy_file_json is not None:
                # Find the entity we need
                policy_string = policy_file_json["Policy"]
                # Load the string value as json
                policy = json.loads(policy_string)
                policy = Policy(policy)
                if policy.is_internet_accessible():
                    if (
                        len(policy.statements) == 1
                        and len(policy.statements[0].actions) == 1
                        and "s3:GetObject" in policy.statements[0].actions
                    ):
                        findings.add(
                            Finding(region, "S3_PUBLIC_POLICY_GETOBJECT_ONLY", bucket)
                        )
                    else:
                        findings.add(
                            Finding(
                                region,
                                "S3_PUBLIC_POLICY",
                                bucket,
                                resource_details=policy_string,
                            )
                        )
        except Exception as e:
            findings.add(
                Finding(
                    region,
                    "EXCEPTION",
                    bucket,
                    resource_details={
                        "policy": policy_string,
                        "exception": str(e),
                        "location": "Exception checking policy of S3 bucket",
                    },
                )
            )
        # Check ACL
        try:
            file_json = get_parameter_file(region, "s3", "get-bucket-acl", bucket)
            for grant in file_json["Grants"]:
                uri = grant["Grantee"].get("URI", "")
                if (
                    uri == "http://acs.amazonaws.com/groups/global/AllUsers"
                    or uri
                    == "http://acs.amazonaws.com/groups/global/AuthenticatedUsers"
                ):
                    findings.add(
                        Finding(region, "S3_PUBLIC_ACL", bucket, resource_details=grant)
                    )
        except Exception as e:
            findings.add(
                Finding(
                    region,
                    "EXCEPTION",
                    bucket,
                    resource_details={
                        "grant": grant,
                        "exception": str(e),
                        "location": "Exception checking ACL of S3 bucket",
                    },
                )
            )


def audit_s3_block_policy(findings, region, account_name):
    caller_identity_json = query_aws(region.account, "sts-get-caller-identity", region)
    block_policy_json = get_parameter_file(
        region, "s3control", "get-public-access-block", caller_identity_json["Account"]
    )
    if block_policy_json is None:
        findings.add(Finding(region, "S3_ACCESS_BLOCK_OFF", None))
    else:
        conf = block_policy_json["PublicAccessBlockConfiguration"]
        if (
            not conf["BlockPublicAcls"]
            or not conf["BlockPublicPolicy"]
            or not conf["IgnorePublicAcls"]
            or not conf["RestrictPublicBuckets"]
        ):
            findings.add(
                Finding(
                    region,
                    "S3_ACCESS_BLOCK_ALL_ACCESS_TYPES",
                    account_name,
                    resource_details=block_policy_json,
                )
            )


def audit_guardduty(findings, region):
    detector_list_json = query_aws(region.account, "guardduty-list-detectors", region)
    if not detector_list_json:
        # GuardDuty must not exist in this region (or the collect data is old)
        return
    is_enabled = False
    for detector in detector_list_json["DetectorIds"]:
        detector_json = get_parameter_file(
            region, "guardduty", "get-detector", detector
        )
        if detector_json["Status"] == "ENABLED":
            is_enabled = True
    if not is_enabled:
        findings.add(Finding(region, "GUARDDUTY_OFF", None, None))


def audit_accessanalyzer(findings, region):
    analyzer_list_json = query_aws(
        region.account, "accessanalyzer-list-analyzers", region
    )
    if not analyzer_list_json:
        # Access Analyzer must not exist in this region (or the collect data is old)
        return
    is_enabled = False
    for analyzer in analyzer_list_json["analyzers"]:
        if analyzer["status"] == "ACTIVE":
            is_enabled = True
    if not is_enabled:
        findings.add(Finding(region, "ACCESSANALYZER_OFF", None, None))


def audit_iam(findings, region):
    # By calling the code to find the admins, we'll exercise the code that finds problems.
    find_admins_in_account(region, findings)

    # By default we get the findings for the admins, but we can also look for specific
    # privileges, so we'll look for who has s3:ListAllMyBuckets and then only use those
    # findings that are for a compute resource having this privilege

    s3_listing_findings = Findings()
    s3_get_findings = Findings()

    # TODO Running find_admins_in_account is really slow, and now we're running it 3 times.
    #      So figure out a way to run it once.
    find_admins_in_account(
        region, s3_listing_findings, privs_to_look_for=["s3:ListAllMyBuckets"]
    )
    find_admins_in_account(region, s3_get_findings, privs_to_look_for=["s3:GetObject"])

    for flist in s3_listing_findings:
        if flist.issue_id != "IAM_UNEXPECTED_ADMIN_PRINCIPAL":
            continue

        services = make_list(
            flist.resource_details.get("Principal", {}).get("Service", "")
        )
        for service in services:
            if service in [
                "config.amazonaws.com",
                "trustedadvisor.amazonaws.com",
                "macie.amazonaws.com",
            ]:
                continue

            # If we are here then we have a principal that can list S3 buckets,
            # and is associated with an unexpected service,
            # so check if they can read data from them as well

            for fget in s3_get_findings:
                if (
                    fget.issue_id == "IAM_UNEXPECTED_ADMIN_PRINCIPAL"
                    and fget.resource_id == flist.resource_id
                ):
                    # If we are here, then the principal can list S3 buckets and get objects
                    # from them, and is not an unexpected service. Ensure we haven't already
                    # recorded this as an unexpected admin.

                    already_recorded = False
                    for f in findings:
                        if (
                            f.resource_id == fget.resource_id
                            and f.issue_id == "IAM_UNEXPECTED_ADMIN_PRINCIPAL"
                        ):
                            already_recorded = True
                            break

                    if not already_recorded:
                        flist.issue_id = "IAM_UNEXPECTED_S3_EXFIL_PRINCIPAL"
                        findings.add(flist)

            # Don't record this multiple times if multiple services are listed
            break


def audit_cloudtrail(findings, region):
    json_blob = query_aws(region.account, "cloudtrail-describe-trails", region)
    if len(json_blob.get("trailList", [])) == 0:
        findings.add(Finding(region, "CLOUDTRAIL_OFF", None, None))
    else:
        multiregion = False
        for trail in json_blob["trailList"]:
            if trail["IsMultiRegionTrail"]:
                multiregion = True
                break
        if not multiregion:
            findings.add(Finding(region, "CLOUDTRAIL_NOT_MULTIREGION", None, None))


def audit_password_policy(findings, region):
    json_blob = query_aws(region.account, "iam-get-account-password-policy", region)
    if json_blob is None or json_blob.get("PasswordPolicy", {}) == {}:
        findings.add(Finding(region, "PASSWORD_POLICY_NOT_SET", None, None))
    else:
        if json_blob["PasswordPolicy"].get("MinimumPasswordLength", 0) < 12:
            findings.add(
                Finding(
                    region,
                    "PASSWORD_POLICY_CHARACTER_MINIMUM",
                    None,
                    resource_details={
                        "MinimumPasswordLength": json_blob["PasswordPolicy"].get(
                            "MinimumPasswordLength", 0
                        )
                    },
                )
            )

        lacking_character_requirements = []
        if not json_blob["PasswordPolicy"].get("RequireNumbers", False):
            lacking_character_requirements.append("RequireNumbers")
        if not json_blob["PasswordPolicy"].get("RequireSymbols", False):
            lacking_character_requirements.append("RequireSymbols")
        if not json_blob["PasswordPolicy"].get("RequireLowercaseCharacters", False):
            lacking_character_requirements.append("RequireLowercaseCharacters")
        if not json_blob["PasswordPolicy"].get("RequireUppercaseCharacters", False):
            lacking_character_requirements.append("RequireUppercaseCharacters")
        if len(lacking_character_requirements) > 0:
            findings.add(
                Finding(
                    region,
                    "PASSWORD_POLICY_CHARACTER_SET_REQUIREMENTS",
                    None,
                    resource_details={"Policy lacks": lacking_character_requirements},
                )
            )


def audit_root_user(findings, region):
    json_blob = query_aws(region.account, "iam-get-account-summary", region)

    root_user_access_keys = json_blob.get("SummaryMap", {}).get(
        "AccountAccessKeysPresent", 0
    )
    if root_user_access_keys != 0:
        findings.add(
            Finding(
                region,
                "ROOT_USER_HAS_ACCESS_KEYS",
                None,
                resource_details={"Number of access keys": root_user_access_keys},
            )
        )

    root_user_mfa = json_blob.get("SummaryMap", {}).get("AccountMFAEnabled", 0)
    if root_user_mfa != 1:
        findings.add(Finding(region, "ROOT_USER_HAS_NO_MFA", None, None))


def audit_users(findings, region):
    MAX_DAYS_SINCE_LAST_USAGE = 90

    # TODO: Convert all of this into a table

    json_blob = query_aws(region.account, "iam-get-credential-report", region)
    csv_lines = json_blob["Content"].split("\n")
    collection_date = json_blob["GeneratedTime"]

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

        user_age = days_between(collection_date, user["user_creation_time"])

        if user["password_enabled"] == "true":
            if user["mfa_active"] == "false":
                findings.add(
                    Finding(
                        region,
                        "USER_WITH_PASSWORD_LOGIN_BUT_NO_MFA",
                        user["user"],
                        resource_details={
                            "Number of days since user was created": user_age
                        },
                    )
                )

            if user["password_last_used"] == "no_information":
                findings.add(
                    Finding(
                        region,
                        "USER_HAS_NEVER_LOGGED_IN",
                        user["user"],
                        resource_details={
                            "Number of days since user was created": user_age
                        },
                    )
                )
            else:
                password_last_used_days = days_between(
                    collection_date, user["password_last_used"]
                )
                if password_last_used_days > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(
                        Finding(
                            region,
                            "USER_HAS_NOT_LOGGED_IN_FOR_OVER_MAX_DAYS",
                            user["user"],
                            resource_details={
                                "Number of days since user was created": user_age,
                                "Number of days since last login": password_last_used_days,
                            },
                        )
                    )

        if (
            user["access_key_1_active"] == "true"
            and user["access_key_2_active"] == "true"
        ):
            age_of_key1 = days_between(
                collection_date, user["access_key_1_last_rotated"]
            )
            age_of_key2 = days_between(
                collection_date, user["access_key_2_last_rotated"]
            )

            findings.add(
                Finding(
                    region,
                    "USER_HAS_TWO_ACCESS_KEYS",
                    user["user"],
                    resource_details={
                        "Number of days since key1 was rotated": age_of_key1,
                        "Number of days since key2 was rotated": age_of_key2,
                    },
                )
            )

        if user["access_key_1_active"] == "true":
            age_of_key = days_between(
                collection_date, user["access_key_1_last_rotated"]
            )

            if user["access_key_1_last_used_date"] == "N/A":
                findings.add(
                    Finding(
                        region,
                        "USER_HAS_UNUSED_ACCESS_KEY",
                        user["user"],
                        resource_details={
                            "Unused key": 1,
                            "Number of days since key was rotated": age_of_key,
                        },
                    )
                )
            else:
                days_since_key_use = days_between(
                    collection_date, user["access_key_1_last_used_date"]
                )
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(
                        Finding(
                            region,
                            "USER_HAS_NOT_USED_ACCESS_KEY_FOR_MAX_DAYS",
                            user["user"],
                            resource_details={
                                "Days since key 1 used:": days_since_key_use,
                                "Number of days since key was rotated": age_of_key,
                            },
                        )
                    )
        if user["access_key_2_active"] == "true":
            age_of_key = days_between(
                collection_date, user["access_key_2_last_rotated"]
            )
            if user["access_key_2_last_used_date"] == "N/A":
                findings.add(
                    Finding(
                        region,
                        "USER_HAS_UNUSED_ACCESS_KEY",
                        user["user"],
                        resource_details={
                            "Unused key": 2,
                            "Number of days since key was rotated": age_of_key,
                        },
                    )
                )
            else:
                days_since_key_use = days_between(
                    collection_date, user["access_key_2_last_used_date"]
                )
                if days_since_key_use > MAX_DAYS_SINCE_LAST_USAGE:
                    findings.add(
                        Finding(
                            region,
                            "USER_HAS_NOT_USED_ACCESS_KEY_FOR_MAX_DAYS",
                            user["user"],
                            resource_details={
                                "Days since key 2 used:": days_since_key_use,
                                "Number of days since key was rotated": age_of_key,
                            },
                        )
                    )


def audit_route53(findings, region):
    json_blob = query_aws(region.account, "route53domains-list-domains", region)
    for domain in json_blob.get("Domains", []):
        if not domain["AutoRenew"]:
            findings.add(
                Finding(region, "DOMAIN_NOT_SET_TO_RENEW", domain["DomainName"], None)
            )
        if not domain["TransferLock"]:
            findings.add(
                Finding(
                    region, "DOMAIN_HAS_NO_TRANSFER_LOCK", domain["DomainName"], None
                )
            )

    # Check VPC hosted zones
    regions_json = query_aws(region.account, "describe-regions")
    regions = pyjq.all(".Regions[].RegionName", regions_json)
    for region_name in regions:
        vpc_json = query_aws(region.account, "ec2-describe-vpcs", region_name)
        vpcs = pyjq.all(".Vpcs[]?.VpcId", vpc_json)
        for vpc in vpcs:
            hosted_zone_file = f"account-data/{region.account.name}/{region.name}/route53-list-hosted-zones-by-vpc/{region_name}/{vpc}"
            hosted_zones_json = json.load(open(hosted_zone_file))
            hosted_zones = pyjq.all(".HostedZoneSummaries[]?", hosted_zones_json)
            for hosted_zone in hosted_zones:
                if hosted_zone.get("Owner", {}).get("OwningAccount", "") != "":
                    if hosted_zone["Owner"]["OwningAccount"] != region.account.local_id:
                        findings.add(
                            Finding(region, "FOREIGN_HOSTED_ZONE", hosted_zone)
                        )


def audit_ebs_snapshots(findings, region):
    json_blob = query_aws(region.account, "ec2-describe-snapshots", region)
    for snapshot in json_blob.get("Snapshots", []):
        try:
            file_json = get_parameter_file(
                region, "ec2", "describe-snapshot-attribute", snapshot["SnapshotId"]
            )
            if file_json is None:
                # Not technically an exception, but an unexpected situation
                findings.add(
                    Finding(
                        region,
                        "EXCEPTION",
                        snapshot,
                        resource_details={"location": "EBS snapshot has no attributes"},
                    )
                )
                continue
            for attribute in file_json["CreateVolumePermissions"]:
                if attribute.get("Group", "self") != "self":
                    findings.add(
                        Finding(
                            region,
                            "EBS_SNAPSHOT_PUBLIC",
                            snapshot,
                            resource_details={
                                "Entities allowed to restore": attribute["Group"]
                            },
                        )
                    )
        except OSError:
            findings.add(
                Finding(
                    region,
                    "EXCEPTION",
                    None,
                    resource_details={
                        "location": "Could not open EBS snapshot file",
                        "file_name": file_name,
                    },
                )
            )


def audit_rds_snapshots(findings, region):
    json_blob = query_aws(region.account, "rds-describe-db-snapshots", region)
    for snapshot in json_blob.get("DBSnapshots", []):
        try:
            file_json = get_parameter_file(
                region,
                "rds",
                "describe-db-snapshot-attributes",
                snapshot["DBSnapshotIdentifier"],
            )
            for attribute in file_json["DBSnapshotAttributesResult"][
                "DBSnapshotAttributes"
            ]:
                if attribute["AttributeName"] == "restore":
                    if "all" in attribute["AttributeValues"]:
                        findings.add(
                            Finding(
                                region,
                                "RDS_PUBLIC_SNAPSHOT",
                                snapshot,
                                resource_details={
                                    "Entities allowed to restore": attribute[
                                        "AttributeValues"
                                    ]
                                },
                            )
                        )
        except OSError:
            findings.add(
                Finding(
                    region,
                    "EXCEPTION",
                    None,
                    resource_details={
                        "location": "Could not open RDS snapshot file",
                        "file_name": file_name,
                    },
                )
            )


def audit_rds(findings, region):
    json_blob = query_aws(region.account, "rds-describe-db-instances", region)
    for instance in json_blob.get("DBInstances", []):
        if instance["PubliclyAccessible"]:
            findings.add(
                Finding(region, "RDS_PUBLIC_IP", instance["DBInstanceIdentifier"])
            )
        if instance.get("DBSubnetGroup", {}).get("VpcId", "") == "":
            findings.add(
                Finding(region, "RDS_VPC_CLASSIC", instance["DBInstanceIdentifier"])
            )


def audit_amis(findings, region):
    json_blob = query_aws(region.account, "ec2-describe-images", region)
    for image in json_blob.get("Images", []):
        if image["Public"]:
            findings.add(Finding(region, "AMI_PUBLIC", image["ImageId"]))


def audit_ecr_repos(findings, region):
    json_blob = query_aws(region.account, "ecr-describe-repositories", region)
    for repo in json_blob.get("repositories", []):
        name = repo["repositoryName"]

        # Check policy
        policy_file_json = get_parameter_file(
            region, "ecr", "get-repository-policy", name
        )
        if policy_file_json is None:
            # This means only the owner can access the repo, so this is fine.
            # The collect command would have received the exception
            # `RepositoryPolicyNotFoundException` for this to happen.
            continue
        # Find the entity we need
        policy_string = policy_file_json["policyText"]
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(region, "ECR_PUBLIC", name, resource_details=policy_string)
            )


def audit_redshift(findings, region):
    json_blob = query_aws(region.account, "redshift-describe-clusters", region)
    for cluster in json_blob.get("Clusters", []):
        if cluster["PubliclyAccessible"]:
            findings.add(
                Finding(region, "REDSHIFT_PUBLIC_IP", cluster["ClusterIdentifier"])
            )


def audit_es(findings, region):
    json_blob = query_aws(region.account, "es-list-domain-names", region)
    for domain in json_blob.get("DomainNames", []):
        name = domain["DomainName"]

        # Check policy
        policy_file_json = get_parameter_file(
            region, "es", "describe-elasticsearch-domain", name
        )
        # Find the entity we need
        policy_string = policy_file_json["DomainStatus"]["AccessPolicies"]
        if policy_string == '':
            policy_string = "{}"
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)

        # ES clusters or either public, with an "Endpoint" (singular), which is bad, or
        # they are VPC-only, in which case they have an "Endpoints" (plural) array containing a "vpc" element
        if (
            policy_file_json["DomainStatus"].get("Endpoint", "") != ""
            or policy_file_json["DomainStatus"].get("Endpoints", {}).get("vpc", "") == ""
        ):
            if policy.is_internet_accessible() or policy_string == "{}":
                findings.add(
                    Finding(region, "ES_PUBLIC", name, resource_details=policy_string)
                )


def audit_cloudfront(findings, region):
    json_blob = query_aws(region.account, "cloudfront-list-distributions", region)

    for distribution in json_blob.get("DistributionList", {}).get("Items", []):
        if not distribution["Enabled"]:
            continue

        minimum_protocol_version = distribution.get("ViewerCertificate", {}).get(
            "MinimumProtocolVersion", ""
        )
        if minimum_protocol_version == "SSLv3":
            findings.add(
                Finding(
                    region,
                    "CLOUDFRONT_MINIMUM_PROTOCOL_SUPPORT",
                    distribution["DomainName"],
                    resource_details={
                        "Minimum protocol version": minimum_protocol_version
                    },
                )
            )


def audit_ec2(findings, region):
    json_blob = query_aws(region.account, "ec2-describe-instances", region)
    route_table_json = query_aws(region.account, "ec2-describe-route-tables", region)

    for reservation in json_blob.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            if instance.get("State", {}).get("Name", "") == "terminated":
                # Ignore EC2's that are off
                continue

            # Check for IMDSv2 enforced
            if instance.get("MetadataOptions", {}).get("HttpEndpoint", "") == "enabled":
                if instance["MetadataOptions"].get("HttpTokens", "") == "optional":
                    findings.add(
                        Finding(
                            region,
                            "EC2_IMDSV2_NOT_ENFORCED",
                            instance["InstanceId"],
                            resource_details={
                                "Name": get_name(instance, "InstanceId"),
                                "Instance ID": instance["InstanceId"],
                                "Tags": instance.get("Tags", {}),
                                "MetadataOptions": instance["MetadataOptions"],
                                "SSH Key Found": instance.get("KeyName", {}),
                            },
                        )
                    )

            # Check for old instances
            if instance.get("LaunchTime", "") != "":
                MAX_RESOURCE_AGE_DAYS = 365
                collection_date = get_collection_date(region.account)
                launch_time = instance["LaunchTime"].split(".")[0]
                age_in_days = days_between(launch_time, collection_date)
                if age_in_days > MAX_RESOURCE_AGE_DAYS:
                    findings.add(
                        Finding(
                            region,
                            "EC2_OLD",
                            instance["InstanceId"],
                            resource_details={
                                "Age in days": age_in_days,
                                "Name": get_name(instance, "InstanceId"),
                                "Tags": instance.get("Tags", {}),
                            },
                        )
                    )

            # Check for EC2 Classic
            if "vpc" not in instance.get("VpcId", ""):
                findings.add(Finding(region, "EC2_CLASSIC", instance["InstanceId"]))

            if not instance.get("SourceDestCheck", True):
                route_to_instance = None
                for table in route_table_json["RouteTables"]:
                    if table["VpcId"] == instance.get("VpcId", ""):
                        for route in table["Routes"]:
                            if route.get("InstanceId", "") == instance["InstanceId"]:
                                route_to_instance = route
                                break
                    if route_to_instance is not None:
                        break
                findings.add(
                    Finding(
                        region,
                        "EC2_SOURCE_DEST_CHECK_OFF",
                        instance["InstanceId"],
                        resource_details={
                            "routes": route_to_instance,
                            "Name": get_name(instance, "InstanceId"),
                            "Tags": instance.get("Tags", {}),
                        },
                    )
                )


def audit_elbv1(findings, region):
    json_blob = query_aws(region.account, "elb-describe-load-balancers", region)

    for load_balancer in json_blob.get("LoadBalancerDescriptions", []):
        lb_name = load_balancer["LoadBalancerName"]

        # Check attributes
        attributes_json = get_parameter_file(
            region, "elb", "describe-load-balancer-attributes", lb_name
        )

        for attribute in attributes_json.get("LoadBalancerAttributes", [])['AdditionalAttributes']:
            if (
                attribute["Key"] == "elb.http.desyncmitigationmode"
                and attribute["Value"] != "strictest"
            ):
                findings.add(Finding(region, "ELBV1_DESYNC_MITIGATION", lb_name))


def audit_elbv2(findings, region):
    json_blob = query_aws(region.account, "elbv2-describe-load-balancers", region)

    for load_balancer in json_blob.get("LoadBalancers", []):
        arn = load_balancer["LoadBalancerArn"]

        # Check attributes
        attributes_json = get_parameter_file(
            region, "elbv2", "describe-load-balancer-attributes", arn
        )

        for attribute in attributes_json.get("Attributes", []):
            if (
                attribute["Key"] == "routing.http.drop_invalid_header_fields.enabled"
                and attribute["Value"] == "false"
            ):
                findings.add(Finding(region, "REQUEST_SMUGGLING", arn))


def audit_sg(findings, region):
    # TODO Check if security groups allow large CIDR range (ex. 1.2.3.4/3)
    # TODO Check if an SG restricts IPv4 and then opens IPv6 or vice versa.

    cidrs = {}
    sg_json = query_aws(region.account, "ec2-describe-security-groups", region)
    sgs = pyjq.all(".SecurityGroups[]?", sg_json)
    for sg in sgs:
        cidr_and_name_list = pyjq.all(
            ".IpPermissions[]?.IpRanges[]|[.CidrIp,.Description]", sg
        )
        for cidr, name in cidr_and_name_list:
            if not is_external_cidr(cidr):
                continue

            if is_unblockable_cidr(cidr):
                findings.add(
                    Finding(
                        region,
                        "SG_CIDR_UNNEEDED",
                        sg["GroupId"],
                        resource_details={"cidr": cidr},
                    )
                )
                continue

            if cidr.startswith("0.0.0.0") and not cidr.endswith("/0"):
                findings.add(
                    Finding(
                        region,
                        "SG_CIDR_UNEXPECTED",
                        sg["GroupId"],
                        resource_details={"cidr": cidr},
                    )
                )
                continue

            if cidr == "0.0.0.0/0":
                continue

            cidrs[cidr] = cidrs.get(cidr, list())
            cidrs[cidr].append(sg["GroupId"])

        for ip_permissions in sg.get("IpPermissions", []):
            cidrs_seen = set()
            for ip_ranges in ip_permissions.get("IpRanges", []):
                if "CidrIp" not in ip_ranges:
                    continue
                cidr = ip_ranges["CidrIp"]
                for cidr_seen in cidrs_seen:
                    if IPNetwork(cidr_seen) in IPNetwork(cidr) or IPNetwork(
                        cidr
                    ) in IPNetwork(cidr_seen):
                        findings.add(
                            Finding(
                                region,
                                "SG_CIDR_OVERLAPS",
                                sg["GroupId"],
                                resource_details={
                                    "SG name:": sg["GroupName"],
                                    "SG description": sg["Description"],
                                    "SG tags": sg.get("Tags", {}),
                                    "cidr1": cidr,
                                    "cidr2": cidr_seen
                                },
                            )
                        )
                cidrs_seen.add(cidr)

    for cidr in cidrs:
        ip = IPNetwork(cidr)
        if ip.size > 2048:
            findings.add(
                Finding(
                    region,
                    "SG_LARGE_CIDR",
                    cidr,
                    resource_details={
                        "size": ip.size,
                        "IP info": str(ip.info),
                        "security_groups": list(cidrs[cidr]),
                    },
                )
            )


def audit_lambda(findings, region):
    # Check for publicly accessible functions.  They should be called from apigateway or something else.
    json_blob = query_aws(region.account, "lambda-list-functions", region)
    for function in json_blob.get("Functions", []):
        name = function["FunctionName"]

        # Check policy
        policy_file_json = get_parameter_file(region, "lambda", "get-policy", name)
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json["Policy"]
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(region, "LAMBDA_PUBLIC", name, resource_details=policy_string)
            )


def audit_glacier(findings, region):
    # Check for publicly accessible vaults.
    json_blob = query_aws(region.account, "glacier-list-vaults", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for vault in json_blob.get("VaultList", []):
        name = vault["VaultName"]

        # Check policy
        policy_file_json = get_parameter_file(
            region, "glacier", "get-vault-access-policy", name
        )
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json["policy"]["Policy"]
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(region, "GLACIER_PUBLIC", name, resource_details=policy_string)
            )


def audit_kms(findings, region):
    # Check for publicly accessible KMS keys.
    json_blob = query_aws(region.account, "kms-list-keys", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for key in json_blob.get("Keys", []):
        name = key["KeyId"]

        # Check policy
        policy_file_json = get_parameter_file(region, "kms", "get-key-policy", name)
        if policy_file_json is None:
            # No policy
            continue

        # Find the entity we need
        policy_string = policy_file_json["Policy"]
        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(region, "KMS_PUBLIC", name, resource_details=policy_string)
            )


def audit_sqs(findings, region):
    # Check for publicly accessible sqs.
    json_blob = query_aws(region.account, "sqs-list-queues", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for queue in json_blob.get("QueueUrls", []):
        queue_name = queue.split("/")[-1]
        # Check policy
        queue_attributes = get_parameter_file(
            region, "sqs", "get-queue-attributes", queue
        )
        if queue_attributes is None:
            # No policy
            continue

        # Find the entity we need
        attributes = queue_attributes["Attributes"]
        if "Policy" in attributes:
            policy_string = attributes["Policy"]
        else:
            # No policy set
            continue

        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(
                    region, "SQS_PUBLIC", queue_name, resource_details=policy_string
                )
            )


def audit_sns(findings, region):
    # Check for publicly accessible sns.
    json_blob = query_aws(region.account, "sns-list-topics", region)
    if json_blob is None:
        # Service not supported in the region
        return

    for topic in json_blob.get("Topics", []):
        # Check policy
        attributes = get_parameter_file(
            region, "sns", "get-topic-attributes", topic["TopicArn"]
        )
        if attributes is None:
            # No policy
            continue

        # Find the entity we need
        attributes = attributes["Attributes"]
        if "Policy" in attributes:
            policy_string = attributes["Policy"]
        else:
            # No policy set
            continue

        # Load the string value as json
        policy = json.loads(policy_string)
        policy = Policy(policy)
        if policy.is_internet_accessible():
            findings.add(
                Finding(
                    region,
                    "SNS_PUBLIC",
                    topic["TopicArn"],
                    resource_details=policy_string,
                )
            )


def audit_lightsail(findings, region):
    # Just check if lightsail is in use
    json_blob = query_aws(region.account, "lightsail-get-instances", region)
    if json_blob is None:
        # Service not supported in the region
        return
    if len(json_blob.get("instances", [])) > 0:
        findings.add(
            Finding(
                region,
                "LIGHTSAIL_IN_USE",
                None,
                resource_details={"instance count": len(json_blob["instances"])},
            )
        )

    json_blob = query_aws(region.account, "lightsail-get-load-balancers", region)
    if json_blob is None:
        # Service not supported in the region
        return
    if len(json_blob.get("loadBalancers", [])) > 0:
        findings.add(
            Finding(
                region,
                "LIGHTSAIL_IN_USE",
                None,
                resource_details={
                    "load balancer count": len(json_blob["loadBalancers"])
                },
            )
        )


def audit(accounts):
    findings = Findings()

    custom_auditor = None
    commands_path = "private_commands"
    for importer, command_name, _ in pkgutil.iter_modules([commands_path]):
        if "custom_auditor" != command_name:
            continue

        full_package_name = "%s.%s" % (commands_path, command_name)
        custom_auditor = importlib.import_module(full_package_name)

        for name, method in inspect.getmembers(custom_auditor, inspect.isfunction):
            if name.startswith("custom_filter"):
                global custom_filter
                custom_filter = method

    for account in accounts:
        account = Account(None, account)

        for region_json in get_regions(account):
            region = Region(account, region_json)

            try:
                if region.name == "us-east-1":
                    audit_s3_buckets(findings, region)
                    audit_cloudtrail(findings, region)
                    audit_iam(findings, region)
                    audit_password_policy(findings, region)
                    audit_root_user(findings, region)
                    audit_users(findings, region)
                    audit_route53(findings, region)
                    audit_cloudfront(findings, region)
                    audit_s3_block_policy(findings, region, account.name)
                audit_guardduty(findings, region)
                audit_accessanalyzer(findings, region)
                audit_ebs_snapshots(findings, region)
                audit_rds_snapshots(findings, region)
                audit_rds(findings, region)
                audit_amis(findings, region)
                audit_ecr_repos(findings, region)
                audit_redshift(findings, region)
                audit_es(findings, region)
                audit_ec2(findings, region)
                audit_elbv1(findings, region)
                audit_elbv2(findings, region)
                audit_sg(findings, region)
                audit_lambda(findings, region)
                audit_glacier(findings, region)
                audit_kms(findings, region)
                audit_sqs(findings, region)
                audit_sns(findings, region)
                audit_lightsail(findings, region)
            except Exception as e:
                findings.add(
                    Finding(
                        region,
                        "EXCEPTION",
                        str(e),
                        resource_details={
                            "exception": str(e),
                            "traceback": str(traceback.format_exc()),
                        },
                    )
                )

            # Run custom auditor if it exists
            try:
                if custom_auditor is not None:
                    for name, method in inspect.getmembers(
                        custom_auditor, inspect.isfunction
                    ):
                        if name.startswith("custom_audit_"):
                            method(findings, region)
            except Exception as e:
                findings.add(
                    Finding(
                        region,
                        "EXCEPTION",
                        str(e),
                        resource_details={
                            "exception": str(e),
                            "traceback": str(traceback.format_exc()),
                        },
                    )
                )

    return findings
