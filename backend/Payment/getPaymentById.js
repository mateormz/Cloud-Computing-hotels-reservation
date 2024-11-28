const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.getPaymentById = async (event) => {
    try {
        const payment_id = event.pathParameters.payment_id;
        const tenant_id = event.pathParameters.tenant_id;

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

        // Obtener el pago
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            Key: { tenant_id, payment_id },
        };

        const result = await dynamoDb.get(params).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Pago no encontrado' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ payment: result.Item }),
        };

    } catch (error) {
        console.error('Error en getPaymentById:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
