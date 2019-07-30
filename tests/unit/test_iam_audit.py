import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.iam_audit import find_admins
from shared.common import parse_arguments


class TestIamAudit(unittest.TestCase):
    def test_find_admins(self):
        args, accounts, config = parse_arguments(
            ["--accounts", "demo", "--config", "config.json.demo"], None
        )

        findings = set()
        admins = find_admins(accounts, args, findings)

        assert_equal(admins, [{"account": "demo", "name": "bad_role", "type": "role"}])
