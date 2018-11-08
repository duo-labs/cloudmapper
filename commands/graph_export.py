import argparse
from urllib.parse import urlparse

from shared.common import parse_arguments, query_aws
from shared.nodes import Account, Region

from neo4j.v1 import GraphDatabase

__description__ = "Export data to neo4j"


def run(arguments):
    parser = argparse.ArgumentParser()
    parser.add_argument("--graph-url", required=True)
    args, accounts, config = parse_arguments(arguments, parser)

    graph_url = args.graph_url

    parsed_url = urlparse(args.graph_url)
    graph_username = parsed_url.username
    graph_password = parsed_url.password
    driver = GraphDatabase.driver(graph_url, auth=(graph_username, graph_password))
    session = driver.session()
    # session.run("MATCH (n) DETACH DELETE n")
    session.run("CREATE CONSTRAINT ON (a:Account) ASSERT a.arn IS UNIQUE")
    session.run("CREATE CONSTRAINT ON (r:Region) ASSERT r.arn IS UNIQUE")
    session.run("CREATE CONSTRAINT ON (v:VPC) ASSERT v.id IS UNIQUE")
    session.run("CREATE CONSTRAINT ON (i:Instance) ASSERT i.id IS UNIQUE")

    accounts = [Account(None, a) for a in accounts]
    for account in accounts:
        # sync account
        session.run("MERGE (a:Account { arn: $account_arn })",
            account_arn=account.arn)

        describe_regions = query_aws(account, "describe-regions")
        regions = [Region(account, r) for r in describe_regions['Regions']]
        for region_data in describe_regions['Regions']:
            # sync region
            region = Region(account, region_data)
            session.run("MERGE (r:Region { name: $region_arn})",
                region_arn=region.arn)

            # sync vpcs
            describe_vpcs = query_aws(account, "ec2-describe-vpcs", region)
            for vpc_data in describe_vpcs['Vpcs']:
                vpc_id = vpc_data['VpcId']
                session.run("""
                    MERGE (a:Account { arn: $account_arn })
                    MERGE (r:Region { name: $region_arn })
                    MERGE (v:VPC { id: $vpc_id })
                    MERGE (a)-[:vpc]->(v)
                    MERGE (r)-[:vpc]->(v)
                """, account_arn=account.arn, region_arn=region.arn, vpc_id=vpc_id)

            # sync security groups
            describe_sgs = query_aws(account, "ec2-describe-security-groups", region)
            for sg_data in describe_sgs['SecurityGroups']:
                session.run("""
                    MERGE (v:VPC { id: $VpcId })
                    MERGE (sg:SecurityGroup { id: $GroupId })
                    MERGE (v)-[:security_group]->(sg)
                """, **sg_data)

            # sync instances
            describe_instances = query_aws(account, "ec2-describe-instances", region)
            for reservation_data in describe_instances['Reservations']:
                for instance_data in reservation_data['Instances']:
                    session.run("""
                        MERGE (v:VPC { id: $VpcId })
                        MERGE (i:Instance { id: $InstanceId })
                        MERGE (v)-[:instance]->(i)
                    """, **instance_data)

                    for sg_data in instance_data['SecurityGroups']:
                        session.run("""
                            MERGE (v:VPC { id: $VpcId })
                            MERGE (v)-[:security_group]->(s:SecurityGroup { id: $GroupId })
                            MERGE (v)-[:instance]->(i:Instance { id: $InstanceId })
                            MERGE (i)-[:security_group]->(s)
                        """, { **instance_data, **sg_data })

            describe_db_instances = query_aws(account, "rds-describe-db-instances", region)
            for db_instance_data in describe_db_instances['DBInstances']:
                session.run("""
                    MERGE (a:Account { arn: $account_arn })
                    MERGE (db:DB { arn: $DBInstanceArn } )
                    MERGE (a)-[:db_instance]->(db)
                    FOREACH (vs IN $VpcSecurityGroups |
                        MERGE (v)-[:security_group]->(s:SecurityGroup { id: vs.VpcSecurityGroupId })
                        MERGE (db)-[:security_group]->(s)
                    )
                """, { **db_instance_data, 'account_arn': account.arn })

    session.close()
