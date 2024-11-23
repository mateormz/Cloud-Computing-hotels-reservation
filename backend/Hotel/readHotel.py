import boto3
import os

def lambda_handler(event, context):
    try:
        # Log del evento recibido
        print("Evento recibido:", event)

        # Conexión con DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        print("Nombre de la tabla DynamoDB:", table_name)

        table = dynamodb.Table(table_name)

        # Verificar que pathParameters exista y obtener valores
        if 'pathParameters' not in event or not event['pathParameters']:
            print("Error: pathParameters no está presente o está vacío.")
            return {
                'statusCode': 400,
                'body': {'error': 'Parámetros de la ruta no proporcionados'}
            }

        tenant_id = event['pathParameters'].get('tenant_id')
        hotel_id = event['pathParameters'].get('hotel_id')

        print("tenant_id recibido:", tenant_id)
        print("hotel_id recibido:", hotel_id)

        # Validar parámetros
        if not tenant_id or not hotel_id:
            print("Error: Faltan tenant_id o hotel_id.")
            return {
                'statusCode': 400,
                'body': {'error': 'Faltan tenant_id o hotel_id en los parámetros de la ruta'}
            }

        # Obtener datos del hotel
        print("Consultando hotel en DynamoDB...")
        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id
            }
        )
        print("Respuesta de DynamoDB:", response)

        if 'Item' not in response:
            print("Hotel no encontrado en DynamoDB.")
            return {
                'statusCode': 404,
                'body': {'error': 'Hotel no encontrado'}
            }

        print("Hotel encontrado:", response['Item'])
        return {
            'statusCode': 200,
            'body': {'hotel': response['Item']}
        }

    except Exception as e:
        print("Error inesperado:", str(e))
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }