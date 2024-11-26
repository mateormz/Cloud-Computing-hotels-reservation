import boto3
import os
import json

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
        tenant_id = event['pathParameters']['tenant_id']
        room_id = event['pathParameters']['room_id']

        # Llamar al Lambda para validar el token
        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": tenant_id  # Pasamos tenant_id para validación
            }
        })

        lambda_client = boto3.client('lambda')
        invoke_response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=payload_string
        )
        response = json.loads(invoke_response['Payload'].read())

        if response.get('statusCode') != 200:
            return {
                'statusCode': response['statusCode'],
                'body': response['body']
            }

        # Si el token es válido, proceder a buscar la habitación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_ROOMS']
        table = dynamodb.Table(table_name)

        # Consultar la habitación por tenant_id y room_id
        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            }
        )

        # Si la habitación no existe
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': '{"error": "Room not found"}'
            }

        return {
            'statusCode': 200,
            'body': json.dumps(response['Item'])
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
