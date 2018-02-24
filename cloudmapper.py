#! /usr/bin/env python
"""
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
---------------------------------------------------------------------------

This script manages CloudMapper, a tool for creating network diagrams of AWS environments.
"""
from __future__ import (absolute_import, division, print_function)
import json
import argparse
import sys
from cloudmapper.webserver import run_webserver

__version__ = "1.0.0"

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


def run_gathering(arguments):
    from cloudmapper.gatherer import gather
    parser = argparse.ArgumentParser()
    parser.add_argument("--account-name", help="Account to collect from",
                        required=True, type=str)
    args = parser.parse_args(arguments)

    gather(args)


def run_configure(arguments):
    from cloudmapper.configure import configure
    if len(arguments) == 0:
        exit("ERROR: Missing action for configure. Should be in {add-cidr|add-account|remove-cidr|remove-account}")
        return
    action = arguments[0]
    arguments = arguments[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument("--config-file", help="Path to the config file",
                        required=True, type=str)
    if action == 'add-account' or action == 'remove-account':
        required = True if action.startswith('add') else False
        parser.add_argument("--name", help="Account name",
                            required=required, type=str)
        parser.add_argument("--id", help="Account ID",
                        required=required, type=str)
        parser.add_argument("--default", help="Default account",
                        required=False, default="False", type=str)
    elif action == 'add-cidr' or action == 'remove-cidr':
        required = True if action.startswith('add') else False
        parser.add_argument("--cidr", help="CIDR IP",
                        required=required, type=str)
        parser.add_argument("--name", help="CIDR Name",
                        required=required, type=str)
    args = parser.parse_args(arguments)
    configure(action, args)


def run_prepare(arguments):
    from cloudmapper.prepare import prepare

    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", help="Config file name",
                        default="config.json", type=str)
    parser.add_argument("--account-name", help="Account to collect from",
                        required=False, type=str)
    parser.add_argument("--regions", help="Regions to restrict to (ex. us-east-1,us-west-2)",
                        default=None, type=str)
    parser.add_argument("--internal-edges", help="Show all connections (default)",
                        dest='internal_edges', action='store_true')
    parser.add_argument("--no-internal-edges", help="Only show connections to external CIDRs",
                        dest='internal_edges', action='store_false')
    parser.add_argument("--inter-rds-edges", help="Show connections between RDS instances",
                        dest='inter_rds_edges', action='store_true')
    parser.add_argument("--no-inter-rds-edges", help="Do not show connections between RDS instances (default)",
                        dest='inter_rds_edges', action='store_false')
    parser.add_argument("--read-replicas", help="Show RDS read replicas (default)",
                        dest='read_replicas', action='store_true')
    parser.add_argument("--no-read-replicas", help="Do not show RDS read replicas",
                        dest='read_replicas', action='store_false')
    parser.add_argument("--azs", help="Show availability zones (default)",
                        dest='azs', action='store_true')
    parser.add_argument("--no-azs", help="Do not show availability zones",
                        dest='azs', action='store_false')
    parser.add_argument("--collapse-by-tag", help="Collapse nodes with the same tag to a single node",
                        dest='collapse_by_tag', default=None, type=str)

    parser.set_defaults(internal_edges=True)
    parser.set_defaults(inter_rds_edges=False)
    parser.set_defaults(read_replicas=True)
    parser.set_defaults(azs=True)

    args = parser.parse_args(arguments)

    outputfilter = {}
    if args.regions:
        # Regions are given as 'us-east-1,us-west-2'. Split this by the comma,
        # wrap each with quotes, and add the comma back. This is needed for how we do filtering.
        outputfilter["regions"] = ','.join(['"' + r + '"' for r in args.regions.split(',')])
    outputfilter["internal_edges"] = args.internal_edges
    outputfilter["read_replicas"] = args.read_replicas
    outputfilter["inter_rds_edges"] = args.inter_rds_edges
    outputfilter["azs"] = args.azs
    outputfilter["collapse_by_tag"] = args.collapse_by_tag

    # Read accounts file
    try:
        config = json.load(open(args.config))
    except IOError:
        exit("ERROR: Unable to load config file \"{}\"".format(args.config))
    except ValueError as e:
        exit("ERROR: Config file \"{}\" could not be loaded ({}), see config.json.demo for an example".format(args.config, e))
    account = get_account(args.account_name, config, args.config)

    prepare(account, config, outputfilter)


def show_help():
    print("CloudMapper {}".format(__version__))
    print("usage: {} [gather|prepare|serve] [...]".format(sys.argv[0]))
    print("  configure: Configure and create your config file")
    print("  gather: Queries AWS for account data and caches it locally")
    print("  prepare: Prepares the data for viewing")
    print("  serve: Runs a local webserver for viewing the data")
    exit(-1)


def main():
    """Entry point for the CLI."""

    # Parse command
    if len(sys.argv) <= 1:
        show_help()

    command = sys.argv[1]
    arguments = sys.argv[2:]

    if command == "prepare":
        run_prepare(arguments)
    elif command == "serve":
        run_webserver(arguments)
    elif command == "gather":
        run_gathering(arguments)
    elif command == "configure":
        run_configure(arguments)
    else:
        show_help()

    print("Complete")


if __name__ == "__main__":
    main()
