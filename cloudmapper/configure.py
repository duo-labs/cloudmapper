import json
import netaddr
import six
import os.path


def configure(action, arguments):
    if not os.path.isfile(arguments.config_file):
        print("Config file does not exist, creating one")
        config = {  "accounts": [], "cidrs": {}}
    else:
        with open(arguments.config_file, 'r') as f:
            config = json.loads(f.read())
    if action == 'add-account':
        config['accounts'].append({
            "id": str(arguments.id),
            "name": str(arguments.name),
            "default": True if arguments.default.lower() == 'true' else False,
        })
    elif action == 'add-cidr':
        try:
            netaddr.IPNetwork(arguments.cidr)
        except netaddr.core.AddrFormatError:
            exit("ERROR: CIDR is not valid")
            return
        config['cidrs'][str(arguments.cidr)] = {
            "name": str(arguments.name),
        }
    elif action == 'remove-account':
        if arguments.name is None or arguments.id is None:
            condition = lambda x, y: x or y
        else:
            condition = lambda x, y: x and y
        for account in config['accounts']:
            if condition(account['id'] == arguments.id, account['name'] == arguments.name):
                config['accounts'].remove(account)
    elif action == 'remove-cidr':
        if arguments.name is None or arguments.cidr is None:
            condition = lambda x, y: x or y
        else:
            condition = lambda x, y: x and y
        
        # Force it to be a complete set so that deleting the key later on doesn't raise an error because the dictionary Size changed during iteration
        for cidr in set(config['cidrs'].keys()):
            name = config['cidrs'][cidr]['name']
            if condition(cidr == arguments.cidr, name == arguments.name):
                del config['cidrs'][cidr]
    
    with open(arguments.config_file, 'w+') as f:
        f.write(json.dumps(config, indent=4, sort_keys=True))
        