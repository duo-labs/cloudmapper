import argparse
import yaml
import json

from shared.common import parse_arguments
from shared.audit import audit, load_audit_config, finding_is_filtered

__description__ = "Identify potential issues such as public S3 buckets"


def audit_command(accounts, config, args):
    """Audit the accounts"""

    findings = audit(accounts)
    audit_config = load_audit_config()

    # Print findings
    for finding in findings:
        conf = audit_config[finding.issue_id]

        if finding_is_filtered(finding, conf):
            continue

        if args.json:
            finding = json.loads(str(finding))
            finding['finding_type_metadata']= conf
            print(json.dumps(finding))
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
