import argparse
import yaml

from shared.common import parse_arguments
from shared.audit import audit, finding_is_filtered
from os.path import exists

__description__ = "Identify potential issues such as public S3 buckets"


def audit_command(accounts, config, args):
    """Audit the accounts"""

    findings = audit(accounts)

    with open("audit_config.yaml", "r") as f:
        audit_config = yaml.safe_load(f)
    # TODO: Check the file is formatted correctly

    if exists("config/audit_config_override.yaml"):
        with open("config/audit_config_override.yaml", "r") as f:
            audit_override = yaml.safe_load(f)

            # Over-write the values from audit_config
            for finding_id in audit_override:
                for k in audit_override[finding_id]:
                    audit_config[finding_id][k] = audit_override[finding_id][k]

    # Print findings
    for finding in findings:
        conf = audit_config[finding.issue_id]

        if finding_is_filtered(finding, conf):
            continue

        if args.json:
            print(finding)
        else:
            print(
                "{} - {} ({}) - {}: {}".format(
                    conf["severity"].upper(),
                    finding.region.account.name,
                    finding.region.name,
                    conf["title"],
                    finding.resource_id,
                )
            )


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--json",
        help="Print the json of the issues",
        default=False,
        action="store_true",
    )
    args, accounts, config = parse_arguments(arguments, parser)

    audit_command(accounts, config, args)
