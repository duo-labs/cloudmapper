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
    session.run("MATCH (n) DETACH DELETE n")
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

            # sync instances
            describe_instances = query_aws(account, "ec2-describe-instances", region)
            for reservation_data in describe_instances['Reservations']:
                for instance_data in reservation_data['Instances']:
                    instance_id = instance_data['InstanceId']
                    instance_vpc_id = instance_data['VpcId']
                    session.run("""
                        MERGE (v:VPC { id: $instance_vpc_id })
                        MERGE (i:Instance { id: $instance_id })
                        MERGE (v)-[:instance]->(i)
                    """,
                        instance_id=instance_id,
                        instance_vpc_id=instance_vpc_id,
                    )

                    for security_group_data in instance_data['SecurityGroups']:
                        group_name = security_group_data['GroupName']
                        security_group_id = security_group_data['GroupId']
                        session.run("""
                            MERGE (v:VPC { id: $instance_vpc_id })
                            MERGE (v)-[:security_group]->(s:SecurityGroup { id: $security_group_id })
                            MERGE (v)-[:instance]->(i:Instance { id: $instance_id })
                            MERGE (i)-[:security_group]->(s)
                        """,
                            instance_id=instance_id,
                            security_group_id=security_group_id,
                            instance_vpc_id=instance_vpc_id,
                        )

            describe_db_instances = query_aws(account, "rds-describe-db-instances", region)
            for db_instance_data in describe_db_instances['DBInstances']:
                db_arn = db_instance_data['DBInstanceArn']
                db_vpc_security_groups = db_instance_data['VpcSecurityGroups']

                session.run("""
                    MERGE (v:VPC { id: $instance_vpc_id })
                    MERGE (db:DB { arn: $db_arn } )
                    MERGE (v)-[:db_instance]->(db)
                    FOREACH (vs IN $db_vpc_security_groups |
                        MERGE (v)-[:security_group]->(s:SecurityGroup { id: vs.VpcSecurityGroupId })
                        MERGE (db)-[:security_group]->(s)
                    )
                """,
                    db_arn=db_arn,
                    instance_vpc_id=instance_vpc_id,
                    db_vpc_security_groups=db_vpc_security_groups,
                )

    session.close()
