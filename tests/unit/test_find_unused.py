import sys
import json
from importlib import reload

from unittest import TestCase, mock
from unittest.mock import MagicMock
from nose.tools import assert_equal, assert_true, assert_false


class TestFindUnused(TestCase):
    mock_account = type("account", (object,), {"name": "a"})
    mock_region = type("region", (object,), {"account": mock_account, "name": "a"})

    def test_find_unused_elastic_ips_empty(self):
        def mocked_query_side_effect(account, query, region):
            if query == "ec2-describe-addresses":
                return {
                    "Addresses": [
                        {
                            "AllocationId": "eipalloc-1",
                            "AssociationId": "eipassoc-1",
                            "Domain": "vpc",
                            "NetworkInterfaceId": "eni-1",
                            "NetworkInterfaceOwnerId": "123456789012",
                            "PrivateIpAddress": "10.0.0.1",
                            "PublicIp": "1.2.3.4",
                            "PublicIpv4Pool": "amazon",
                        }
                    ]
                }

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_elastic_ips

            assert_equal(find_unused_elastic_ips(self.mock_region), [])

    def test_find_unused_elastic_ips(self):
        def mocked_query_side_effect(account, query, region):
            if query == "ec2-describe-addresses":
                return {
                    "Addresses": [
                        {
                            "AllocationId": "eipalloc-1",
                            "AssociationId": "eipassoc-1",
                            "Domain": "vpc",
                            "NetworkInterfaceId": "eni-1",
                            "NetworkInterfaceOwnerId": "123456789012",
                            "PrivateIpAddress": "10.0.0.1",
                            "PublicIp": "1.2.3.4",
                            "PublicIpv4Pool": "amazon",
                        },
                        {
                            "PublicIp": "2.3.4.5",
                            "Domain": "vpc",
                            "AllocationId": "eipalloc-2",
                        },
                    ]
                }

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_elastic_ips

            assert_equal(
                find_unused_elastic_ips(self.mock_region),
                [{"id": "eipalloc-2", "ip": "2.3.4.5"}],
            )
