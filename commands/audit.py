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

        if finding_is_filtered(finding, conf, minimum_severity=args.minimum_severity):
            continue

        if args.json:
            finding = json.loads(str(finding))
            finding['finding_type_metadata']= conf
            print(json.dumps(finding, sort_keys=True))
        elif args.markdown:
            print(
                "*Audit Finding: [{}] - {}*\\nAccount: {} ({}) - {}\\nDescription: {}\\nResource: `{}`\\nDetails:```{}```".format(
                    conf["severity"].upper(),
                    conf["title"],
                    finding.region.account.name,
                    finding.region.account.local_id,
                    finding.region.name,
                    conf["description"],
                    finding.resource_id,
                    str(finding.resource_details).replace('\n', '\\n')
                )
            )
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
    parser.add_argument(
        "--markdown",
        help="Print issue as markdown (for Slack)",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--minimum_severity",
        help="Only report issues that are greater than this. Default: INFO",
        default="INFO",
        choices=['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'MUTE']
    )
    args, accounts, config = parse_arguments(arguments, parser)

    audit_command(accounts, config, args)
