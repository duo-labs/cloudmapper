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


def truncate(string):
    return (string[:19] + '..') if len(string) > 20 else string


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
            ip in IPNetwork("10.0.0.0/8") or
            ip in IPNetwork("172.16.0.0/12") or
            ip in IPNetwork("192.168.0.0/16")
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
    def node_type(self):
        return self._type

    @property
    def isLeaf(self):
        return self._isLeaf

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
            # TODO: Use iterators
            leaves = []
            for child in self.children:
                leaves.extend(child.leaves)
            return leaves

    def cytoscape_data(self):
        response = {"data": {
            "id": self.arn,
            "name": self.name,
            "type": self.node_type,
            "local_id": self.local_id,
            "node_data": self.json
        }}
        if self.parent:
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
        self._arn = "arn:aws::{}:{}:vpc/{}".format(parent.region.name, parent.account.local_id, self._local_id)
        self._name = get_name(json_blob, "VpcId")
        self._type = "vpc"

        self._peering_connections = []

        super(Vpc, self).__init__(parent, json_blob)


class Az(Node):
    def __init__(self, parent, json_blob):
        self._local_id = json_blob["ZoneName"]
        self._arn = "arn:aws::{}:{}:vpc/{}/az/{}".format(parent.region.local_id, parent.account.local_id, parent.local_id, self._local_id)
        self._name = json_blob["ZoneName"]
        self._type = "az"
        super(Az, self).__init__(parent, json_blob)


class Subnet(Node):
    def __init__(self, parent, json_blob):
        # arn:aws:ec2:region:account-id:subnet/subnet-id
        self._local_id = json_blob["SubnetId"]
        self._arn = "arn:aws::{}:{}:subnet/{}".format(parent.region.name, parent.account.local_id, self._local_id)
        self._name = get_name(json_blob, "SubnetId")
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
            private_ips = pyjq.all('.NetworkInterfaces[].PrivateIpAddresses[].PrivateIpAddress', self._json_blob)
            self._ips.extend([x for x in private_ips if x is not None])
            public_ips = pyjq.all('.NetworkInterfaces[].PrivateIpAddresses[].Association.PublicIp', self._json_blob)
            self._ips.extend([x for x in public_ips if x is not None])
        return self._ips

    def security_groups(self):
        return pyjq.all('.SecurityGroups[].GroupId', self._json_blob)

    def __init__(self, parent, json_blob, collapse_by_tag=None, collapse_asgs=True):
        autoscaling_name = []
        if collapse_asgs:
            autoscaling_name = pyjq.all('.Tags[] | select(.Key == "aws:autoscaling:groupName") | .Value', json_blob)

        collapse_by_tag_value = []
        if collapse_by_tag:
            collapse_by_tag_value = pyjq.all('.Tags[] | select(.Key == "{}") | .Value'.format(collapse_by_tag), json_blob)

        if autoscaling_name != []:
            self._type = "autoscaling"
            self._local_id = autoscaling_name[0]
        elif collapse_by_tag_value != []:
            self._type = "grouped_ec2"
            self._local_id = "grouped_ec2_{}".format(collapse_by_tag_value[0])
        else:
            self._type = "ec2"
            self._local_id = json_blob["InstanceId"]

        self._arn = "arn:aws:ec2:{}:{}:instance/{}".format(parent.region.name, parent.account.local_id, self._local_id)
        self._name = get_name(json_blob, "InstanceId")
        super(Ec2, self).__init__(parent, json_blob)


class Elb(Leaf):
    @property
    def ips(self):
        # ELB's don't have IPs
        return []

    @property
    def is_public(self):
        scheme = pyjq.all('.Scheme', self._json_blob)[0]
        if scheme == "internet-facing":
            return True
        return False

    def security_groups(self):
        return pyjq.all('.SecurityGroups[]', self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "elb"
        self._local_id = json_blob["LoadBalancerName"]
        self._arn = "arn:aws:ec2:{}:{}:instance/{}/{}".format(
            parent.region.name,
            parent.account.local_id,
            self._local_id,
            parent.local_id)
        self._name = json_blob["LoadBalancerName"]
        super(Elb, self).__init__(parent, json_blob)


class Rds(Leaf):
    @property
    def ips(self):
        # RDS instances don't have IPs
        return []

    @property
    def is_public(self):
        return pyjq.all('.PubliclyAccessible', self._json_blob)[0]

    def security_groups(self):
        return pyjq.all('.VpcSecurityGroups[].VpcSecurityGroupId', self._json_blob)

    def __init__(self, parent, json_blob):
        self._type = "rds"

        # Check if this is a read-replicable
        if pyjq.all('.ReadReplicaSourceDBInstanceIdentifier', json_blob) != [None]:
            self._type = "rds_rr"

        # I am making up this ARN, because RDS uses "arn:aws:rds:region:account-id:db:db-instance-name",
        # but that doesn't tell the subnet
        self._local_id = json_blob["DBInstanceIdentifier"]
        self._arn = "arn:aws:rds:{}:{}:db-instance/{}/{}".format(
            parent.region.name,
            parent.account.local_id,
            self._local_id,
            parent.local_id
        )
        self._name = truncate(json_blob["DBInstanceIdentifier"])
        super(Rds, self).__init__(parent, json_blob)


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
        return {"data": {
            "source": self._source.arn,
            "target": self._target.arn,
            "type": "edge",
            "node_data": self._json}}
