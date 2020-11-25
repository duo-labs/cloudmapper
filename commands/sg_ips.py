from collections import OrderedDict
from os import path
from netaddr import IPNetwork
import pyjq

from shared.common import parse_arguments, query_aws, get_regions, is_external_cidr, is_unblockable_cidr
from shared.nodes import Account, Region

# TODO: Considering removing this command. The warnings now live in the audit code.
# The creation of the map and table of locations is all this does now, which is both
# not very valuable, and is difficult to setup (requires matplotlib, basemap data, and geoip data)

__description__ = "[Deprecated] Find all IPs are that are given trusted access via Security Groups"


def get_cidrs_for_account(account, cidrs):
    account = Account(None, account)

    for region_json in get_regions(account):
        region = Region(account, region_json)
        sg_json = query_aws(account, "ec2-describe-security-groups", region)
        sgs = pyjq.all(".SecurityGroups[]", sg_json)
        for sg in sgs:
            cidr_and_name_list = pyjq.all(
                ".IpPermissions[].IpRanges[]|[.CidrIp,.Description]", sg
            )
            for cidr, name in cidr_and_name_list:
                if not is_external_cidr(cidr):
                    continue

                if is_unblockable_cidr(cidr):
                    print(
                        "WARNING: Unneeded cidr used {} in {}".format(
                            cidr, sg["GroupId"]
                        )
                    )
                    continue

                if cidr.startswith("0.0.0.0") and not cidr.endswith("/0"):
                    print(
                        "WARNING: Unexpected CIDR for attempted public access {} in {}".format(
                            cidr, sg["GroupId"]
                        )
                    )
                    continue

                if cidr == "0.0.0.0/0":
                    continue

                cidrs[cidr] = cidrs.get(cidr, set())
                if name is not None:
                    cidrs[cidr].add(name)

            for ip_permissions in sg["IpPermissions"]:
                cidrs_seen = set()
                for ip_ranges in ip_permissions["IpRanges"]:
                    if "CidrIp" not in ip_ranges:
                        continue
                    cidr = ip_ranges["CidrIp"]
                    for cidr_seen in cidrs_seen:
                        if IPNetwork(cidr_seen) in IPNetwork(cidr) or IPNetwork(
                            cidr
                        ) in IPNetwork(cidr_seen):
                            print(
                                "WARNING: Overlapping CIDRs in {}, {} and {}".format(
                                    sg["GroupId"], cidr, cidr_seen
                                )
                            )
                    cidrs_seen.add(cidr)


def sg_ips(accounts):
    """Collect trusted ips"""

    try:
        from mpl_toolkits.basemap import Basemap
    except:
        print(
            "ERROR: You must install basemap for mpl_toolkits. There is no pip for it."
        )
        print("See https://matplotlib.org/basemap/users/installing.html")
        print("\nSteps:")
        print("mkdir -p tmp; cd tmp")
        print(
            "curl https://codeload.github.com/matplotlib/basemap/tar.gz/v1.1.0 --output basemap-1.1.0.tar.gz"
        )
        print("tar -zxvf basemap-1.1.0.tar.gz")
        print("cd basemap-1.1.0/")
        print("python setup.py install")
        print("cd ..")
        print("rm -rf basemap-1.1.0*")
        print("cd ..")
        exit(-1)

    import geoip2.database
    import matplotlib as mpl

    mpl.use("TkAgg")
    import matplotlib.pyplot as plt

    # Used to sort by country
    cidr_dict = {}

    # Locations for graphing
    latlong = {"longitude": [], "latitude": []}

    try:
        asn_reader = geoip2.database.Reader("./data/GeoLite2-ASN.mmdb")
        city_reader = geoip2.database.Reader("./data/GeoLite2-City.mmdb")
    except:
        # geoip files do not exist.  Tell the user.
        print(
            "ERROR: You must download the geoip files GeoLite2-ASN.mmdb and GeoLite2-City.mmdb"
        )
        print(
            "from https://dev.maxmind.com/geoip/geoip2/geolite2/ and put them in ./data/"
        )
        print("\nSteps:")
        print("mkdir -p data; cd data")
        print("\n# Get city data")
        print(
            "curl http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz --output GeoLite2-City.tar.gz"
        )
        print("tar -zxvf GeoLite2-City.tar.gz")
        print("mv GeoLite2-City_*/GeoLite2-City.mmdb .")
        print("\n# Get ASN data")
        print(
            "curl http://geolite.maxmind.com/download/geoip/database/GeoLite2-ASN.tar.gz --output GeoLite2-ASN.tar.gz"
        )
        print("tar -zxvf GeoLite2-ASN.tar.gz")
        print("mv GeoLite2-ASN*/GeoLite2-ASN.mmdb .")
        print("\n# Clean up")
        print("rm -rf GeoLite2-City_*")
        print("rm -rf GeoLite2-ASN_*")
        print("rm -rf GeoLite2-*.tar.gz")
        print("cd ..")
        exit(-1)

    # Dictionary containing cidr as the key, and the security group descriptions
    # as set for the value
    cidrs = {}

    # Get the cidrs used by each account
    for account in accounts:
        get_cidrs_for_account(account, cidrs)

    # Get info about each cidr
    for cidr in cidrs:
        # Get description text from security groups
        description = ""
        if len(cidrs[cidr]) > 0:
            description = "|".join(cidrs[cidr])
        description = description.encode("ascii", "ignore").decode("ascii")

        ip = IPNetwork(cidr)
        if ip.size > 2048:
            print("WARNING: Large CIDR {} contains {} IPs in it".format(cidr, ip.size))

        # Look up the cidr in the databases
        try:
            location = city_reader.city(str(ip.ip))
            asn = asn_reader.asn(str(ip.ip))
            isp = asn.autonomous_system_organization
            # Convert to ascii
            isp = isp.encode("ascii", "ignore").decode("ascii")
        except geoip2.errors.AddressNotFoundError:
            print("WARNING: Unknown CIDR {}".format(cidr))
            continue

        # Collect the longitude and latitude locations for graphing
        latlong["longitude"].append(location.location.longitude)
        latlong["latitude"].append(location.location.latitude)

        # Format the place name
        location_name_parts = []
        city = location.city.name
        state = location.subdivisions.most_specific.name
        country = location.country.name

        # Reduce amount of text
        if country == "United States":
            country = "US"
        elif country == "United Kingdom":
            country = "UK"

        if isp == "MCI Communications Services d/b/a Verizon Business":
            isp = "MCI"
        isp = isp.replace(", Inc.", "")
        isp = isp.replace(" Ltd. ", "")
        isp = isp.replace("Group PLC", "")
        isp = isp.replace("Akamai International B.V. ", "Akamai")

        if city is not None:
            city = city.encode("ascii", "ignore").decode("ascii")
            location_name_parts.append(city)

        if state is not None:
            state = state.encode("ascii", "ignore").decode("ascii")
            location_name_parts.append(state)

        if country is not None:
            country = country.encode("ascii", "ignore").decode("ascii")
            location_name_parts.append(country)

        location_name = ", ".join(location_name_parts)
        if location_name == "":
            location_name = "Unknown"
        location_name = location_name.encode("ascii", "ignore").decode("ascii")

        # Collect information about the cidrs in a way that can be sorted
        cidr_dict["{}-{}-{}-{}".format(country, state, city, cidr)] = {
            "cidr": cidr,
            "description": description,
            "location": location_name,
            "isp": isp,
        }

    # Sort the cidrs
    sorted_cidrs = OrderedDict(sorted(cidr_dict.items()))

    # Print them in sorted order
    for _, cidr in sorted_cidrs.items():
        print(
            "{}\t {}\t {}\t {}".format(
                cidr["cidr"].ljust(18),
                cidr["description"].ljust(20),
                cidr["location"].ljust(50),
                cidr["isp"],
            )
        )

    # Save image
    fig, ax = plt.subplots()
    earth = Basemap(ax=ax)
    earth.drawcoastlines(color="#778877", linewidth=0.5)
    ax.scatter(
        latlong["longitude"],
        latlong["latitude"],
        15,  # size
        c="red",
        alpha=1,
        zorder=10,
    )
    ax.set_xlabel("Trusted IP locations")
    fig.set_size_inches(8, 6)
    fig.savefig("trusted_ips.png", pad_inches=0, bbox_inches="tight")
    print(
        "Image saved to {}".format(
            path.join(path.dirname(path.realpath("__file__")), "trusted_ips.png")
        )
    )


def run(arguments):
    _, accounts, _ = parse_arguments(arguments)
    sg_ips(accounts)
