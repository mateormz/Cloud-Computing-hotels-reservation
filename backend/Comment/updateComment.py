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

        # Validación del token usando otra Lambda
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
                'body': json.dumps(response['body'])
            }

        # Conexión a DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMMENTS']
        table = dynamodb.Table(table_name)

        # Recuperar parámetros
        tenant_id = event['path']['tenant_id']
        comment_id = event['path']['comment_id']

        # Leer el cuerpo de la solicitud
        updates = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        if 'comment_text' not in updates:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No se proporcionó texto de comentario para actualizar'})
            }

        # Validar existencia del comentario antes de actualizar
        get_response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'comment_id': comment_id
            }
        )
        if 'Item' not in get_response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'El comentario no existe'})
            }

        # Actualizar el comentario
        response = table.update_item(
            Key={
                'tenant_id': tenant_id,
                'comment_id': comment_id
            },
            UpdateExpression="SET comment_text = :comment_text",
            ExpressionAttributeValues={
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
