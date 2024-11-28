const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.getAllPayments = async (event) => {
    try {
        const token = event.headers.Authorization;
        const tenant_id = event.pathParameters?.tenant_id;

        if (!token || !tenant_id) {
            return {
                statusCode: 400,
                body: { error: 'Token o tenant_id no proporcionado' }
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

        // Consultar los pagos del tenant en DynamoDB
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            KeyConditionExpression: 'tenant_id = :tenant_id',
            ExpressionAttributeValues: {
                ':tenant_id': tenant_id
            }
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            body: result.Items
        };

    } catch (error) {
        console.error('Error en getAllPayments:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
