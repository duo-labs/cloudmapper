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
from nose.tools import assert_equal, assert_true, assert_false

from shared.nodes import truncate, get_name, is_public_ip, Account


class TestNodes(unittest.TestCase):
    """Test class for nodes"""

    def test_truncate(self):
        assert_equal("hello", truncate("hello"))
        assert_equal(
            "012345678900123456789001234567890012345..",
            truncate("0123456789001234567890012345678900123456789001234567890"),
        )

    def test_is_public_ip(self):
        assert_true(is_public_ip("1.1.1.1"))
        assert_false(is_public_ip("10.0.0.0"))

    def test_Account(self):
        json_blob = {u"id": 111111111111, u"name": u"prod"}
        account = Account(None, json_blob)
        assert_equal(111111111111, account.local_id)
        assert_equal("prod", account.name)
        assert_equal("account", account.node_type)
        assert_equal("arn:aws:::111111111111:", account.arn)
        assert_false(account.isLeaf)
        assert_equal("prod", get_name(json_blob, "name"))
        assert_false(account.has_leaves)
        assert_equal([], account.leaves)
        assert_equal(
            {
                "data": {
                    "node_data": {"id": 111111111111, "name": "prod"},
                    "local_id": 111111111111,
                    "type": "account",
                    "id": "arn:aws:::111111111111:",
                    "name": u"prod",
                }
            },
            account.cytoscape_data(),
        )
