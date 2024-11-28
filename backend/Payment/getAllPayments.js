const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.getAllPayments = async (event) => {
    try {
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

        // Consultar todos los pagos (Scan)
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            FilterExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
            },
        };

        const result = await dynamoDb.scan(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ payments: result.Items }),
        };

    } catch (error) {
        console.error('Error en getAllPayments:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
