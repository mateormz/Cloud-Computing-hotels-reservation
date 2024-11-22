import boto3
import json
import os

def lambda_handler(event, context):
    try:
        # Proteger el Lambda con validación de token
        token = event['headers'].get('Authorization')

        if not token:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Token no proporcionado'})
            }

        # Invocar la función de validación de token
        lambda_client = boto3.client('lambda')
        payload_string = json.dumps({
            "body": {
                "token": token,
                "tenant_id": event['body'].get('tenant_id')
            }
        })

        invoke_response = lambda_client.invoke(
            FunctionName="hotel_validateUserToken",
            InvocationType='RequestResponse',
            Payload=payload_string
        )

        response = json.loads(invoke_response['Payload'].read())
        if response['statusCode'] == 403:
            return {
                'statusCode': 403,
                'body': json.dumps({'error': 'Acceso no autorizado - Token inválido o expirado'})
            }

        # Token válido, continuar con el proceso
        tenant_id = event['body'].get('tenant_id')
        user_id = event['body'].get('user_id')

        if not tenant_id or not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Faltan campos requeridos: tenant_id o user_id'})
            }

        # Conectar con DynamoDB para obtener los datos del usuario
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        response = table.get_item(
            Key={
                'tenant_id': tenant_id,
                'user_id': user_id
            }
        )

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Usuario no encontrado'})
            }

        user = response['Item']
        del user['password_hash']  # Eliminar el hash de la contraseña del resultado

        return {
            'statusCode': 200,
            'body': json.dumps({'user': user})
        }

    except KeyError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Campo requerido no encontrado: {str(e)}'})
        }
    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Error interno del servidor', 'details': str(e)})
        }