import json
import os.path
import netaddr
import argparse

from shared.organization import get_organization_accounts

__description__ = "Add and remove items from the config file"


def configure(action, arguments):
    if not os.path.isfile(arguments.config_file):
        print("Config file does not exist, creating one")
        config = {"accounts": [], "cidrs": {}}
    else:
        with open(arguments.config_file, "r") as f:
            config = json.loads(f.read())
    if action == "add-account":
        config["accounts"].append(
            {
                "id": str(arguments.id),
                "name": str(arguments.name),
                "default": True if arguments.default.lower() == "true" else False,
            }
        )
    elif action == "add-cidr":
        try:
            netaddr.IPNetwork(arguments.cidr)
        except netaddr.core.AddrFormatError:
            exit("ERROR: CIDR is not valid")
            return
        config["cidrs"][str(arguments.cidr)] = {"name": str(arguments.name)}
    elif action == "remove-account":
        if arguments.name is None or arguments.id is None:

            def condition(x, y):
                return x or y

        else:

            def condition(x, y):
                return x and y

        for account in config["accounts"]:
            if condition(
                account["id"] == arguments.id, account["name"] == arguments.name
            ):
                config["accounts"].remove(account)
    elif action == "remove-cidr":
        if arguments.name is None or arguments.cidr is None:

            def condition(x, y):
                return x or y

        else:

            def condition(x, y):
                return x and y

        # Force it to be a complete set so that deleting the key later on doesn't raise an error because the dictionary Size changed during iteration
        for cidr in set(config["cidrs"].keys()):
            name = config["cidrs"][cidr]["name"]
            if condition(cidr == arguments.cidr, name == arguments.name):
                del config["cidrs"][cidr]
    elif action == "discover-organization-accounts":
        organization_accounts = get_organization_accounts()
        current_accounts = config.get("accounts", {})
        current_account_ids = set(map(lambda entry: entry["id"], current_accounts))
        for organization_account in organization_accounts:
            # Don't overwrite any account already in the configuration file
            if organization_account['id'] not in current_account_ids:
                config["accounts"].append(organization_account)
            
    with open(arguments.config_file, "w+") as f:
        f.write(json.dumps(config, indent=4, sort_keys=True))


def run(arguments):
    if len(arguments) == 0:
        exit(
            "ERROR: Missing action for configure.\n"
            "Usage: [add-cidr|add-account|discover-organization-accounts|remove-cidr|remove-account]"
        )
        return
    action = arguments[0]
    arguments = arguments[1:]
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config-file", help="Path to the config file", default="config.json", type=str
    )
    if action == "add-account" or action == "remove-account":
        required = True if action.startswith("add") else False
        parser.add_argument("--name", help="Account name", required=required, type=str)
        parser.add_argument("--id", help="Account ID", required=required, type=str)
        parser.add_argument(
            "--default",
            help="Default account",
            required=False,
            default="False",
            type=str,
        )
    elif action == "add-cidr" or action == "remove-cidr":
        required = True if action.startswith("add") else False
        parser.add_argument("--cidr", help="CIDR IP", required=required, type=str)
        parser.add_argument("--name", help="CIDR Name", required=required, type=str)
    args = parser.parse_args(arguments)
    configure(action, args)
