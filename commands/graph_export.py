import argparse
from urllib.parse import urlparse

from shared.common import parse_arguments, query_aws
from shared.nodes import Account, Region

from neo4j.v1 import GraphDatabase

__description__ = "Export data to neo4j"


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument("--graph-url", required=True)
    parser.add_argument("--region", required=True)
    args, accounts, config = parse_arguments(arguments, parser)

    graph_url = args.graph_url
    region_name = args.region

    parsed_url = urlparse(args.graph_url)
    graph_username = parsed_url.username
    graph_password = parsed_url.password
    driver = GraphDatabase.driver(graph_url, auth=(graph_username, graph_password))

    for account in accounts:
        account = Account(None, account)
        region = Region(account, {'RegionName': region_name})

        describe_vpcs = query_aws(account, "ec2-describe-vpcs", region)
        describe_instances = query_aws(account, "ec2-describe-instances", region)

        with driver.session() as session:
            with session.begin_transaction() as tx:
                tx.run(""" MATCH (n) DETACH DELETE n """)

        with driver.session() as session:
            with session.begin_transaction() as tx:
                # sync account
                tx.run("""
                    MERGE (a:Account { arn: $account_arn })
                """, account_arn=account.arn)

        with driver.session() as session:
            with session.begin_transaction() as tx:
                # sync region
                tx.run("""
                    MERGE (a:Account { arn: $account_arn })
                    MERGE (r:Region { name: $region_name })
                    MERGE (a)-[:region]->(r)
                """, account_arn=account.arn, region_name=region_name)

                # sync vpcs
                for vpc_data in describe_vpcs['Vpcs']:
                    vpc_id = vpc_data['VpcId']
                    tx.run("""
                        MERGE (r:Region { name: $region_name })
                        MERGE (v:VPC { id: $vpc_id })
                        MERGE (r)-[:vpc]->(v)
                    """, region_name=region_name, vpc_id=vpc_id)

                # sync instances
                for reservation_data in describe_instances['Reservations']:
                    for instance_data in reservation_data['Instances']:
                        instance_id = instance_data['InstanceId']
                        instance_vpc_id = instance_data['VpcId']

                        tx.run("""
                            MERGE (v:VPC { id: $instance_vpc_id })
                            MERGE (i:Instance { id: $instance_id })
                            MERGE (v)-[:instance]->(i)
                        """,
                            instance_id=instance_id,
                            instance_vpc_id=instance_vpc_id,
                        )
