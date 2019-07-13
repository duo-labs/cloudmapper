from shared.common import parse_arguments
from shared.iam_audit import find_admins

__description__ = "Find admins in accounts"


def run(arguments):
    _, accounts, _ = parse_arguments(arguments)
    admins = find_admins(accounts, findings=set())

    for admin in admins:
        print("{}\t{}\t{}".format(admin["account"], admin["type"], admin["name"]))
