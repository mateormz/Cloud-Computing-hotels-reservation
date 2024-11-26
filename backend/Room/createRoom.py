import boto3
import uuid
from datetime import datetime
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_ROOMS']
        table = dynamodb.Table(table_name)

        tenant_id = event['body']['tenant_id']
        room_name = event['body']['room_name']
        max_persons = event['body']['max_persons']
        room_type = event['body']['room_type']  # Ejemplo: simple, doble, suite
        price_per_night = event['body']['price_per_night']  # Precio por noche

        if not all([tenant_id, room_name, max_persons, room_type, price_per_night]):
            return {
                'statusCode': 400,
                'body': {'error': 'Faltan campos requeridos'}
            }

        room_id = str(uuid.uuid4())

        table.put_item(
            Item={
                'tenant_id': tenant_id,
                'room_id': room_id,
                'room_name': room_name,
                'max_persons': max_persons,
                'room_type': room_type,
                'price_per_night': price_per_night,
                'is_available': True,
                'is_reserved': False,
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        )

        return {
            'statusCode': 200,
            'body': {'message': 'Habitación creada con éxito', 'room_id': room_id}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
