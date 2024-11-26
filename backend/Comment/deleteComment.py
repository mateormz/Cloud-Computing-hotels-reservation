import boto3
import os
import json

def lambda_handler(event, context):
    try:
        print("Evento recibido:", event)

        # Validación de token
        token = event['headers'].get('Authorization')
        print("Token recibido:", token)

        if not token:
            print("Token no proporcionado")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        # Validación del token con Lambda
        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"
        print("Nombre de la función de validación del token:", function_name)

        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": "global"
            }
        })
        print("Payload para validar token:", payload_string)

        lambda_client = boto3.client('lambda')
        invoke_response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=payload_string
        )
        print("Respuesta de la validación del token:", invoke_response)

        response = json.loads(invoke_response['Payload'].read())
        print("Token validado con resultado:", response)

        if response['statusCode'] != 200:
            print("Validación de token fallida")
            return {
                'statusCode': response['statusCode'],
                'body': response['body']
            }

        # Token válido, continuar con la operación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMMENTS']
        table = dynamodb.Table(table_name)
        print("Tabla DynamoDB:", table_name)

        tenant_id = event['path']['tenant_id']
        room_id = event['path']['room_id']
        comment_id = event['path']['comment_id']
        print("Parámetros recibidos - tenant_id:", tenant_id, "room_id:", room_id, "comment_id:", comment_id)

        table.delete_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            },
            ConditionExpression="comment_id = :comment_id",
            ExpressionAttributeValues={
                ":comment_id": comment_id
            }
        )
        print("Elemento eliminado correctamente")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario eliminado exitosamente'})
        }
    except Exception as e:
        print("Error durante la eliminación:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
