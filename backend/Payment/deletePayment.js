const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.deletePayment = async (event) => {
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

        // Eliminar el pago
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            Key: { tenant_id, payment_id },
        };
        await dynamoDb.delete(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Pago eliminado con éxito' }),
        };

    } catch (error) {
        console.error('Error en deletePayment:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
