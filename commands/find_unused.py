from __future__ import print_function

from shared.common import parse_arguments
from shared.find_unused import find_unused_resources
from shared.json_wrapper import json_dumps


__description__ = "Find unused resources in accounts"


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    unused_resources = find_unused_resources(accounts)

    print(json_dumps(unused_resources, indent=2))
