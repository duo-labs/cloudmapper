import sys
import json
from importlib import reload

from unittest import TestCase, mock
from unittest.mock import MagicMock
from nose.tools import assert_equal, assert_true, assert_false


class TestFindUnused(TestCase):
    mock_account = type("account", (object,), {"name": "a"})
    mock_region = type("region", (object,), {"account": mock_account, "name": "a", "region": mock_account })

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

    def test_find_unused_volumes(self):
        def mocked_query_side_effect(account, query, region):
            if query == "ec2-describe-volumes":
                return {
                    "Volumes": [
                        {
                            "Attachments": [
                                {
                                    "AttachTime": "2019-03-21T21:03:04+00:00",
                                    "DeleteOnTermination": True,
                                    "Device": "/dev/xvda",
                                    "InstanceId": "i-1234",
                                    "State": "attached",
                                    "VolumeId": "vol-1234",
                                }
                            ],
                            "AvailabilityZone": "us-east-1b",
                            "CreateTime": "2019-03-21T21:03:04.345000+00:00",
                            "Encrypted": False,
                            "Iops": 300,
                            "Size": 100,
                            "SnapshotId": "snap-1234",
                            "State": "in-use",
                            "VolumeId": "vol-1234",
                            "VolumeType": "gp2",
                        },
                        {
                            "Attachments": [
                                {
                                    "AttachTime": "2019-03-21T21:03:04+00:00",
                                    "DeleteOnTermination": True,
                                    "Device": "/dev/xvda",
                                    "InstanceId": "i-2222",
                                    "State": "attached",
                                    "VolumeId": "vol-2222",
                                }
                            ],
                            "AvailabilityZone": "us-east-1b",
                            "CreateTime": "2019-03-21T21:03:04.345000+00:00",
                            "Encrypted": False,
                            "Iops": 300,
                            "Size": 100,
                            "SnapshotId": "snap-2222",
                            "State": "available",
                            "VolumeId": "vol-2222",
                            "VolumeType": "gp2",
                        },
                    ]
                }

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_volumes

            assert_equal(find_unused_volumes(self.mock_region), [{"id": "vol-2222"}])

    def test_find_unused_security_groups(self):
        def mocked_query_side_effect(account, query, region):
            if query == "ec2-describe-security-groups":
                return {
                    "SecurityGroups": [
                        {
                            "IpPermissionsEgress": [
                                {
                                    "IpProtocol": "-1",
                                    "PrefixListIds": [],
                                    "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                                    "UserIdGroupPairs": [],
                                    "Ipv6Ranges": [],
                                }
                            ],
                            "Description": "Public access",
                            "IpPermissions": [
                                {
                                    "PrefixListIds": [],
                                    "FromPort": 22,
                                    "IpRanges": [],
                                    "ToPort": 22,
                                    "IpProtocol": "tcp",
                                    "UserIdGroupPairs": [
                                        {
                                            "UserId": "123456789012",
                                            "GroupId": "sg-00000002",
                                        }
                                    ],
                                    "Ipv6Ranges": [],
                                },
                                {
                                    "PrefixListIds": [],
                                    "FromPort": 443,
                                    "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                                    "ToPort": 443,
                                    "IpProtocol": "tcp",
                                    "UserIdGroupPairs": [],
                                    "Ipv6Ranges": [],
                                },
                            ],
                            "GroupName": "Public",
                            "VpcId": "vpc-12345678",
                            "OwnerId": "123456789012",
                            "GroupId": "sg-00000008",
                        }
                    ]
                }
            elif query == "ec2-describe-network-interfaces":
                return {"NetworkInterfaces": []}

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_security_groups

            assert_equal(
                find_unused_security_groups(self.mock_region),
                [
                    {
                        "description": "Public access",
                        "id": "sg-00000008",
                        "name": "Public",
                    }
                ],
            )

    def test_find_unused_network_interfaces(self):
        def mocked_query_side_effect(account, query, region):
            if query == "ec2-describe-network-interfaces":
                return {
                    "NetworkInterfaces": [
                        {
                            "Association": {
                                "IpOwnerId": "amazon",
                                "PublicDnsName": "ec2-3-80-3-41.compute-1.amazonaws.com",
                                "PublicIp": "3.80.3.41",
                            },
                            "Attachment": {
                                "AttachTime": "2018-11-27T03:36:34+00:00",
                                "AttachmentId": "eni-attach-08ac3da5d33fc7a02",
                                "DeleteOnTermination": False,
                                "DeviceIndex": 1,
                                "InstanceOwnerId": "501673713797",
                                "Status": "attached",
                            },
                            "AvailabilityZone": "us-east-1f",
                            "Description": "arn:aws:ecs:us-east-1:653711331788:attachment/ed8fed01-82d0-4bf6-86cf-fe3115c23ab8",
                            "Groups": [
                                {"GroupId": "sg-00000008", "GroupName": "Public"}
                            ],
                            "InterfaceType": "interface",
                            "Ipv6Addresses": [],
                            "MacAddress": "16:2f:d0:d6:ed:28",
                            "NetworkInterfaceId": "eni-00000001",
                            "OwnerId": "653711331788",
                            "PrivateDnsName": "ip-172-31-48-168.ec2.internal",
                            "PrivateIpAddress": "172.31.48.168",
                            "PrivateIpAddresses": [
                                {
                                    "Association": {
                                        "IpOwnerId": "amazon",
                                        "PublicDnsName": "ec2-3-80-3-41.compute-1.amazonaws.com",
                                        "PublicIp": "3.80.3.41",
                                    },
                                    "Primary": True,
                                    "PrivateDnsName": "ip-172-31-48-168.ec2.internal",
                                    "PrivateIpAddress": "172.31.48.168",
                                }
                            ],
                            "RequesterId": "578734482556",
                            "RequesterManaged": True,
                            "SourceDestCheck": True,
                            "Status": "available",
                            "SubnetId": "subnet-00000001",
                            "TagSet": [],
                            "VpcId": "vpc-12345678",
                        }
                    ]
                }

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_network_interfaces

            assert_equal(
                find_unused_network_interfaces(self.mock_region),
                [{"id": "eni-00000001"}],
            )

    def test_unused_elastic_load_balancers(self):
        def mocked_query_side_effect(account, query, region):
            if query == "elb-describe-load-balancers":
                return {
                    "LoadBalancerDescriptions": [
                        {
                            "AvailabilityZones": [
                                "eu-west-1b",
                                "eu-west-1c",
                                "eu-west-1a"
                            ],
                            "BackendServerDescriptions": [],
                            "CanonicalHostedZoneName": "some-elb-450109654.eu-west-1.elb.amazonaws.com",
                            "CanonicalHostedZoneNameID": "Z32O12XQLNTSW1",
                            "CreatedTime": "2019-08-29T13:33:49.910000+00:00",
                            "DNSName": "some-elb-450109654.eu-west-1.elb.amazonaws.com",
                            "HealthCheck": {
                                "HealthyThreshold": 4,
                                "Interval": 300,
                                "Target": "HTTP:8033/ping",
                                "Timeout": 4,
                                "UnhealthyThreshold": 2
                            },
                            "Instances": [],
                            "ListenerDescriptions": [
                                {
                                    "Listener": {
                                        "InstancePort": 8033,
                                        "InstanceProtocol": "HTTP",
                                        "LoadBalancerPort": 443,
                                        "Protocol": "HTTPS",
                                        "SSLCertificateId": "arn:aws:acm:eu-west-1:123456789011:certificate/1e43d2f8-8f31-4a29-ba3e-fce3d2c6c0ed"
                                    },
                                    "PolicyNames": [
                                        "ELBSecurityPolicy-2016-08"
                                    ]
                                },
                                {
                                    "Listener": {
                                        "InstancePort": 8033,
                                        "InstanceProtocol": "HTTP",
                                        "LoadBalancerPort": 80,
                                        "Protocol": "HTTP"
                                    },
                                    "PolicyNames": []
                                }
                            ],
                            "LoadBalancerName": "some-elb",
                            "Policies": {
                                "AppCookieStickinessPolicies": [],
                                "LBCookieStickinessPolicies": [],
                                "OtherPolicies": [
                                    "ELBSecurityPolicy-2019-08"
                                ]
                            },
                            "Scheme": "internet-facing",
                            "SecurityGroups": [
                                "sg-82e9fce5",
                                "sg-d2be0aaa",
                                "sg-b1e9fcd6"
                            ],
                            "SourceSecurityGroup": {
                                "GroupName": "default-http-healthcheck",
                                "OwnerAlias": "123456789011"
                            },
                            "Subnets": [
                                "subnet-67c99110",
                                "subnet-a684b4c3",
                                "subnet-ef6516b6"
                            ],
                            "VPCId": "vpc-1234567"
                        }
                    ]
                }

        # Clear cached module so we can mock stuff
        if "shared.find_unused" in sys.modules:
            del sys.modules["shared.find_unused"]

        with mock.patch("shared.common.query_aws") as mock_query:
            mock_query.side_effect = mocked_query_side_effect
            from shared.find_unused import find_unused_elastic_load_balancers

            assert_equal(
                find_unused_elastic_load_balancers(self.mock_region),
                [{"LoadBalancerName": "some-elb"}],
            )
