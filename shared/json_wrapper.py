"""
Wrappers for the json package
"""

import json


def json_dumps(data: object, indent: int = None, default=None, sort_keys: bool = True) -> str:
    """Wrapper for the json.dumps function from json package

    Serializes _data_ to a JSON formatted str with sorted_keys True by default

    See https://docs.python.org/3/library/json.html#json.dumps for more info

    Args:
        data: data to serialize
        indent: optional indent for our JSON output, None by default
        default: default function to call if objects can't be serialized, None by default
        sort_keys: if we want the keys sorted, True by default

    Returns:
        Formatted JSON as a str

    Raises:
        JsonWrapperException: exception if anything goes wrong with the wrapper
    """
    try:
        return json.dumps(data,
                      indent=indent,
                      sort_keys=sort_keys,
                      default=default)
    except Exception:
        raise JsonWrapperException("An error has occurred when calling json_dumps in json_wrapper")


class JsonWrapperException(Exception):
    pass

# TODO : a wrapper for _json.dump_ can be done as well here
