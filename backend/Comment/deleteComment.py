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

        # Token válido
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        tenant_id = event['path']['tenant_id']
        room_id = event['path']['room_id']
        comment_id = event['path']['comment_id']

        # Validar si el comentario existe antes de eliminarlo
        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'comment_id': comment_id
            }
        )

        if 'Item' not in response or response['Item'].get('room_id') != room_id:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'El comentario no existe o no coincide'})
            }

        # Eliminar el comentario
        table.delete_item(
            Key={
                'tenant_id': tenant_id,
                'comment_id': comment_id
            },
            ConditionExpression="room_id = :room_id",
            ExpressionAttributeValues={":room_id": room_id}
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Comentario eliminado exitosamente'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }
