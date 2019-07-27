from __future__ import print_function
import json

from shared.common import parse_arguments
from shared.find_unused import find_unused_resources


__description__ = "Find unused resources in accounts"


def run(arguments):
    _, accounts, config = parse_arguments(arguments)
    unused_resources = find_unused_resources(accounts)

    print(json.dumps(unused_resources, indent=2, sort_keys=True))
