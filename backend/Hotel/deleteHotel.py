import boto3
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        tenant_id = event['pathParameters']['tenant_id']
        hotel_id = event['pathParameters']['hotel_id']

        table.delete_item(
            Key={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id
            }
        )

        return {
            'statusCode': 200,
            'body': {'message': 'Hotel eliminado con éxito'}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }