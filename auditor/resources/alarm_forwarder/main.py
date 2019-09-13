import boto3
import os

def handler(event, context):
    sns = boto3.client('sns')
    for record in event['Records']:
        sns.publish(
            TopicArn=str(os.environ['ALARM_SNS']),
            Message=record['Sns']['Message'],
            Subject=record['Sns']['Subject'])
    return True