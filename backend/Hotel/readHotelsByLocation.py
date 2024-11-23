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
        index_name = 'location-index'
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

        if not location:
            print("Error: El parámetro location no fue proporcionado.")
            return {
                'statusCode': 400,
                'body': {'error': 'El parámetro location es obligatorio'}
            }

        print("location recibido:", location)

        # Consultar DynamoDB por ubicación
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('location').eq(location)
        )
        print("Respuesta de DynamoDB:", response)

        if not response.get('Items'):
            return {
                'statusCode': 404,
                'body': {'error': 'No se encontraron hoteles en la ubicación proporcionada'}
            }

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