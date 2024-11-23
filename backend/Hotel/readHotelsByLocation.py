import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        index_name = 'location-index'
        table = dynamodb.Table(table_name)

        location = event['queryStringParameters']['location']

        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('location').eq(location)
        )

        if not response['Items']:
            return {
                'statusCode': 404,
                'body': {'error': 'No se encontraron hoteles en la ubicación proporcionada'}
            }

        return {
            'statusCode': 200,
            'body': {'hotels': response['Items']}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }