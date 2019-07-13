from __future__ import print_function
import sys
import argparse
from shared.common import parse_arguments, get_account_stats

__description__ = "Print counts of resources for accounts"


def output_image(accounts, account_stats, resource_names, output_image_file):
    # Display graph
    import matplotlib

    matplotlib.use("Agg")
    import pandas as pd
    import seaborn as sns
    import matplotlib.pyplot as plt
    from pandas.plotting import table

    # Reverse order of accounts so they appear in the graph correctly
    accounts = list(reversed(accounts))

    account_names = ["Resource"]
    for account in accounts:
        account_names.append(account["name"])

    data = []
    for resource_name in resource_names:
        resource_array = [resource_name]
        for account in accounts:
            count = sum(account_stats[account["name"]][resource_name].values())
            resource_array.append(count)
        data.append(resource_array)

    df = pd.DataFrame(columns=account_names, data=data)

    sns.set()
    plot = df.set_index("Resource").T.plot(
        kind="barh", stacked=True, fontsize=10, figsize=[8, 0.3 * len(accounts)]
    )
    plt.legend(loc="center left", bbox_to_anchor=(1.0, 0.5))
    fig = plot.get_figure()
    # TODO: Set color cycle as explained here https://stackoverflow.com/questions/8389636/creating-over-20-unique-legend-colors-using-matplotlib
    # This is needed because there are 17 resources graphed, but only 10 colors in the cycle.
    # So if you have only S3 buckets and CloudFront, you end up with two blue bands
    # next to each other.

    fig.savefig(output_image_file, format="png", bbox_inches="tight", dpi=200)
    print("Image saved to {}".format(output_image_file), file=sys.stderr)


def stats(accounts, config, args):
    """Collect stats"""

    # Collect counts
    account_stats = {}
    for account in accounts:
        account_stats[account["name"]] = get_account_stats(
            account, args.stats_all_resources
        )
        resource_names = account_stats[account["name"]]["keys"]

    # Print header
    print("\t".rjust(20) + "\t".join(a["name"] for a in accounts))

    for resource_name in resource_names:
        output_line = resource_name.ljust(20)
        for account in accounts:
            count = sum(account_stats[account["name"]][resource_name].values())
            output_line += ("\t" + str(count)).ljust(8)
        print(output_line)

    if not args.no_output_image:
        output_image(accounts, account_stats, resource_names, args.output_image)


def run(arguments):
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--output_image",
        help="Name of output image",
        default="resource_stats.png",
        type=str,
    )
    parser.add_argument(
        "--no_output_image",
        help="Don't create output image",
        default=False,
        action="store_true",
    )
    parser.add_argument(
        "--stats_all_resources",
        help="Show stats for all resource types",
        action="store_true",
        default=False,
        dest="stats_all_resources",
    )

    args, accounts, config = parse_arguments(arguments, parser)

    stats(accounts, config, args)
