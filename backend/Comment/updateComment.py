import boto3
import json
import os

def lambda_handler(event, context):
    try:
        # Validación de token
        token = event['headers'].get('Authorization')
        if not token:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"
        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": "global"
            }
        })

        lambda_client = boto3.client('lambda')
        invoke_response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=payload_string
        )
        response = json.loads(invoke_response['Payload'].read())

        if response['statusCode'] != 200:
            return {
                'statusCode': response['statusCode'],
                'body': response['body']
            }

        # Token válido, continuar con la operación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMMENTS']
        table = dynamodb.Table(table_name)

        tenant_id = event['pathParameters']['tenant_id']
        room_id = event['pathParameters']['room_id']
        comment_id = event['pathParameters']['comment_id']
        updates = json.loads(event['body'])

        if 'comment_text' not in updates:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No se proporcionó texto de comentario para actualizar'})
            }

        response = table.update_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            },
            ConditionExpression="comment_id = :comment_id",
            UpdateExpression="SET comment_text = :comment_text",
            ExpressionAttributeValues={
                ":comment_id": comment_id,
                ":comment_text": updates['comment_text']
            },
            ReturnValues="ALL_NEW"
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario actualizado con éxito', 'updated': response['Attributes']})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
