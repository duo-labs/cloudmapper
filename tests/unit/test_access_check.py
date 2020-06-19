import argparse
import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from commands.access_check import (
    replace_principal_variables,
    Principal,
    get_privilege_statements,
    get_allowed_privileges,
    access_check_command,
)


class TestAccessCheck(unittest.TestCase):
    def test_replace_principal_variables(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        assert_equal(replace_principal_variables("*", principal), "*")
        # Ensure replacement works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:PrincipalTag/project}", principal
            ),
            "arn:aws:sns:*:*:prod",
        )
        # Ensure case insensitive replacement works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:principaltag/project}", principal
            ),
            "arn:aws:sns:*:*:prod",
        )
        # Ensure we don't replace unknown variables
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:principaltag/app}", principal
            ),
            "arn:aws:sns:*:*:${aws:principaltag/app}",
        )
        # Ensure multiple replacements works
        assert_equal(
            replace_principal_variables(
                "arn:aws:sns:*:*:${aws:PrincipalTag/project}-${aws:PrincipalTag/color}",
                principal,
            ),
            "arn:aws:sns:*:*:prod-blue",
        )

    def test_get_privilege_statements(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowSNSAccessBasedOnArnMatching",
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        "arn:aws:sns:*:*:${aws:PrincipalTag/project}-*"
                    ]
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)

        # Ensure this works at all
        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "GetObject",
                "resource_type": "object",
            }
        ]
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc,
                    privilege_matches,
                    "*",
                    principal,
                    policy_identifier="unit_test",
                )
            )
            > 0
        )

        # Ensure it doesn't return anything when we check for a privilege we don't have (s3:PutObject)
        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "PutObject",
                "resource_type": "object",
            }
        ]
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc,
                    privilege_matches,
                    "*",
                    principal,
                    policy_identifier="unit_test",
                )
            )
            == 0
        )

        # Check the SNS privilege
        privilege_matches = [
            {
                "privilege_prefix": "sns",
                "privilege_name": "Publish",
                "resource_type": "topic",
            }
        ]
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc,
                    privilege_matches,
                    "*",
                    principal,
                    policy_identifier="unit_test",
                )
            )
            > 0
        )

        # Check it against a specific resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc,
                    privilege_matches,
                    "arn:aws:sns:*:*:prod-*",
                    principal,
                    policy_identifier="unit_test",
                )
            )
            > 0
        )
        # Ensure we get zero when we use a different resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc,
                    privilege_matches,
                    "arn:aws:sns:*:*:dev-*",
                    principal,
                    policy_identifier="unit_test",
                )
            )
            == 0
        )

    def test_get_allowed_privileges(self):
        principal = Principal(
            "AssumedRole",
            [{"Key": "project", "Value": "prod"}, {"Key": "color", "Value": "blue"}],
            username="role",
            userid="",
        )

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "s3:GetObject",
                    "Effect": "Allow",
                    "Resource": "*"
                },
                {
                    "Sid": "AllowSNSAccessBasedOnArnMatching",
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        "arn:aws:sns:*:*:${aws:PrincipalTag/project}-*"
                    ]
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)

        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "GetObject",
                "resource_type": "object",
            }
        ]
        stmts = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )

        # Ensure we have allowed statements when there is no boundary
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

        # Ensure we have allowed statements when the boundary matches what was allowed
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, stmts)) > 0)

        policy_doc = """
        {
            "Statement": [
                {
                    "Action": "*",
                    "Effect": "Deny",
                    "Resource": "*"
                }
            ],
            "Version": "2012-10-17"
        }"""
        policy_doc = json.loads(policy_doc)
        boundary = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )

        # Ensure nothing is allowed when the boundary denies all
        assert_true(
            len(get_allowed_privileges(privilege_matches, stmts, boundary)) == 0
        )

    def test_conditions_on_principal_tags(self):
        # Example from https://aws.amazon.com/blogs/security/working-backward-from-iam-policies-and-principal-tags-to-standardized-names-and-tags-for-your-aws-resources/
        principal = Principal(
            "AssumedRole",
            [
                {"Key": "project", "Value": "web"},
                {"Key": "access-team", "Value": "eng"},
                {"Key": "cost-center", "Value": "987654"},
            ],
            username="role",
            userid="",
        )

        policy_doc = """
        {
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "s3:ListAllMyBuckets",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": { "aws:PrincipalTag/project": "web" }
                    }
                }
            ],
            "Version": "2012-10-17"
        }"""

        policy_doc = json.loads(policy_doc)

        # Ensure this works at all
        privilege_matches = [
            {
                "privilege_prefix": "s3",
                "privilege_name": "ListAllMyBuckets",
                "resource_type": "object",
            }
        ]
        stmts = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

        principal = Principal(
            "AssumedRole",
            [
                {"Key": "project", "Value": "database"},
                {"Key": "access-team", "Value": "eng"},
                {"Key": "cost-center", "Value": "987654"},
            ],
            username="role",
            userid="",
        )

        stmts = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) == 0)

    # def test_conditions_on_resource_tags_ec2(self):
    #     # TODO
    #     # Example from https://aws.amazon.com/blogs/security/working-backward-from-iam-policies-and-principal-tags-to-standardized-names-and-tags-for-your-aws-resources/
    #     principal = Principal(
    #         "AssumedRole",
    #         [{"Key": "access-project", "Value": "peg"}, {"Key": "access-team", "Value": "eng"}, {"Key": "cost-center", "Value": "987654"}],
    #         username="role",
    #         userid="",
    #     )

    #     policy_doc = """{
    #         "Action":[
    #             "ec2:StartInstances",
    #             "ec2:StopInstances"
    #         ],
    #         "Resource":[
    #             "arn:aws:ec2:*:*:instance/*"
    #         ],
    #         "Effect":"Allow",
    #         "Condition":{
    #             "StringEquals":{
    #                 "ec2:ResourceTag/access-project":"web"
    #             }
    #         }
    #     }"""

    #     policy_doc = json.loads(policy_doc)

    #     # Ensure this works at all
    #     privilege_matches = [
    #         {
    #             "privilege_prefix": "ec2",
    #             "privilege_name": "StopInstances",
    #             "resource_type": "instance",
    #         }
    #     ]
    #     stmts = get_privilege_statements(policy_doc, privilege_matches, "*", principal)
    #     # TODO Need to get resource info
    #     print("get_privilege_statements: {}".format(stmts))
    #     assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

    # def test_conditions_on_resource_and_principal_tags_ec2(self):
    #     # TODO
    #     # Example from https://aws.amazon.com/blogs/security/working-backward-from-iam-policies-and-principal-tags-to-standardized-names-and-tags-for-your-aws-resources/
    #     principal = Principal(
    #         "AssumedRole",
    #         [{"Key": "access-project", "Value": "peg"}, {"Key": "access-team", "Value": "eng"}, {"Key": "cost-center", "Value": "987654"}],
    #         username="role",
    #         userid="",
    #     )

    #     policy_doc = """{
    #         "Action":[
    #             "ec2:StartInstances",
    #             "ec2:StopInstances"
    #         ],
    #         "Resource":[
    #             "arn:aws:ec2:*:*:instance/*"
    #         ],
    #         "Effect":"Allow",
    #         "Condition":{
    #             "StringEquals":{
    #                 "ec2:ResourceTag/access-project":"${aws:PrincipalTag/access-project}"
    #             }
    #         }
    #     }"""

    #     policy_doc = json.loads(policy_doc)

    #     # Ensure this works at all
    #     privilege_matches = [
    #         {
    #             "privilege_prefix": "ec2",
    #             "privilege_name": "StopInstances",
    #             "resource_type": "instance",
    #         }
    #     ]
    #     stmts = get_privilege_statements(policy_doc, privilege_matches, "*", principal)
    #     # TODO Need to get resource info
    #     print("get_privilege_statements: {}".format(stmts))
    #     assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

    # def test_conditions_on_resource_and_principal_tags_rds(self):
    #     # TODO
    #     # Example from https://aws.amazon.com/blogs/security/working-backward-from-iam-policies-and-principal-tags-to-standardized-names-and-tags-for-your-aws-resources/
    #     principal = Principal(
    #         "AssumedRole",
    #         [{"Key": "access-project", "Value": "peg"}, {"Key": "access-team", "Value": "eng"}, {"Key": "cost-center", "Value": "987654"}],
    #         username="role",
    #         userid="",
    #     )

    #     policy_doc = """{
    #         "Version": "2012-10-17",
    #         "Statement": [
    #             {
    #                 "Effect": "Allow",
    #                 "Action": "rds:DescribeDBInstances",
    #                 "Resource": "*"
    #             },
    #             {
    #                 "Effect": "Allow",
    #                 "Action": [
    #                     "rds:RebootDBInstance",
    #                     "rds:StartDBInstance",
    #                     "rds:StopDBInstance"
    #                 ],
    #                 "Resource": "*",
    #                 "Condition": {
    #                     "StringEquals": {
    #                         "aws:PrincipalTag/CostCenter": "0735",
    #                         "rds:db-tag/Project": "DataAnalytics"
    #                     }
    #                 }
    #             }
    #         ]
    #     }"""

    #     policy_doc = json.loads(policy_doc)

    #     # Ensure this works at all
    #     privilege_matches = [
    #         {
    #             "privilege_prefix": "ec2",
    #             "privilege_name": "StopInstances",
    #             "resource_type": "instance",
    #         }
    #     ]
    #     stmts = get_privilege_statements(policy_doc, privilege_matches, "*", principal)
    #     # TODO Need to get resource info
    #     print("get_privilege_statements: {}".format(stmts))
    #     assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

    def test_conditions_on_resource_and_principal_tags_complex_secrets(self):
        principal = Principal(
            "AssumedRole",
            [
                {"Key": "access-project", "Value": "peg"},
                {"Key": "access-team", "Value": "eng"},
                {"Key": "cost-center", "Value": "987654"},
            ],
            username="role",
            userid="",
        )

        policy_doc = """
        {
 "Version": "2012-10-17",
 "Statement": [
     {
         "Sid": "AllActionsSecretsManagerSameProjectSameTeam",
         "Effect": "Allow",
         "Action": "secretsmanager:*",
         "Resource": "*",
         "Condition": {
             "StringEquals": {
                 "aws:ResourceTag/access-project": "${aws:PrincipalTag/access-project}",
                 "aws:ResourceTag/access-team": "${aws:PrincipalTag/access-team}",
                 "aws:ResourceTag/cost-center": "${aws:PrincipalTag/cost-center}"
             },
             "ForAllValues:StringEquals": {
                 "aws:TagKeys": [
                     "access-project",
                     "access-team",
                     "cost-center",
                     "Name",
                     "OwnedBy"
                 ]
             },
             "StringEqualsIfExists": {
                 "aws:RequestTag/access-project": "${aws:PrincipalTag/access-project}",
                 "aws:RequestTag/access-team": "${aws:PrincipalTag/access-team}",
                 "aws:RequestTag/cost-center": "${aws:PrincipalTag/cost-center}"
             }
         }
     },
     {
         "Sid": "AllResourcesSecretsManagerNoTags",
         "Effect": "Allow",
         "Action": [
             "secretsmanager:GetRandomPassword",
             "secretsmanager:ListSecrets"
         ],
         "Resource": "*"
     },
     {
         "Sid": "ReadSecretsManagerSameTeam",
         "Effect": "Allow",
         "Action": [
             "secretsmanager:Describe*",
             "secretsmanager:Get*",
             "secretsmanager:List*"
         ],
         "Resource": "*",
         "Condition": {
             "StringEquals": {
                 "aws:ResourceTag/access-team": "${aws:PrincipalTag/access-team}"
             }
         }
     },
     {
         "Sid": "DenyUntagSecretsManagerReservedTags",
         "Effect": "Deny",
         "Action": "secretsmanager:UntagResource",
         "Resource": "*",
         "Condition": {
             "StringLike": {
                 "aws:TagKeys": "access-*"
             }
         }
     },
     {
         "Sid": "DenyPermissionsManagement",
         "Effect": "Deny",
         "Action": "secretsmanager:*Policy",
         "Resource": "*"
     }
 ]
}"""
        policy_doc = json.loads(policy_doc)

        # Ensure this works at all
        privilege_matches = [
            {
                "privilege_prefix": "secretsmanager",
                "privilege_name": "ListSecrets",
                "resource_type": "secret",
            }
        ]
        stmts = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) > 0)

        # Ensure the Deny in the policy works
        privilege_matches = [
            {
                "privilege_prefix": "secretsmanager",
                "privilege_name": "PutResourcePolicy",
                "resource_type": "secret",
            }
        ]
        stmts = get_privilege_statements(
            policy_doc, privilege_matches, "*", principal, policy_identifier="unit_test"
        )
        assert_true(len(get_allowed_privileges(privilege_matches, stmts, None)) == 0)

        # TODO Testing these conditions requires getting resource tags

        # for stmt in stmts:
        #     for m in stmt["matching_statements"]:
        #         print(m)
        # exit(-1)
        # assert_true(
        #     len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
        #     > 0
        # )

    def test_access_check(self):
        # This test calls the access_check command across the demo data,
        # thereby excersising much of its code

        # TODO This parsing code should not be here
        parser = argparse.ArgumentParser()
        parser.add_argument(
            "--resource_arn",
            help="The resource to be looked at, such as arn:aws:s3:::mybucket",
            required=True,
        )
        parser.add_argument(
            "--privilege", help="The privilege in question (ex. s3:GetObject)"
        )
        args, accounts, config = parse_arguments(
            [
                "--accounts",
                "demo",
                "--config",
                "config.json.demo",
                "--resource_arn",
                "arn:aws:sns:*:*:prod-*",
            ],
            parser,
        )
        access_check_command(accounts, config, args)
        # TODO Have that function return results that can be tested
