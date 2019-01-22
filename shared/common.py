from __future__ import print_function
import argparse
import json
import os
import datetime
import pyjq
from collections import OrderedDict
import yaml
import sys
import urllib.parse
from netaddr import IPNetwork

from shared.nodes import Account, Region


class Severity:
    DEBUG = 0
    INFO = 1
    WARN = 2
    ERROR = 3

    @classmethod
    def str_to_int(cls, level):
        if level == "DEBUG":
            return cls.DEBUG
        elif level == "INFO":
            return cls.INFO
        elif level == "WARN":
            return cls.WARN
        elif level == "ERROR":
            return cls.ERROR
        else:
            raise Exception("Unknown log level {}".format(level))

    @staticmethod
    def string(severity_level):
        if severity_level == Severity.DEBUG:
            return "DEBUG"
        elif severity_level == Severity.INFO:
            return "INFO"
        elif severity_level == Severity.WARN:
            return "WARN"
        elif severity_level == Severity.ERROR:
            return "ERROR"
        else:
            raise Exception("Unknown severity level")

LOG_LEVEL = Severity.INFO

def log_debug(msg, location=None, reasons=[]):
    log_issue(Severity.DEBUG, msg, location, reasons)

def log_info(msg, location=None, reasons=[]):
    log_issue(Severity.INFO, msg, location, reasons)

def log_warning(msg, location=None, reasons=[]):
    log_issue(Severity.WARN, msg, location, reasons)

def log_error(msg, location=None, reasons=[]):
    log_issue(Severity.ERROR, msg, location, reasons)

def log_issue(severity, msg, location=None, reasons=[]):
    if severity >= LOG_LEVEL:
        json_issue = {
            'Severity': Severity.string(severity),
            'Issue': msg,
            'Location': location,
            'Reasons': reasons
        }
        print(json.dumps(json_issue, sort_keys=True), file=sys.stderr)


def custom_serializer(x):
    if isinstance(x, datetime.datetime):
        return x.isoformat()
    elif isinstance(x, bytes):
        return x.decode()
    raise TypeError("Unknown type")


def make_list(v):
    if not isinstance(v, list):
        return [v]
    return v


def is_external_cidr(cidr):
    ipnetwork = IPNetwork(cidr)
    if (
            ipnetwork in IPNetwork("10.0.0.0/8") or
            ipnetwork in IPNetwork("172.16.0.0/12") or
            ipnetwork in IPNetwork("192.168.0.0/16")
    ):
        return False
    return True


def query_aws(account, query, region=None):
    if not region:
        file_name = 'account-data/{}/{}.json'.format(account.name, query)
    else:
        file_name = 'account-data/{}/{}/{}.json'.format(account.name, region.name, query)
    if os.path.isfile(file_name):
        return json.load(open(file_name))
    else:
        return {}


def get_parameter_file(region, service, function, parameter_value):
    file_name = 'account-data/{}/{}/{}/{}'.format(
        region.account.name,
        region.name,
        '{}-{}'.format(service, function),
        urllib.parse.quote_plus(parameter_value))
    if not os.path.isfile(file_name):
        return None
    if os.path.getsize(file_name) <= 4:
        return None

    # Load the json data from the file
    return json.load(open(file_name))


def get_regions(account, outputfilter={}):
    # aws ec2 describe-regions
    region_data = query_aws(account, "describe-regions")

    region_filter = ""
    if "regions" in outputfilter:
        region_filter = "| select(.RegionName | contains({}))".format(outputfilter["regions"])

    regions = pyjq.all('.Regions[]{}'.format(region_filter), region_data)
    return regions


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


def get_account_stats(account):
    """Returns stats for an account"""

    with open("stats_config.yaml", 'r') as f:
        resources = yaml.safe_load(f)

    account = Account(None, account)
    log_debug('Collecting stats in account {} ({})'.format(account.name, account.local_id))

    stats = {}
    stats['keys'] = []
    for resource in resources:
        stats['keys'].append(resource['name'])
        stats[resource['name']] = {}


    for region_json in get_regions(account):
        region = Region(account, region_json)

        for resource in resources:
            # Skip global services (just CloudFront)
            if ('region' in resource) and (resource['region'] != region.name):
                continue

            # Normal path
            stats[resource['name']][region.name] = sum(pyjq.all(resource['query'], 
                query_aws(region.account, resource['source'], region)))

    return stats


def get_us_east_1(account):
    for region_json in get_regions(account):
        region = Region(account, region_json)
        if region.name == 'us-east-1':
            return region
    
    raise Exception('us-east-1 not found')


def get_collection_date(account):
    account_struct = Account(None, account)
    json_blob = query_aws(account_struct, "iam-get-credential-report", get_us_east_1(account_struct))
    # GeneratedTime looks like "2019-01-30T15:43:24+00:00"
    return json_blob['GeneratedTime'][:10]


def get_access_advisor_active_counts(account, max_age=90):
    region = get_us_east_1(account)
    
    json_account_auth_details = query_aws(region.account, "iam-get-account-authorization-details", region)
    
    account_stats = {'users': {'active': 0, 'inactive': 0}, 'roles': {'active': 0, 'inactive': 0}}
    for principal_auth in [*json_account_auth_details['UserDetailList'], *json_account_auth_details['RoleDetailList']]:
        stats = {}
        stats['auth'] = principal_auth

        principal_type = 'roles'
        if 'UserName' in principal_auth:
            principal_type = 'users'
        
        job_id = get_parameter_file(region, 'iam', 'generate-service-last-accessed-details', principal_auth['Arn'])['JobId']
        json_last_access_details = get_parameter_file(region, 'iam', 'get-service-last-accessed-details', job_id)
        stats['last_access'] = json_last_access_details

        stats['is_inactive'] = True

        job_completion_date = datetime.datetime.strptime(json_last_access_details['JobCompletionDate'][0:10], '%Y-%m-%d')

        for service in json_last_access_details['ServicesLastAccessed']:
            if 'LastAuthenticated' in service:
                last_access_date = datetime.datetime.strptime(service['LastAuthenticated'][0:10], '%Y-%m-%d')
                if (job_completion_date - last_access_date).days < max_age:
                    stats['is_inactive'] = False
                    break
        
        if stats['is_inactive']:
            account_stats[principal_type]['inactive'] += 1
        else:
            account_stats[principal_type]['active'] += 1
        
    return account_stats