"""
Copyright 2018 Duo Security

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE
USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
---------------------------------------------------------------------------
"""
import pyjq
from abc import ABCMeta
from netaddr import IPNetwork, IPAddress
from six import add_metaclass
from shared.query import query_aws, get_parameter_file


def truncate(string):
    return (string[:39] + "..") if len(string) > 40 else string


def get_name(node, default):
    try:
        for tag in node["Tags"]:
            if tag["Key"] == "Name":
                return truncate(tag["Value"])
    except Exception:
        # If the keys in tag don't exist, just return the default
        pass
    return node[default]


def is_public_ip(ip):
    ip = IPAddress(ip)
    if (
        ip in IPNetwork("10.0.0.0/8")
        or ip in IPNetwork("172.16.0.0/12")
        or ip in IPNetwork("192.168.0.0/16")
    ):
        return False
    return True


@add_metaclass(ABCMeta)
class Node(object):
    _arn = ""
    _local_id = ""  # Ex. InstanceId
    _name = ""
    _type = ""

    _parent = None
    _json_blob = ""

    _isLeaf = False

    _children = None

    def __key(self):
        return self._arn

    def __init__(self, parent, json_blob):
        self._parent = parent
        self._json_blob = json_blob
        self._children = {}

    def set_subnet(self, subnet):
        self._subnet = subnet

    @property
    def arn(self):
        return self._arn

    @property
    def local_id(self):
        return self._local_id

    @property
    def name(self):
        return self._name

    @property
    def can_egress(self):
        return True

    @property
    def has_unrestricted_ingress(self):
        return False

    @property
    def node_type(self):
        return self._type

    @property
    def isLeaf(self):
        return self._isLeaf

    @property
    def tags(self):
        raise NotImplementedError(
            "tags not implemented for type {}".format(self.node_type)
        )

    @property
    def subnets(self):
        raise NotImplementedError(
            "subnets not implemented for type {}".format(self.node_type)
        )

    @property
    def account(self):
        if self._type == "account":
            return self
        else:
            return self.parent.account

    @property
    def region(self):
        if self._type == "region":
            return self
        else:
            return self.parent.region

    @property
    def vpc(self):
        if self._type == "vpc":
            return self
        else:
            return self.parent.vpc

    @property
    def az(self):
        if self._type == "az":
            return self
        else:
            return self.parent.az

    @property
    def subnet(self):
        if self._type == "subnet":
            return self
        else:
            return self.parent.subnet

    @property
    def parent(self):
        return self._parent

    @property
    def json(self):
        return self._json_blob

    def addChild(self, child):
        self._children[child.local_id] = child

    @property
    def children(self):
        return self._children.values()

    def removeChild(self, child):
        del self._children[child.local_id]

    @property
    def has_leaves(self):
        # TODO: This can be optimized
        if self.isLeaf:
            return True
        else:
            for child in self.children:
                if child.has_leaves:
                    return True
            return False

    @property
    def leaves(self):
        if self.isLeaf:
            return [self]
        else:
            leaves = []
            for child in self.children:
                leaves.extend(child.leaves)
            return leaves

    def cytoscape_data(self, parent_arn=""):
        response = {
            "data": {
                "id": self.arn,
                "name": self.name,
                "type": self.node_type,
                "local_id": self.local_id,
                "node_data": self.json,
            }
        }

        if parent_arn != "":
            response["data"]["parent"] = parent_arn
        elif self.parent:
            response["data"]["parent"] = self.parent.arn

        return response


class Account(Node):
    def __init__(self, parent, json_blob):
        self._local_id = json_blob["id"]
        self._arn = "arn:aws:::{}:".format(self._local_id)
        self._name = json_blob["name"]
        self._type = "account"
        super(Account, self).__init__(parent, json_blob)


class Region(Node):
    def __init__(self, parent, json_blob):
        self._local_id = json_blob["RegionName"]
        self._arn = "arn:aws::{}:{}:".format(self.local_id, parent.account.local_id)
        self._name = json_blob["RegionName"]
        self._type = "region"
        super(Region, self).__init__(parent, json_blob)


class Vpc(Node):
    _peering_connections = None

    def addPeer(self, vpc):
        self._peering_connections.append(vpc)

    @property
    def peers(self):
        return self._peering_connections

    @property
    def cidr(self):
        return self._json_blob["CidrBlock"]

    def __init__(self, parent, json_blob):
        # arn:aws:ec2:region:account-id:vpc/vpc-id
        self._local_id = json_blob["VpcId"]
        self._arn = "arn:aws::{}:{}:vpc/{}".format(
            parent.region.name, parent.account.local_id, self._local_id
        )
        self._name = get_name(json_blob, "VpcId") + " (" + json_blob["CidrBlock"] + ")"
        self._type = "vpc"

        self._peering_connections = []

        super(Vpc, self).__init__(parent, json_blob)


class Az(Node):
    def __init__(self, parent, json_blob):
        self._local_id = json_blob["ZoneName"]
        self._arn = "arn:aws::{}:{}:vpc/{}/az/{}".format(
            parent.region.local_id,
            parent.account.local_id,
            parent.local_id,
            self._local_id,
        )
        self._name = json_blob["ZoneName"]
        self._type = "az"
        super(Az, self).__init__(parent, json_blob)


class Subnet(Node):
    def __init__(self, parent, json_blob):
        # arn:aws:ec2:region:account-id:subnet/subnet-id
        self._local_id = json_blob["SubnetId"]
        self._arn = "arn:aws::{}:{}:subnet/{}".format(
            parent.region.name, parent.account.local_id, self._local_id
        )
        self._name = (
            get_name(json_blob, "SubnetId") + " (" + json_blob["CidrBlock"] + ")"
        )
        self._type = "subnet"
        super(Subnet, self).__init__(parent, json_blob)


@add_metaclass(ABCMeta)
class Leaf(Node):
    def __init__(self, parent, json_blob):
        self._isLeaf = True
        super(Leaf, self).__init__(parent, json_blob)


class Ec2(Leaf):
    _ips = None

    @property
    def is_public(self):
        for ip in self.ips:
            if is_public_ip(ip):
                return True
        return False

    @property
    def ips(self):
        if self._ips is None:
            # Autoscaling groups are going to make this get a lot of IPs, but since we're only graphing
            # connections, we'll assume that each autoscaling instance would have the same connections
            # as others
            self._ips = []
            private_ips = pyjq.all(
                ".NetworkInterfaces[].PrivateIpAddresses[].PrivateIpAddress",
                self._json_blob,
            )
            self._ips.extend([x for x in private_ips if x is not None])
            public_ips = pyjq.all(
                ".NetworkInterfaces[].PrivateIpAddresses[].Association.PublicIp",
                self._json_blob,
            )
            self._ips.extend([x for x in public_ips if x is not None])
        return self._ips

    @property
    def tags(self):
        return pyjq.all(".Tags[]", self._json_blob)

    @property
    def subnets(self):
        return pyjq.all(".NetworkInterfaces[].SubnetId", self._json_blob)

    @property
    def security_groups(self):
        return pyjq.all(".SecurityGroups[].GroupId", self._json_blob)

    def __init__(self, parent, json_blob, collapse_by_tag=None, collapse_asgs=True):
        autoscaling_name = []
        if collapse_asgs:
            autoscaling_name = pyjq.all(
                '.Tags[]? | select(.Key == "aws:autoscaling:groupName") | .Value',
                json_blob,
            )

        collapse_by_tag_value = []
        if collapse_by_tag:
            collapse_by_tag_value = pyjq.all(
                '.Tags[]? | select(.Key == "{}") | .Value'.format(collapse_by_tag),
                json_blob,
            )

        if autoscaling_name != []:
            self._type = "autoscaling"
            self._local_id = autoscaling_name[0]
        elif collapse_by_tag_value != []:
            self._type = "grouped_ec2"
            self._local_id = "grouped_ec2_{}".format(collapse_by_tag_value[0])
        else:
            self._type = "ec2"
            self._local_id = json_blob["InstanceId"]

        self._arn = "arn:aws:ec2:{}:{}:instance/{}".format(
            parent.region.name, parent.account.local_id, self._local_id
        )
        self._name = get_name(json_blob, "InstanceId")
        super(Ec2, self).__init__(parent, json_blob)


class Elb(Leaf):
    _subnet = None

    @property
    def ips(self):
        # ELB's don't have IPs
        return []

    @property
    def tags(self):
        tags = get_parameter_file(
            self.region, "elb", "describe-tags", self._json_blob["LoadBalancerName"]
        )
        if tags is None:
            return []
        descriptions = tags["TagDescriptions"]
        if descriptions is None or len(descriptions) == 0:
            return []
        return descriptions[0]["Tags"]

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            return pyjq.all(".Subnets[]", self._json_blob)

    @property
    def is_public(self):
        scheme = pyjq.all(".Scheme", self._json_blob)[0]
        if scheme == "internet-facing":
            return True
        return False

    @property
    def security_groups(self):
        return pyjq.all(".SecurityGroups[]?", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "elb"
        self._local_id = json_blob["LoadBalancerName"]
        self._arn = "arn:aws:elasticloadbalancing:{}:{}:instance/{}/{}".format(
            parent.region.name, parent.account.local_id, self._local_id, parent.local_id
        )

        self._name = json_blob["LoadBalancerName"]
        super(Elb, self).__init__(parent, json_blob)


class Elbv2(Leaf):
    _subnet = None

    @property
    def ips(self):
        # ELB's don't have IPs
        return []

    @property
    def tags(self):
        tags = get_parameter_file(
            self.region, "elbv2", "describe-tags", self._json_blob["LoadBalancerName"]
        )
        if tags is None:
            return []
        descriptions = tags["TagDescriptions"]
        if descriptions is None or len(descriptions) == 0:
            return []
        return descriptions[0]["Tags"]

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            return pyjq.all(".AvailabilityZones[].SubnetId", self._json_blob)

    @property
    def is_public(self):
        scheme = pyjq.all(".Scheme", self._json_blob)[0]
        if scheme == "internet-facing":
            return True
        return False

    @property
    def security_groups(self):
        return pyjq.all(".SecurityGroups[]?", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "elbv2"
        self._local_id = json_blob["LoadBalancerName"]
        self._arn = "arn:aws:elasticloadbalancingv2:{}:{}:instance/{}/{}".format(
            parent.region.name, parent.account.local_id, self._local_id, parent.local_id
        )

        self._name = json_blob["LoadBalancerName"]
        super(Elbv2, self).__init__(parent, json_blob)


class Rds(Leaf):
    _subnet = None

    @property
    def ips(self):
        # RDS instances don't have IPs
        return []

    @property
    def can_egress(self):
        return False

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            return pyjq.all(
                ".DBSubnetGroup.Subnets[].SubnetIdentifier", self._json_blob
            )

    @property
    def tags(self):
        tags = get_parameter_file(
            self.region,
            "rds",
            "list-tags-for-resource",
            self._json_blob["DBInstanceArn"],
        )
        if tags is None:
            return []
        return tags["TagList"]

    @property
    def is_public(self):
        return pyjq.all(".PubliclyAccessible", self._json_blob)[0]

    @property
    def security_groups(self):
        return pyjq.all(".VpcSecurityGroups[].VpcSecurityGroupId", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "rds"

        # Check if this is a read-replicable
        if pyjq.all(".ReadReplicaSourceDBInstanceIdentifier", json_blob) != [None]:
            self._type = "rds_rr"

        self._local_id = json_blob["DBInstanceIdentifier"]
        self._arn = json_blob["DBInstanceArn"]
        self._name = truncate(json_blob["DBInstanceIdentifier"])
        super(Rds, self).__init__(parent, json_blob)


class VpcEndpoint(Leaf):
    _subnet = None

    _unrestricted_ingress = False

    @property
    def can_egress(self):
        return False

    @property
    def has_unrestricted_ingress(self):
        return self._unrestricted_ingress

    @property
    def ips(self):
        return []

    @property
    def tags(self):
        return []

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            # TODO Has SubnetIds not Subnet names
            # And in the case of Gateway endpoints, it has only a VPC
            return pyjq.all(".SubnetIds[]", self._json_blob)

    @property
    def is_public(self):
        return False

    @property
    def security_groups(self):
        return pyjq.all(".Groups[].GroupId", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "vpc_endpoint"
        self._local_id = json_blob["VpcEndpointId"]
        self._arn = "arn:aws:endpoint:{}:{}:instance/{}".format(
            parent.region.name, parent.account.local_id, self._local_id
        )

        # Need to set the parent, but what was passed in was the region
        assert parent._type == "region"
        for vpc in parent.children:
            if vpc.local_id == json_blob["VpcId"]:
                self._parent = vpc

        # The ServiceName looks like com.amazonaws.us-east-1.sqs
        # So I want the last section, "sqs"
        self._name = json_blob["ServiceName"][json_blob["ServiceName"].rfind(".") + 1 :]

        if json_blob["VpcEndpointType"] == "Gateway":
            # The Gateway Endpoints don't live in subnets and don't have Security Groups.
            # Access is controlled through their policy, or the S3 bucket policies, or somewhere else.
            self._unrestricted_ingress = True

        services_with_icons = [
            "s3",
            "dynamodb",
            "kinesis",
            "sqs",
            "sns",
            "codebuild",
            "codecommit",
            "codepipeline",
            "ecs",
            "ecr",
            "ssm",
            "secretsmanager",
            "kms",
            "apigateway",
        ]
        if self._name in services_with_icons:
            self._type = self._name

        super(VpcEndpoint, self).__init__(self._parent, json_blob)


class Ecs(Leaf):
    @property
    def ips(self):
        ips = []
        for detail in pyjq.all(".attachments[].details[]", self._json_blob):
            if detail["name"] == "networkInterfaceId":
                eni = detail["value"]
                interfaces_json = query_aws(
                    self.account, "ec2-describe-network-interfaces", self.region
                )
                for interface in interfaces_json["NetworkInterfaces"]:
                    if interface["NetworkInterfaceId"] == eni:

                        # Get the public IP, if it exists
                        public_ip = interface.get("Association", {}).get("PublicIp", "")
                        if public_ip != "":
                            ips.append(public_ip)

                        # Get the private IP
                        ips.append(interface["PrivateIpAddress"])
        return ips

    @property
    def subnets(self):
        for detail in pyjq.all(".attachments[].details[]", self._json_blob):
            if detail["name"] == "subnetId":
                return [detail["value"]]
        return []

    @property
    def tags(self):
        return pyjq.all(".tags[]", self._json_blob)

    @property
    def is_public(self):
        for ip in self.ips:
            if is_public_ip(ip):
                return True
        return False

    @property
    def security_groups(self):
        sgs = []
        for detail in pyjq.all(".attachments[].details[]", self._json_blob):
            if detail["name"] == "networkInterfaceId":
                eni = detail["value"]
                interfaces_json = query_aws(
                    self.account, "ec2-describe-network-interfaces", self.region
                )
                for interface in interfaces_json["NetworkInterfaces"]:
                    if interface["NetworkInterfaceId"] == eni:
                        for group in interface["Groups"]:
                            sgs.append(group["GroupId"])
        return sgs

    def __init__(self, parent, json_blob):
        self._type = "ecs"

        self._local_id = json_blob["taskArn"]
        self._arn = json_blob["taskArn"]
        self._name = truncate(
            json_blob["taskDefinitionArn"].split("task-definition/")[1]
        )
        super(Ecs, self).__init__(parent, json_blob)
        self.json["ips"] = self.ips


class Lambda(Leaf):
    _subnet = None

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def ips(self):
        return []

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            return pyjq.all(".VpcConfig.SubnetIds[]", self._json_blob)

    @property
    def tags(self):
        return pyjq.all(".tags[]?", self._json_blob)

    @property
    def is_public(self):
        return False

    @property
    def security_groups(self):
        return pyjq.all(".VpcConfig.SecurityGroupIds[]", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "lambda"

        self._local_id = json_blob["FunctionArn"]
        self._arn = json_blob["FunctionArn"]
        self._name = truncate(json_blob["FunctionName"])
        super(Lambda, self).__init__(parent, json_blob)


class Redshift(Leaf):
    _subnet = None

    def set_subnet(self, subnet):
        self._subnet = subnet
        self._arn = self._arn + "." + subnet.local_id

    @property
    def ips(self):
        ips = []
        for cluster_node in self._json_blob["ClusterNodes"]:
            if "PrivateIPAddress" in cluster_node:
                ips.append(cluster_node["PrivateIPAddress"])
            if "PublicIPAddress" in cluster_node:
                ips.append(cluster_node["PublicIPAddress"])
        return ips

    @property
    def can_egress(self):
        return False

    @property
    def subnets(self):
        if self._subnet:
            return self._subnet
        else:
            # Get the subnets that this cluster can be a part of
            cluster_subnet_group_name = self._json_blob["ClusterSubnetGroupName"]
            vpc_id = self._json_blob["VpcId"]
            subnet_groups_json = query_aws(
                self.account, "redshift-describe-cluster-subnet-groups", self.region
            )
            matched_subnet_group = {}
            for subnet_group in subnet_groups_json["ClusterSubnetGroups"]:
                if (
                    vpc_id == subnet_group["VpcId"]
                    and cluster_subnet_group_name
                    == subnet_group["ClusterSubnetGroupName"]
                ):
                    matched_subnet_group = subnet_group
            if matched_subnet_group == {}:
                raise Exception("Could not find the subnet group")

            # Get the IDs of those subnets
            subnet_ids = []
            for subnet in matched_subnet_group["Subnets"]:
                subnet_ids.append(subnet["SubnetIdentifier"])

            # Look through the subnets in the regions for ones that match,
            # then find those subnets that actually have the IPs for the cluster nodes in them
            subnets_with_cluster_nodes = []
            subnets = query_aws(self.account, "ec2-describe-subnets", self.region)
            for subnet in subnets["Subnets"]:
                if subnet["SubnetId"] in subnet_ids:
                    # We have a subnet ID that we know the cluster can be part of, now check if there is actually a node there
                    for cluster_node in self._json_blob["ClusterNodes"]:
                        if IPAddress(cluster_node["PrivateIPAddress"]) in IPNetwork(
                            subnet["CidrBlock"]
                        ):
                            subnets_with_cluster_nodes.append(subnet["SubnetId"])

            return subnets_with_cluster_nodes

    @property
    def tags(self):
        return pyjq.all(".Tags[]", self._json_blob)

    @property
    def is_public(self):
        for ip in self.ips:
            if is_public_ip(ip):
                return True
        return False

    @property
    def security_groups(self):
        return pyjq.all(".VpcSecurityGroups[].VpcSecurityGroupId", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "redshift"

        # Set the parent to a VPC
        # Redshift has no subnet
        assert parent._type == "region"
        self._parent = None
        for vpc in parent.children:
            if vpc.local_id == json_blob["VpcId"]:
                self._parent = vpc
        if self._parent is None:
            raise Exception(
                "Could not find parent for Redshift node, was looking for VPC {}".format(
                    json_blob["VpcId"]
                )
            )

        self._local_id = json_blob["ClusterIdentifier"]
        self._arn = json_blob["Endpoint"]["Address"]
        self._name = truncate(json_blob["ClusterIdentifier"])
        super(Redshift, self).__init__(self._parent, json_blob)


class ElasticSearch(Leaf):
    @property
    def ips(self):
        return []

    @property
    def can_egress(self):
        return False

    @property
    def subnets(self):
        return pyjq.all(".VPCOptions.SubnetIds[]", self._json_blob)

    @property
    def tags(self):
        # TODO Custom collection is required for the tags because list-domains returns a domain name,
        # but getting the tags requires calling `es list-tags --arn ARN` and you get the ARN from
        # the  `es-describe-elasticsearch-domain` files
        return []

    @property
    def is_public(self):
        return False

    @property
    def security_groups(self):
        return pyjq.all(".VPCOptions.SecurityGroupIds[]", self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "elasticsearch"

        self._local_id = json_blob["ARN"]
        self._arn = json_blob["ARN"]
        self._name = truncate(json_blob["DomainName"])
        super(ElasticSearch, self).__init__(parent, json_blob)


class Cidr(Leaf):
    def ips(self):
        return [self._local_id]

    def __init__(self, cidr, name=None):
        self._type = "ip"
        self._arn = cidr
        self._local_id = cidr
        if name:
            self._name = name
        else:
            self._name = cidr

        if cidr == "0.0.0.0/0":
            self._name = "Public"
            self._type = "cloud"

        # For determining if this IP is actually connected to anything
        self.is_used = False

        super(Cidr, self).__init__(None, cidr)


class Connection(object):
    _source = None
    _target = None
    _json = None

    @property
    def source(self):
        return self._source

    @property
    def target(self):
        return self._target

    def __key(self):
        return (self._source.arn, self._target.arn)

    def __eq__(self, other):
        return self.__key() == other.__key()

    def __hash__(self):
        return hash(self.__key())

    def __init__(self, source, target):
        self._source = source
        self._target = target
        self._json = []

    def cytoscape_data(self):
        return {
            "data": {
                "source": self._source.arn,
                "target": self._target.arn,
                "type": "edge",
                "node_data": self._json,
            }
        }
