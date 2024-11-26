import boto3
import json
import os

def lambda_handler(event, context):
    try:
        # Proteger con validación de token
        token = event['headers'].get('Authorization')
        if not token:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"
        tenant_id = event['path']['tenant_id']
        room_id = event['path']['room_id']

        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": tenant_id
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

        # Token válido, proceder con la operación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_ROOMS']
        table = dynamodb.Table(table_name)

        # Obtener el estado actual de la habitación
        room = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            }
        ).get('Item')

        if not room:
            return {
                'statusCode': 404,
                'body': {'error': 'Habitación no encontrada'}
            }

        # Cambiar entre "disponible" y "reservado"
        new_availability = 'reservado' if room['availability'] == 'disponible' else 'disponible'

        response = table.update_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            },
            UpdateExpression="SET availability = :new_availability",
            ExpressionAttributeValues={":new_availability": new_availability},
            ReturnValues="UPDATED_NEW"
        )

        return {
            'statusCode': 200,
            'body': {
                'message': 'Estado de disponibilidad actualizado',
                'updated': response['Attributes']
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
