import urllib
import os
import json


def query_aws(account, query, region=None):
    if not region:
        file_name = "account-data/{}/{}.json".format(account.name, query)
    else:
        if not isinstance(region, str):
            region = region.name
        file_name = "account-data/{}/{}/{}.json".format(account.name, region, query)
    if os.path.isfile(file_name):
        return json.load(open(file_name))
    else:
        return {}


def get_parameter_file(region, service, function, parameter_value):
    file_name = "account-data/{}/{}/{}/{}".format(
        region.account.name,
        region.name,
        "{}-{}".format(service, function),
        urllib.parse.quote_plus(parameter_value),
    )
    if not os.path.isfile(file_name):
        return None
    if os.path.getsize(file_name) <= 4:
        return None

    # Load the json data from the file
    return json.load(open(file_name))
