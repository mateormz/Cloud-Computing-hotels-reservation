const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.getPaymentsByDate = async (event) => {
    try {
        const tenant_id = event.pathParameters.tenant_id;
        const start_date = event.queryStringParameters.start_date; // Fecha de inicio
        const end_date = event.queryStringParameters.end_date; // Fecha de fin

        // Validación de token
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        // Validar token
        const validateTokenResponse = await validateToken(token, tenant_id);
        if (validateTokenResponse.statusCode !== 200) {
            return validateTokenResponse;
        }

        // Verificamos si las fechas están definidas
        if (!start_date || !end_date) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Se deben proporcionar las fechas de inicio y fin' }),
            };
        }

        // Consultar pagos por tenant_id y payment_date usando el LSI "tenant-payment-date-index"
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            IndexName: 'tenant-payment-date-index',  // Usamos el LSI creado en el serverless.yml
            KeyConditionExpression: "tenant_id = :tenant_id and payment_date BETWEEN :start_date AND :end_date",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
                ":start_date": start_date,
                ":end_date": end_date,
            },
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ payments: result.Items }),
        };

    } catch (error) {
        console.error('Error en getPaymentsByDate:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
