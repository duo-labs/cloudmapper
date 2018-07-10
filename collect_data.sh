#!/bin/bash
set -euo pipefail

AWS_OPTS="--output json"
account=""
profile=""
ERROR=""

function usage {
  if [[ ! -z $ERROR ]]
  then
    echo "ERROR: $ERROR"
  fi
  echo "Usage:"
  echo "  $0 --account my_account [--profile aws_profile]"
  exit -1
}

echo "* Startup checks"

while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
    --account)
      account="$2"
      shift
      shift
      ;;
    --profile)
      profile="$2"
      shift
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      usage
      ;;
  esac
done

if [[ -z "$account" ]]
then
  ERROR="No account Name Specified"
  usage
fi

if [[ ! -z "$profile" ]]
then
  AWS_OPTS="$AWS_OPTS --profile $profile"
fi

# Ensure the aws cli exists
aws --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Install the aws cli"
  exit -1
fi

# Ensure we have AWS credentials
aws $AWS_OPTS sts get-caller-identity > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: No AWS credentials set"
  exit -1
fi

# Ensure jq exists
jq --help > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: jq not found"
  exit -1
fi

mkdir -p "account-data/$account"
cd account-data/$account

echo "* Getting region names"
aws $AWS_OPTS ec2 describe-regions > describe-regions.json
# Create directory for each region name
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'mkdir -p $1' -- {}

echo "* Getting VPC info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-vpcs > "$1/ec2-describe-vpcs.json"' -- {}

echo "* Getting AZ info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-availability-zones > "$1/ec2-describe-availability-zones.json"' -- {}

echo "* Getting subnet info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-subnets > "$1/ec2-describe-subnets.json"' -- {}

echo "* Getting EC2 info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-instances > "$1/ec2-describe-instances.json"' -- {}

echo "* Getting RDS info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' rds --region "$1" describe-db-instances > "$1/rds-describe-db-instances.json"' -- {}

echo "* Getting ELB info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' elb --region "$1" describe-load-balancers > "$1/elb-describe-load-balancers.json"' -- {}

echo "* Getting ALB info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' elbv2 --region "$1" describe-load-balancers > "$1/elbv2-describe-load-balancers.json"' -- {}

echo "* Getting security group info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-security-groups > "$1/ec2-describe-security-groups.json"' -- {}

echo "* Getting network interface info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-network-interfaces > "$1/ec2-describe-network-interfaces.json"' -- {}

echo "* Getting VPC peering info"
cat describe-regions.json | jq -r '.Regions[].RegionName' | xargs -I{} sh -c 'aws '"$AWS_OPTS"' ec2 --region "$1" describe-vpc-peering-connections > "$1/ec2-describe-vpc-peering-connections.json"' -- {}
