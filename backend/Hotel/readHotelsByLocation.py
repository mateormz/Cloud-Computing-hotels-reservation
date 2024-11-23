import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        # Log del evento recibido
        print("Evento recibido:", event)

        # Conexión con DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        print("Nombre de la tabla DynamoDB:", table_name)

        index_name = 'location-index'
        print("Nombre del índice GSI para location:", index_name)

        table = dynamodb.Table(table_name)

        # Verificar que queryStringParameters exista
        if 'queryStringParameters' not in event or not event['queryStringParameters']:
            print("Error: queryStringParameters no está presente o está vacío.")
            return {
                'statusCode': 400,
                'body': {'error': 'No se proporcionaron parámetros de consulta'}
            }

        # Obtener el parámetro location
        location = event['queryStringParameters'].get('location')
        print("location recibido:", location)

        if not location:
            print("Error: El parámetro location no fue proporcionado.")
            return {
                'statusCode': 400,
                'body': {'error': 'El parámetro location es obligatorio'}
            }

        # Consultar DynamoDB por ubicación
        print(f"Consultando DynamoDB en el índice '{index_name}' por location: {location}")
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('location').eq(location)
        )
        print("Respuesta de DynamoDB:", response)

        if not response.get('Items'):
            print(f"No se encontraron hoteles para la ubicación: {location}")
            return {
                'statusCode': 404,
                'body': {'error': 'No se encontraron hoteles en la ubicación proporcionada'}
            }

        print(f"Hoteles encontrados para la ubicación {location}: {response['Items']}")
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