from __future__ import print_function
import sys
import json
from shared.common import parse_arguments
from shared.public import get_public_nodes

__description__ = "Find publicly exposed services and their ports"


def public(accounts, config):
    all_accounts = []

    for account in accounts:
        public_nodes, warnings = get_public_nodes(account, config)
        for public_node in public_nodes:
            all_accounts.append(public_node)
        for warning in warnings:
            print("WARNING: {}".format(warning), file=sys.stderr)
    
    print(json.dumps(all_accounts, indent=4, sort_keys=True))


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    public(accounts, config)
