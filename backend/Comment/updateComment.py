import boto3
import json
import os

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

        # Token válido
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_COMMENTS']
        table = dynamodb.Table(table_name)
        print("Tabla DynamoDB:", table_name)

        tenant_id = event['path']['tenant_id']
        room_id = event['path']['room_id']
        comment_id = event['path']['comment_id']
        print("Parámetros recibidos - tenant_id:", tenant_id, "room_id:", room_id, "comment_id:", comment_id)

        # Leer el cuerpo correctamente
        updates = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        print("Cuerpo de la solicitud:", updates)

        if 'comment_text' not in updates:
            print("No se proporcionó texto de comentario para actualizar")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No se proporcionó texto de comentario para actualizar'})
            }

        # Validar si el comentario existe antes de actualizarlo
        get_response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'room_id': room_id
            }
        )
        print("Respuesta de get_item:", get_response)

        if 'Item' not in get_response or get_response['Item'].get('comment_id') != comment_id:
            print("El comentario no existe o comment_id no coincide")
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'El comentario no existe o no coincide'})
            }

        # Actualizar el comentario
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
        print("Elemento actualizado correctamente. Respuesta:", response)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario actualizado con éxito', 'updated': response['Attributes']})
        }
    except Exception as e:
        print("Error durante la actualización:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
