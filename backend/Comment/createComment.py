import boto3
import uuid
from datetime import datetime
import os
import json

def lambda_handler(event, context):
    try:
        # Validación de token
        token = event['headers'].get('Authorization')
        if not token:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"
        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": "global"  # Validación general
            }
        })

        lambda_client = boto3.client('lambda')
        invoke_response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=payload_string
        )
        response = json.loads(invoke_response['Payload'].read())

        if response['statusCode'] != 200:
            return {
                'statusCode': response['statusCode'],
                'body': response['body']
            }

        # Token válido, continuar con la operación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        tenant_id = event['body'].get('tenant_id')
        user_id = event['body'].get('user_id')
        room_id = event['body'].get('room_id')
        comment_text = event['body'].get('comment_text')

        if not all([tenant_id, user_id, room_id, comment_text]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Faltan campos requeridos'})
            }

        comment_id = str(uuid.uuid4())
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        table.put_item(
            Item={
                'tenant_id': tenant_id,
                'room_id': room_id,
                'comment_id': comment_id,
                'user_id': user_id,
                'comment_text': comment_text,
                'created_at': created_at
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario creado con éxito', 'comment_id': comment_id})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
