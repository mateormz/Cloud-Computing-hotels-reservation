import boto3
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_ROOMS']
        table = dynamodb.Table(table_name)

        tenant_id = event['path']['tenant_id']
        room_id = event['path']['room_id']

        table.delete_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            }
        )

        return {
            'statusCode': 200,
            'body': {'message': 'Habitación eliminada exitosamente'}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
