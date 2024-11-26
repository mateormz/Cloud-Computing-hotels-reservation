import boto3
import json
import os

def lambda_handler(event, context):
    try:
        # Log del evento recibido
        print("Evento recibido:", json.dumps(event))

        # Validación de token
        token = event['headers'].get('Authorization')
        print("Token recibido:", token)

        if not token:
            print("Error: Token no proporcionado")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        # Invocación de la función para validar el token
        function_name = f"{os.environ['SERVICE_NAME']}-{os.environ['STAGE']}-hotel_validateUserToken"
        print("Nombre de la función de validación de token:", function_name)
        
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
        response = json.loads(invoke_response['Payload'].read())
        print("Respuesta de validación de token:", response)

        if response['statusCode'] != 200:
            print("Error en la validación de token:", response)
            return {
                'statusCode': response['statusCode'],
                'body': response['body']
            }

        # Token válido, continuar con la operación
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMMENTS']
        print("Nombre de la tabla DynamoDB:", table_name)
        table = dynamodb.Table(table_name)

        tenant_id = event['path']['tenant_id']
        comment_id = event['path']['comment_id']
        print("Claves proporcionadas:", {
            "tenant_id": tenant_id,
            "comment_id": comment_id
        })

        # Convertir event['body'] de JSON a diccionario
        if isinstance(event['body'], str):  # Si es una cadena JSON
            updates = json.loads(event['body'])
        else:  # Ya es un diccionario
            updates = event['body']
        
        print("Datos recibidos para actualizar:", updates)

        if 'comment_text' not in updates:
            print("Error: No se proporcionó 'comment_text'")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No se proporcionó texto de comentario para actualizar'})
            }

        # Actualización en la tabla DynamoDB
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
        print("Respuesta de DynamoDB update_item:", response)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario actualizado con éxito', 'updated': response['Attributes']})
        }
    except Exception as e:
        print("Error inesperado:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
