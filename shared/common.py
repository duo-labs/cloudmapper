from __future__ import print_function
import sys
import argparse
import json
import os
import pyjq
import datetime


def datetime_handler(x):
    if isinstance(x, datetime.datetime):
        return x.isoformat()
    raise TypeError("Unknown type")


def make_list(v):
    if not isinstance(v, list):
        return [v]
    return v


def query_aws(account, query, region=None):
    if not region:
        file_name = 'account-data/{}/{}.json'.format(account.name, query)
    else:
        file_name = 'account-data/{}/{}/{}.json'.format(account.name, region.name, query)
    if os.path.isfile(file_name):
        return json.load(open(file_name))
    else:
        return {}


def get_account(account_name, config, config_filename):
    for account in config["accounts"]:
        if account["name"] == account_name:
            return account
        if account_name is None and account.get("default", False):
            return account

    # Else could not find account
    if account_name is None:
        exit("ERROR: Must specify an account, or set one in {} as a default".format(config_filename))
    exit("ERROR: Account named \"{}\" not found in {}".format(account_name, config_filename))


def parse_arguments(arguments, parser=None):
    """Returns (args, accounts, config)"""
    if parser is None:
        parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Config file name",
                        default="config.json", type=str)
    parser.add_argument("--accounts", help="Accounts to collect from",
                        required=True, type=str)
    parser.add_argument("--log_level", help="Log level to record (DEBUG, INFO, WARN, ERROR)",
                        default="INFO", required=False, type=str)
    args = parser.parse_args(arguments)

    global LOG_LEVEL
    LOG_LEVEL = Severity.str_to_int(args.log_level)

    # Read accounts file
    try:
        config = json.load(open(args.config))
    except IOError:
        exit("ERROR: Unable to load config file \"{}\"".format(args.config))
    except ValueError as e:
        exit("ERROR: Config file \"{}\" could not be loaded ({}), see config.json.demo for an example".format(args.config, e))

    # Get accounts
    account_names = args.accounts.split(',')
    accounts = []
    # TODO Need to be able to tag accounts into sets (ex. Prod, or by business unit) so the tag can be referenced
    # as opposed to the individual account names.
    for account_name in account_names:
        if account_name == 'all':
            for account in config["accounts"]:
                accounts.append(account)
            break
        accounts.append(get_account(account_name, config, args.config))
    

    return (args, accounts, config)