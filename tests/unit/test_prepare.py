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

import unittest
from mock import patch
from nose.tools import assert_equal, assert_true, assert_false
import pyjq

from commands.prepare import is_external_cidr, get_regions, get_vpcs, build_data_structure
from shared.nodes import Account, Region


class TestPrepare(unittest.TestCase):
    """Test class for prepare"""

    def test_is_external_cidr(self):
        assert_true(is_external_cidr("1.1.1.1/32"))
        assert_false(is_external_cidr("10.0.0.0/32"))

    def test_get_vpcs(self):
        # This actually uses the demo data files provided
        json_blob = {u'id': 111111111111, u'name': u'demo'}
        account = Account(None, json_blob)
        region = Region(account, {"Endpoint": "ec2.us-east-1.amazonaws.com", "RegionName": "us-east-1"})
        assert_equal([{"VpcId": "vpc-12345678", "Tags": [{"Value": "Prod", "Key": "Name"}], "InstanceTenancy": "default", "CidrBlockAssociationSet": [{"AssociationId": "vpc-cidr-assoc-12345678", "CidrBlock": "10.0.0.0/16", "CidrBlockState": {"State": "associated"}}], "State": "available", "DhcpOptionsId": "dopt-12345678", "CidrBlock": "10.0.0.0/16", "IsDefault": True}], get_vpcs(region, {}))

    def test_build_data_structure(self):
        # Build the entire demo data set
        json_blob = {u'id': 111111111111, u'name': u'demo'}

        outputfilter = {}
        outputfilter["internal_edges"] = True
        outputfilter["read_replicas"] = True
        outputfilter["inter_rds_edges"] = True
        outputfilter["azs"] = False
        outputfilter["collapse_by_tag"] = False
        outputfilter["collapse_asgs"] = False

        config = {"accounts": [{"id": 123456789012, "name": "demo"}], "cidrs": {"1.1.1.1/32": {"name": "SF Office"}, "2.2.2.2/28": {"name": "NY Office"}}}

        cytoscape_json = build_data_structure(json_blob, config, outputfilter)

        # Now check it
        # Check number of connections
        assert_equal(17, len(pyjq.all('.[].data|select(.type == "edge")|keys', cytoscape_json)))

        # Check number of nodes
        assert_equal(2, len(pyjq.all('.[].data|select(.type == "ip")|keys', cytoscape_json)))
        assert_equal(2, len(pyjq.all('.[].data|select(.type == "rds")|keys', cytoscape_json)))
        assert_equal(3, len(pyjq.all('.[].data|select(.type == "ec2")|keys', cytoscape_json)))
        assert_equal(3, len(pyjq.all('.[].data|select(.type == "elb")|keys', cytoscape_json)))
        assert_equal(4, len(pyjq.all('.[].data|select(.type == "subnet")|keys', cytoscape_json)))
        assert_equal(1, len(pyjq.all('.[].data|select(.type == "region")|keys', cytoscape_json)))
        assert_equal(1, len(pyjq.all('.[].data|select(.type == "vpc")|keys', cytoscape_json)))
