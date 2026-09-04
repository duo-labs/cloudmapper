import pytest

from commands.iam_policies import build_principal_policy_report


def test_builds_policy_report_with_all_sources():
    details = {
        "Policies": [
            {
                "Arn": "arn:aws:iam::123456789012:policy/Direct",
                "PolicyName": "Direct",
                "DefaultVersionId": "v1",
                "PolicyVersionList": [
                    {
                        "VersionId": "v1",
                        "IsDefaultVersion": True,
                        "Document": {"Statement": [{"Action": "s3:GetObject"}]},
                    }
                ],
            },
            {
                "Arn": "arn:aws:iam::123456789012:policy/Group",
                "PolicyName": "Group",
                "DefaultVersionId": "v1",
                "PolicyVersionList": [
                    {
                        "VersionId": "v1",
                        "IsDefaultVersion": True,
                        "Document": {"Statement": [{"Action": "logs:CreateLogGroup"}]},
                    }
                ],
            },
        ],
        "UserDetailList": [
            {
                "Arn": "arn:aws:iam::123456789012:user/alice",
                "UserName": "alice",
                "AttachedManagedPolicies": [
                    {
                        "PolicyArn": "arn:aws:iam::123456789012:policy/Direct",
                        "PolicyName": "Direct",
                    }
                ],
                "UserPolicyList": [
                    {
                        "PolicyName": "InlineUser",
                        "PolicyDocument": {"Statement": [{"Action": "iam:GetUser"}]},
                    }
                ],
                "GroupList": ["developers"],
            }
        ],
        "RoleDetailList": [],
        "GroupDetailList": [
            {
                "GroupName": "developers",
                "GroupPolicyList": [
                    {
                        "PolicyName": "InlineGroup",
                        "PolicyDocument": {"Statement": [{"Action": "ec2:Describe*"}]},
                    }
                ],
                "AttachedManagedPolicies": [
                    {
                        "PolicyArn": "arn:aws:iam::123456789012:policy/Group",
                        "PolicyName": "Group",
                    }
                ],
            }
        ],
    }

    report = build_principal_policy_report(details, "alice")

    assert len(report) == 1
    assert report[0]["principal"]["arn"].endswith("/alice")
    assert [policy["source"] for policy in report[0]["policies"]] == [
        "inline:principal",
        "managed:principal",
        "inline:group",
        "managed:group",
    ]
    assert report[0]["policies"][1]["document"]["Statement"][0]["Action"] == "s3:GetObject"
    assert report[0]["policies"][3]["group"] == "developers"


def test_build_report_accepts_role_arn():
    details = {
        "RoleDetailList": [
            {
                "Arn": "arn:aws:iam::123456789012:role/worker",
                "RoleName": "worker",
                "AttachedManagedPolicies": [],
                "RolePolicyList": [],
            }
        ]
    }

    report = build_principal_policy_report(
        details, "arn:aws:iam::123456789012:role/worker"
    )

    assert report[0]["principal"] == {
        "type": "role",
        "name": "worker",
        "arn": "arn:aws:iam::123456789012:role/worker",
    }
    assert report[0]["policies"] == []


def test_build_report_rejects_unknown_principal():
    with pytest.raises(ValueError, match="was not found"):
        build_principal_policy_report({}, "nobody")
