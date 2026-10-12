import json
import os
import socket
import urllib.parse
import urllib.request

import boto3
from botocore.config import Config

INSTANCE_ID = 'i-0425b410d211f07a2'
DOMAIN = os.environ['DUCKDNS_DOMAIN']
TOKEN = os.environ['DUCKDNS_TOKEN']
HOSTNAME = f'{DOMAIN}.duckdns.org'
DEMO_URL = f'https://{HOSTNAME}'

ec2 = boto3.client('ec2', region_name='eu-north-1', config=Config(
    connect_timeout=3, read_timeout=5, retries={'max_attempts': 2},
))


def response(data, status=200):
    return {'statusCode': status, 'headers': {
        'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    }, 'body': json.dumps(data)}


def update_dns(ip):
    query = urllib.parse.urlencode({'domains': DOMAIN, 'token': TOKEN, 'ip': ip})
    request = urllib.request.Request(f'https://www.duckdns.org/update?{query}')
    with urllib.request.urlopen(request, timeout=5) as result:
        if result.read().decode().strip() != 'OK':
            raise RuntimeError('DNS update failed')


def frontend_ready(ip):
    try:
        if socket.gethostbyname(HOSTNAME) != ip:
            return False
        request = urllib.request.Request(DEMO_URL, headers={
            'User-Agent': 'Messenger-Demo-Readiness',
        })
        with urllib.request.urlopen(request, timeout=5) as result:
            return result.status == 200
    except Exception:
        return False


def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method')
    if method != 'POST':
        return response({'error': 'POST required'}, 405)
    try:
        if event.get('isBase64Encoded'):
            return response({'error': 'Invalid request'}, 400)
        payload = json.loads(event.get('body') or '{}')
        if not isinstance(payload, dict):
            return response({'error': 'Invalid request'}, 400)
        action = payload.get('action')
        if action not in ('start', 'status'):
            return response({'error': 'Invalid action'}, 400)
    except (ValueError, TypeError):
        return response({'error': 'Invalid JSON'}, 400)
    try:
        result = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
        instance = result['Reservations'][0]['Instances'][0]
        state = instance['State']['Name']
        if state == 'stopped' and action == 'start':
            ec2.start_instances(InstanceIds=[INSTANCE_ID])
            return response({'instanceState': 'pending', 'ready': False,
                             'demoUrl': DEMO_URL})
        ip = instance.get('PublicIpAddress')
        ready = False
        if state == 'running' and ip:
            update_dns(ip)
            ready = frontend_ready(ip)
        return response({'instanceState': state, 'ready': ready, 'demoUrl': DEMO_URL})
    except Exception:
        return response({'ready': False,
                         'error': 'Could not prepare the demo. Please retry.'}, 503)
