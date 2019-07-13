import argparse
import yaml

from shared.common import parse_arguments
from shared.audit import audit


__description__ = "Identify potential issues such as public S3 buckets"


def audit_command(accounts, config, args):
    """Audit the accounts"""

    findings = audit(accounts)

    with open("audit_config.yaml", "r") as f:
        audit_config = yaml.safe_load(f)
    # TODO: Check the file is formatted correctly

    # Print findings
    for finding in findings:
        conf = audit_config[finding.issue_id]
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
