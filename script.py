import subprocess
import requests
import json

PVWA_URL = "https://172.31.93.81"
USERNAME = "Jordan"
PASSWORD = "GPSUistheBest1"
SAFE_NAME = "AWSIAM"
GROUP_NAME = "LabDemo"

requests.packages.urllib3.disable_warnings()


def get_cyberark_token():
    url = f"{PVWA_URL}/PasswordVault/api/Auth/CyberArk/Logon"
    headers = {"Content-Type": "application/json"}
    data = {"username": USERNAME, "password": PASSWORD}
    response = requests.post(url, json=data, headers=headers, verify=False)
    return response.text.strip('"')


def get_aws_iam_usernames(group_name):
    result = subprocess.run(
        ["aws", "iam", "get-group", "--group-name", group_name,
         "--query", "Users[*].UserName", "--output", "text"],
        capture_output=True,
        text=True
    )
    return [user.strip() for user in result.stdout.strip().split()]


def get_cyberark_safe_usernames(token, safe_name):
    url = f"{PVWA_URL}/PasswordVault/api/Accounts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": token
    }
    response = requests.get(url, headers=headers, verify=False)
    accounts = response.json().get("value", [])
    return [acct["userName"] for acct in accounts if acct["safeName"] == safe_name]


def get_iam_user_details(username):
    result = subprocess.run(
        ["aws", "iam", "get-user", "--user-name", username],
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        return json.loads(result.stdout).get("User", {})
    else:
        return {"UserName": username, "Error": result.stderr.strip()}


# Main logic
token = get_cyberark_token()
aws_users = get_aws_iam_usernames(GROUP_NAME)
cyberark_users = get_cyberark_safe_usernames(token, SAFE_NAME)

missing_users = sorted(set(aws_users) - set(cyberark_users))

print("Users in AWS IAM but not in CyberArk Safe:\n")
for user in missing_users:
    details = get_iam_user_details(user)
    print(json.dumps(details, indent=2))

