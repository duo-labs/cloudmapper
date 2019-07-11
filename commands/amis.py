from __future__ import print_function
import sys
import json
import argparse
import pyjq
import os.path
from shared.nodes import Account, Region
from shared.common import parse_arguments, query_aws
from os import listdir

__description__ = "Cross-reference EC2 instances with AMI information"


def log_warning(msg):
    print("WARNING: {}".format(msg), file=sys.stderr)


def find_image(image_id, public_images, account_images):
    for image in public_images:
        if image_id == image["ImageId"]:
            return image, "public"
    for image in account_images:
        if image_id == image["ImageId"]:
            return image, "private"

    return None, "unknown_image"


def get_instance_name(instance):
    if "Tags" in instance:
        for tag in instance["Tags"]:
            if tag["Key"] == "Name":
                return tag["Value"]
    return None


def amis(args, accounts, config):
    # Loading the list of public images from disk takes a while, so we'll iterate by region

    regions_file = "data/aws/us-east-1/ec2-describe-images.json"
    if not os.path.isfile(regions_file):
        raise Exception(
            "You need to download the set of public AMI images.  Run:\n"
            "  mkdir -p data/aws\n"
            "  cd data/aws\n"
            "  aws ec2 describe-regions | jq -r '.Regions[].RegionName' | xargs -I{} mkdir {}\n"
            "  aws ec2 describe-regions | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws --region {} ec2 describe-images --executable-users all > {}/ec2-describe-images.json'\n"
        )

    print(
        "{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}".format(
            "Account Name",
            "Region Name",
            "Instance Id",
            "Instance Name",
            "AMI ID",
            "Is Public",
            "AMI Description",
            "AMI Owner",
        )
    )

    for region in listdir("data/aws/"):
        # Get public images
        public_images_file = "data/aws/{}/ec2-describe-images.json".format(region)
        public_images = json.load(open(public_images_file))
        resource_filter = ".Images[]"
        public_images = pyjq.all(resource_filter, public_images)

        for account in accounts:
            account = Account(None, account)
            region = Region(account, {"RegionName": region})

            instances = query_aws(account, "ec2-describe-instances", region)
            resource_filter = (
                '.Reservations[].Instances[] | select(.State.Name == "running")'
            )
            if args.instance_filter != "":
                resource_filter += "|{}".format(args.instance_filter)
            instances = pyjq.all(resource_filter, instances)

            account_images = query_aws(account, "ec2-describe-images", region)
            resource_filter = ".Images[]"
            account_images = pyjq.all(resource_filter, account_images)

            for instance in instances:
                image_id = instance["ImageId"]
                image_description = ""
                owner = ""
                image, is_public_image = find_image(
                    image_id, public_images, account_images
                )
                if image:
                    # Many images don't have all fields, so try the Name, then Description, then ImageLocation
                    image_description = image.get("Name", "")
                    if image_description == "":
                        image_description = image.get("Description", "")
                        if image_description == "":
                            image_description = image.get("ImageLocation", "")
                    owner = image.get("OwnerId", "")

                print(
                    "{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}".format(
                        account.name,
                        region.name,
                        instance["InstanceId"],
                        get_instance_name(instance),
                        image_id,
                        is_public_image,
                        image_description,
                        owner,
                    )
                )


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--instance_filter",
        help='Filter on the EC2 info, for example `select(.Platform == "windows")` or `select(.Architecture!="x86_64")`',
        default="",
    )
    args, accounts, config = parse_arguments(arguments, parser)
    amis(args, accounts, config)
