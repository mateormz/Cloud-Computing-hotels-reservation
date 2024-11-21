import boto3
import hashlib
import uuid
from datetime import datetime, timedelta
import os
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ['TABLE_NAME']
    token_table_name = os.environ['TABLE_TOKEN_NAME']
    index_name = os.environ['INDEXLSI1_USERS']  # tenant-email-index
    table = dynamodb.Table(table_name)
    token_table = dynamodb.Table(token_table_name)

    body = event.get('body', {})
    tenant_id = body.get('tenant_id')
    email = body.get('email')
    password = body.get('password')

    if not all([tenant_id, email, password]):
        return {
            'statusCode': 400,
            'body': {'error': 'Faltan campos requeridos'}
        }

    hashed_password = hash_password(password)

    # Buscar al usuario por correo y tenant usando el LSI
    response = table.query(
        IndexName=index_name,
        KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('email').eq(email)
    )

    if not response['Items'] or response['Items'][0]['password_hash'] != hashed_password:
        return {
            'statusCode': 403,
            'body': {'error': 'Credenciales inválidas'}
        }

    # Generar un token
    token = str(uuid.uuid4())
    expiration = (datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')

    token_table.put_item(
        Item={
            'tenant_id': tenant_id,
            'token': token,
            'expiration': expiration
        }
    )

    return {
        'statusCode': 200,
        'body': {'token': token, 'expires': expiration}
    }