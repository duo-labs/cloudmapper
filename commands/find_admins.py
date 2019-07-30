import argparse

from shared.common import parse_arguments
from shared.iam_audit import find_admins

__description__ = "Find privileged users and roles in accounts"


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--privs",
        help="The privileges to look for. Defaults to iam privileges that allow direct admin or escalation.",
        default=None
    )
    args, accounts, config = parse_arguments(arguments, parser)

    admins = find_admins(accounts, args, findings=set())

    for admin in admins:
        print("{}\t{}\t{}".format(admin["account"], admin["type"], admin["name"]))
