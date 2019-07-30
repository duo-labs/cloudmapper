import argparse

from shared.common import parse_arguments
from shared.iam_audit import find_admins

__description__ = "Find privileged users and roles in accounts"


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--privs",
        help="The privileges to look for",
        default="iam:PutRolePolicy,iam:AddUserToGroup,iam:AddRoleToInstanceProfile,iam:AttachGroupPolicy,iam:AttachRolePolicy,iam:AttachUserPolicy,iam:ChangePassword,iam:CreateAccessKey,iam:DeleteUserPolicy,iam:DetachGroupPolicy,iam:DetachRolePolicy,iam:DetachUserPolicy"
    )
    args, accounts, config = parse_arguments(arguments, parser)

    admins = find_admins(accounts, args, findings=set())

    for admin in admins:
        print("{}\t{}\t{}".format(admin["account"], admin["type"], admin["name"]))
