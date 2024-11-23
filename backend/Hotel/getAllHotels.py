import boto3
import os

def lambda_handler(event, context):
    try:
        # Conectar con DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        # Escanear la tabla para obtener todos los hoteles
        response = table.scan()

        hotels = response.get('Items', [])

        return {
            'statusCode': 200,
            'body': {'hotels': hotels}
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }