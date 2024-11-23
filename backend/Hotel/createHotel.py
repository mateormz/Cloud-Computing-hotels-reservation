import boto3
import uuid
from datetime import datetime
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        tenant_id = event['body']['tenant_id']
        hotel_name = event['body']['hotel_name']
        location = event['body']['location']

        if not all([tenant_id, hotel_name, location]):
            return {
                'statusCode': 400,
                'body': {'error': 'Faltan campos requeridos'}
            }

        hotel_id = str(uuid.uuid4())

        table.put_item(
            Item={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id,
                'hotel_name': hotel_name,
                'location': location,
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        )

        return {
            'statusCode': 200,
            'body': {'message': 'Hotel creado con éxito', 'hotel_id': hotel_id}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }