import boto3
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        tenant_id = event['pathParameters']['tenant_id']
        hotel_id = event['pathParameters']['hotel_id']

        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': {'error': 'Hotel no encontrado'}
            }

        return {
            'statusCode': 200,
            'body': {'hotel': response['Item']}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }