import unittest
import json
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import parse_arguments
from shared.audit import audit


class TestAudit(unittest.TestCase):

    def test_audit(self):
        args, accounts, config = parse_arguments(['--accounts', 'demo', '--config', 'config.json.demo'], None)
        findings = audit(accounts)

        assert_equal(5, len(findings))
