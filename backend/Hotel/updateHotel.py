import boto3
import os

def lambda_handler(event, context):
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        table = dynamodb.Table(table_name)

        tenant_id = event['path']['tenant_id']
        hotel_id = event['path']['hotel_id']
        updates = event['body']

        update_expression = "SET " + ", ".join(f"{key} = :{key}" for key in updates.keys())
        expression_values = {f":{key}": value for key, value in updates.items()}

        table.update_item(
            Key={
                'tenant_id': tenant_id,
                'hotel_id': hotel_id
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )

        return {
            'statusCode': 200,
            'body': {'message': 'Hotel actualizado con éxito'}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }