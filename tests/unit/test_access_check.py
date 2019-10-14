import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from commands.access_check import (
    replace_principal_variables,
    Principal,
    get_privilege_statements,
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
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
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
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
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
            len(get_privilege_statements(policy_doc, privilege_matches, "*", principal))
            > 0
        )

        # Check it against a specific resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc, privilege_matches, "arn:aws:sns:*:*:prod-*", principal
                )
            )
            > 0
        )
        # Ensure we get zero when we use a different resource
        assert_true(
            len(
                get_privilege_statements(
                    policy_doc, privilege_matches, "arn:aws:sns:*:*:dev-*", principal
                )
            )
            == 0
        )

    # def test_access_check(self):
    #     args, accounts, config = parse_arguments(
    #         ["--accounts", "demo", "--config", "config.json.demo"], None
    #     )
    #     findings = audit(accounts)

    #     issue_ids = set()
    #     for finding in findings:
    #         print(finding)
    #         issue_ids.add(finding.issue_id)

    #     assert_equal(
    #         issue_ids,
    #         set(
    #             [
    #                 # The trail includes "IsMultiRegionTrail": false
    #                 "CLOUDTRAIL_NOT_MULTIREGION",
    #             ]
    #         ),
    #     )
