import boto3

from utils.strings import slugify

# maximum allowed value, c.f. https://docs.aws.amazon.com/organizations/latest/APIReference/API_ListAccounts.html#API_ListAccounts_RequestSyntax
MAX_NUM_RESULTS = 20

def get_organization_accounts():
  organizations_client = boto3.client('organizations')
  has_more = True
  next_token = None
  accounts = []

  while has_more:
    if next_token:
      response = organizations_client.list_accounts(MaxResults=MAX_NUM_RESULTS, NextToken=next_token)
    else:
      response = organizations_client.list_accounts(MaxResults=MAX_NUM_RESULTS)

    for account in response.get('Accounts', []):
      accounts.append({
        "name": slugify(account['Name']),
        "id": account['Id']
      })
    
    next_token = response.get('NextToken', None)
    has_more = (next_token is not None)
  
  return accounts