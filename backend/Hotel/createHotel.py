import boto3
import uuid
from datetime import datetime
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        # Obtener los valores del body de la solicitud
        tenant_id = event['body'].get('tenant_id')
        hotel_name = event['body'].get('hotel_name')
        hotel_location = event['body'].get('hotel_location')
        description = event['body'].get('description')

        # Verificar que todos los campos requeridos estén presentes
        if not all([tenant_id, hotel_name, hotel_location]):
            return {
                'statusCode': 400,
                'body': {'error': 'Faltan campos requeridos'}
            }

        # Si no se proporciona 'description', usar una cadena vacía por defecto
        if description is None:
            description = ""

        # Generar un ID único para el hotel
        hotel_id = str(uuid.uuid4())

        # Insertar los datos en DynamoDB
        table.put_item(
            Item={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id,
                'hotel_name': hotel_name,
                'hotel_location': hotel_location,
                'description': description, 
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