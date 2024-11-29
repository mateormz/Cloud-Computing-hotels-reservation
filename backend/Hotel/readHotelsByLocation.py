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

        index_name = os.environ['INDEXGSI1_HOTELS']
        print("Nombre del índice GSI:", index_name)

        table = dynamodb.Table(table_name)

        # Obtener el parámetro hotel_location
        hotel_location = event['query'].get('hotel_location')
        print("hotel_location recibido:", hotel_location)

        if not hotel_location:
            print("Error: El parámetro hotel_location no fue proporcionado.")
            return {
                'statusCode': 400,
                'body': {'error': 'El parámetro hotel_location es obligatorio'}
            }

        # Consultar DynamoDB por hotel_location
        print(f"Consultando DynamoDB en el índice '{index_name}' por hotel_location: {hotel_location}")
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('hotel_location').eq(hotel_location)
        )
        print("Respuesta de DynamoDB:", response)

        if not response.get('Items'):
            print(f"No se encontraron hoteles para la ubicación: {hotel_location}")
            return {
                'statusCode': 404,
                'body': {'error': 'No se encontraron hoteles en la ubicación proporcionada'}
            }

        print(f"Hoteles encontrados para la ubicación {hotel_location}: {response['Items']}")
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