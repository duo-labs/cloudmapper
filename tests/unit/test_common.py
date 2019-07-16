import unittest
import argparse
from nose.tools import assert_equal, assert_true, assert_false

from shared.common import (
    make_list,
    parse_arguments,
    get_account_stats,
    get_account,
    get_collection_date,
    get_access_advisor_active_counts,
)


class TestCommon(unittest.TestCase):
    def test_make_list(self):
        assert_equal(["hello"], make_list("hello"))
        assert_equal(["hello"], make_list(["hello"]))

    def test_parse_arguments(self):
        parser = argparse.ArgumentParser()
        parser.add_argument(
            "--json",
            help="Print the json of the issues",
            default=False,
            action="store_true",
        )
        args, accounts, config = parse_arguments(
            ["--json", "--accounts", "demo", "--config", "config.json.demo"], parser
        )

        assert_equal(args.json, True)

    def test_get_account_stats(self):
        account = get_account("demo")

        stats = get_account_stats(account, True)
        assert_equal(stats["EC2 instances"]["us-east-1"], 3)

    def test_get_collection_date(self):
        account = get_account("demo")
        assert_equal("2019-05-07T15:40:22+00:00", get_collection_date(account))

    # def test_get_access_advisor_active_counts(self):
    #     account = get_account("demo")
    #     stats = get_access_advisor_active_counts(account)
