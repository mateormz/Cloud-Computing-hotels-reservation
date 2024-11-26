import boto3
import uuid
from datetime import datetime
import os

def lambda_handler(event, context):
    try:
        print("Evento recibido:", event)  # Log del evento recibido
        
        # Conectar a DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_ROOMS']
        print("Nombre de la tabla DynamoDB:", table_name)
        table = dynamodb.Table(table_name)

        # Extraer datos del body
        tenant_id = event['body'].get('tenant_id')
        room_name = event['body'].get('room_name')
        max_persons = event['body'].get('max_persons')
        room_type = event['body'].get('room_type')
        price_per_night = event['body'].get('price_per_night')
        
        print("Datos extraídos del body:")
        print(f"Tenant ID: {tenant_id}")
        print(f"Room Name: {room_name}")
        print(f"Max Persons: {max_persons}")
        print(f"Room Type: {room_type}")
        print(f"Price Per Night: {price_per_night}")

        # Validar datos requeridos
        if not all([tenant_id, room_name, max_persons, room_type, price_per_night]):
            print("Error: Faltan campos requeridos")
            return {
                'statusCode': 400,
                'body': {'error': 'Faltan campos requeridos'}
            }

        # Generar un ID único para la habitación
        room_id = str(uuid.uuid4())
        print(f"Generado Room ID: {room_id}")

        # Insertar los datos en DynamoDB
        table.put_item(
            Item={
                'tenant_id': tenant_id,
                'room_id': room_id,
                'room_name': room_name,
                'max_persons': max_persons,
                'room_type': room_type,
                'price_per_night': price_per_night,
                'availability': 'disponible',  # Inicializa con "disponible"
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        )
        print("Datos insertados exitosamente en DynamoDB")

        # Respuesta de éxito
        return {
            'statusCode': 200, 
            'body': {'message': 'Habitación creada con éxito', 'room_id': room_id}
        }

    except Exception as e:
        print("Error inesperado:", str(e))  # Log del error para depuración
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
