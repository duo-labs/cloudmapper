import json
import requests
import sys
import os
import time

# Usage: Set the environment variable SLACK_WEBHOOK to https://hooks.slack.com/services/XXXX/YYYYY

webhook_url = os.environ['SLACK_WEBHOOK']

for line in sys.stdin:
    line.rstrip()
    line = line.replace('\\n', '\n')
    #print(line)

    slack_data = {'text': line}

    response = requests.post(
        webhook_url, data=json.dumps(slack_data),
        headers={'Content-Type': 'application/json'}
    )
    if response.status_code == 429:
        # Rate-limited. Sleep and retry
        time.sleep(5)
        response = requests.post(
            webhook_url, data=json.dumps(slack_data),
            headers={'Content-Type': 'application/json'}
        )

    if response.status_code != 200:
        raise ValueError(
            'Request to slack returned an error %s, the response is:\n%s'
            % (response.status_code, response.text))
