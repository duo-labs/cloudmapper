import json
import netaddr
import six


def configure():

    print("Welcome\n")
    config = {
        "accounts": [],
        "cidrs": {}
    }
    
    def menu():
        print("Please choose what you want to add to the config:")
        print("    1. Add account")
        print("    2. Add known CIDR IP")
        print("    0. Save & Quit")
        choice = int(six.moves.input(">> "))
        execute(choice)
        return

    def execute(choice):
        if choice == 1:
            print("What is the account ID ?")
            account_id = int(six.moves.input(">> "))
            print("What is the account name ?")
            account_name = str(six.moves.input(">> "))
            print("Is this your default account ? [Y/n]")
            default_input = str(six.moves.input(">> "))
            default = True if default_input == "Y" or default_input == "" else False

            config["accounts"].append({
                "id": str(account_id),
                "name": account_name,
                "default": default
            })
        elif choice == 2:
            print("What is the CIDR IP ?")
            cidr = str(six.moves.input(">> "))
            # Check if cidr is valid
            try:
                netaddr.IPNetwork(cidr)
            except netaddr.core.AddrFormatError:
                print("\nCIDR is not valid\n")
                menu()
                return
            print("What is the name you want to assign to this CIDR IP ?")
            name = str(six.moves.input(">> "))
            config["cidrs"][cidr] = {"name": name}
        elif choice == 0:
            with open("./config.json", 'w+') as f:
                f.write(json.dumps(config, indent=4, sort_keys=True))
            return
        menu()

    menu()
    return
