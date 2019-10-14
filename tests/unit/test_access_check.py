import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from commands.access_check import replace_principal_variables, Principal


class TestAccessCheck(unittest.TestCase):
    def test_replace_principal_variables(self):
        principal = Principal("AssumedRole", [{"Key": "project", "Value": "prod"}], username="role", userid="")
        assert_equal(replace_principal_variables("*", principal), "*")

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
