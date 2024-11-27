import boto3
import os
from decimal import Decimal

def lambda_handler(event, context):
    try:
        # Extraer tenant_id y room_id de los pathParameters
        tenant_id = event['path'].get('tenant_id')
        room_id = event['path'].get('room_id')

        if not tenant_id or not room_id:
            return {
                'statusCode': 400,
                'body': {'error': 'tenant_id o room_id no proporcionado'}
            }

        # Validación de token
        token = event['headers'].get('Authorization')
        if not token:
            return {
                'statusCode': 400,
                'body': {'error': 'Token no proporcionado'}
            }

        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"

        # Llamar al Lambda para validar el token
        payload_string = {
            "body": {
                "token": token,
                "tenant_id": tenant_id
            }
        }

        lambda_client = boto3.client('lambda')
        invoke_response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload_string)
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
                'body': {'error': 'Room not found'}
            }

        # Preparar el resultado
        room = response['Item']

        # Reemplazar valores Decimal con tipos serializables
        for key, value in room.items():
            if isinstance(value, Decimal):
                room[key] = float(value)

        return {
            'statusCode': 200,
            'body': room  # Retornar directamente como objeto JSON
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': f'Error interno del servidor: {str(e)}'}
        }
