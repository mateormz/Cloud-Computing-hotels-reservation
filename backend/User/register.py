import boto3
import hashlib
import os
import uuid
import json  # Importar para procesar JSON
from datetime import datetime
from boto3.dynamodb.conditions import Key

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        index_name = os.environ['INDEXLSI1_USERS']  # tenant-email-index
        table = dynamodb.Table(table_name)
        
        # Convertir el cuerpo a JSON si es un string
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        tenant_id = body['tenant_id']  # Identifica el hotel
        nombre = body['nombre']
        email = body['email']
        password = body['password']

        if not all([tenant_id, nombre, email, password]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Faltan campos requeridos'})
            }

        # Verificar si el email ya existe usando el LSI
        existing_user = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('email').eq(email)
        )

        if existing_user['Items']:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'El email ya está registrado para este hotel'})
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
            'body': json.dumps({'message': 'Usuario registrado con éxito', 'user_id': user_id})
        }

    except KeyError as e:
        # Si falta alguna clave en el JSON
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Campo requerido no encontrado: {str(e)}'})
        }
    except Exception as e:
        print("Error:", str(e))  # Log del error
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }