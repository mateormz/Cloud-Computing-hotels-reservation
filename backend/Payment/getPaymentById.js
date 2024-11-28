const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.getPaymentById = async (event) => {
    try {
        const token = event.headers.Authorization;
        const tenant_id = event.pathParameters?.tenant_id;
        const payment_id = event.pathParameters?.payment_id;

        if (!token || !tenant_id || !payment_id) {
            return {
                statusCode: 400,
                body: { error: 'Token, tenant_id o payment_id no proporcionado' }
            };
        }

        // Validar el token del usuario llamando a la Lambda correspondiente
        const validateTokenFunction = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const tokenPayload = { body: { token, tenant_id } };

        const tokenResponse = await lambda.invoke({
            FunctionName: validateTokenFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(tokenPayload)
        }).promise();

        const tokenResponseBody = JSON.parse(tokenResponse.Payload);
        if (tokenResponseBody.statusCode !== 200) {
            return {
                statusCode: tokenResponseBody.statusCode,
                body: tokenResponseBody.body
            };
        }

        console.log("Token validado correctamente.");

        // Consultar el pago por payment_id y tenant_id
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            Key: { tenant_id, payment_id }
        };

        const result = await dynamoDb.get(params).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                body: { error: 'Pago no encontrado' }
            };
        }

        return {
            statusCode: 200,
            body: result.Item
        };

    } catch (error) {
        console.error('Error en getPaymentById:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
