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

        tenant_id = event['path'].get('tenant_id')

        print("tenant_id recibido:", tenant_id)

        # Validar el parámetro tenant_id
        if not tenant_id:
            print("Error: Faltan tenant_id en los parámetros de la ruta.")
            return {
                'statusCode': 400,
                'body': {'error': 'Falta el parámetro tenant_id'}
            }

        # Obtener todos los hoteles para un tenant_id usando scan
        print("Consultando hoteles para tenant_id:", tenant_id)
        response = table.scan(
            FilterExpression='tenant_id = :tenant_id',
            ExpressionAttributeValues={
                ':tenant_id': tenant_id
            }
        )
        print("Respuesta de DynamoDB:", response)

        if 'Items' not in response or len(response['Items']) == 0:
            print("No se encontraron hoteles para el tenant_id:", tenant_id)
            return {
                'statusCode': 404,
                'body': {'error': 'No se encontraron hoteles para este tenant_id'}
            }

        print("Hoteles encontrados:", response['Items'])
        return {
            'statusCode': 200,
            'body': {'hotels': response['Items']}
        }

    except Exception as e:
        print("Error inesperado:", str(e))
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
