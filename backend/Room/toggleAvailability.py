import boto3
from boto3.dynamodb.conditions import Key
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
        index_name = os.environ['INDEXLSI1_ROOMS']

        # Consultar la habitación usando el LSI en lugar de depender de availability
        query_response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('tenant_id').eq(tenant_id)
        )

        # Buscar la habitación por room_id dentro de los resultados
        room = next((r for r in query_response.get('Items', []) if r['room_id'] == room_id), None)

        if not room:
            return {
                'statusCode': 404,
                'body': {'error': 'Habitación no encontrada'}
            }

        # Cambiar entre "disponible" y "reservado"
        new_availability = 'reservado' if room['availability'] == 'disponible' else 'disponible'

        update_response = table.update_item(
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
                'updated': update_response['Attributes']
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
