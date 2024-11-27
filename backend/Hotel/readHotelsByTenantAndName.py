import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    try:
        # Conexión con DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table_name = os.environ['TABLE_HOTELS']
        index_name = os.environ['INDEXLSI1_HOTELS']
        table = dynamodb.Table(table_name)

        # Obtener parámetros de entrada
        tenant_id = event['query'].get('tenant_id')
        hotel_name_prefix = event['query'].get('hotel_name_prefix', '')  # Puede ser vacío

        # Validar los parámetros obligatorios
        if not tenant_id:
            return {
                'statusCode': 400,
                'body': {'error': 'El parámetro tenant_id es obligatorio'}
            }

        # Construir la consulta
        response = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key('tenant_id').eq(tenant_id) & Key('hotel_name').begins_with(hotel_name_prefix)
        )

        # Devolver los resultados
        hotels = response.get('Items', [])
        return {
            'statusCode': 200,
            'body': {'hotels': hotels}
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': {'error': 'Error interno del servidor', 'details': str(e)}
        }
