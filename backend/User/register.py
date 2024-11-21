import boto3
import hashlib
import os
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table_name = os.environ['TABLE_NAME']
    index_name = os.environ['INDEXLSI1_USERS']  # tenant-email-index
    table = dynamodb.Table(table_name)
    
    body = event.get('body', {})
    tenant_id = body.get('tenant_id')  # Identifica el hotel
    nombre = body.get('nombre')
    email = body.get('email')
    password = body.get('password')

    if not all([tenant_id, nombre, email, password]):
        return {
            'statusCode': 400,
            'body': {'error': 'Faltan campos requeridos'}
        }

    # Verificar si el email ya existe usando el LSI
    existing_user = table.query(
        IndexName=index_name,
        KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('email').eq(email)
    )

    if existing_user['Items']:
        return {
            'statusCode': 400,
            'body': {'error': 'El email ya está registrado para este hotel'}
        }

    # Registrar al usuario
    hashed_password = hash_password(password)
    user_id = str(uuid.uuid4())  # Generar un identificador único para el usuario

    table.put_item(
        Item={
            'tenant_id': tenant_id,
            'user_id': user_id,
            'nombre': nombre,
            'email': email,
            'password_hash': hashed_password,
            'fecha_registro': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    )

    return {
        'statusCode': 200,
        'body': {'message': 'Usuario registrado con éxito', 'user_id': user_id}
    }