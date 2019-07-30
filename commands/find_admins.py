import argparse
import json

from shared.common import parse_arguments
from shared.iam_audit import find_admins

__description__ = "Find privileged users and roles in accounts"


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--privs",
        help="The privileges to look for. Defaults to iam privileges that allow direct admin or escalation.",
        default=None,
    )
    parser.add_argument(
        "--json",
        help="Print the json of the issues",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--include_restricted",
        help="Include references to these privs that may be restricted by resources or conditions",
        default=False,
        action="store_true",
    )
    args, accounts, config = parse_arguments(arguments, parser)

    admins = find_admins(accounts, args, findings=set())

    for admin in admins:
        if args.json:
            print(json.dumps(admin, sort_keys=True))
        else:
            print("{}\t{}\t{}".format(admin["account"], admin["type"], admin["name"]))
