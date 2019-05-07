import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from shared.audit import audit


class TestAudit(unittest.TestCase):

    def test_audit(self):
        args, accounts, config = parse_arguments(['--accounts', 'demo', '--config', 'config.json.demo'], None)
        findings = audit(accounts)

        issue_ids = set()
        for finding in findings:
            print(finding)
            issue_ids.add(finding.issue_id)

        assert_equal(issue_ids, set([
            # The trail includes "IsMultiRegionTrail": false
            'CLOUDTRAIL_NOT_MULTIREGION',
            # No password policy exists, so no file for it exists
            'PASSWORD_POLICY_NOT_SET',
            'ROOT_USER_HAS_ACCESS_KEYS',
            'USER_HAS_NOT_USED_ACCESS_KEY_FOR_MAX_DAYS',
            'S3_ACCESS_BLOCK_OFF',
            'EXCEPTION'])) # TODO REMOVE 'EXCEPTION'

