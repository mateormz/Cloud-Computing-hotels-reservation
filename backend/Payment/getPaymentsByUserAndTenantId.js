const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.getPaymentsByUserAndTenantId = async (event) => {
    try {
        const token = event.headers?.Authorization; // Token enviado en los headers
        const tenant_id = event.pathParameters?.tenant_id;  // tenant_id pasado en la URL
        const user_id = event.pathParameters?.user_id;  // user_id pasado en la URL

        // Verificar que todos los parámetros estén presentes
        if (!token || !tenant_id || !user_id) {
            return {
                statusCode: 400,
                body: { error: 'Token, tenant_id o user_id no proporcionado' }
            };
        }

        // Validar el token
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

        // Consultar los pagos por user_id y tenant_id
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            IndexName: 'user_id-tenant_id-index', // Asegúrate de tener un índice secundario global (GSI) configurado
            KeyConditionExpression: 'tenant_id = :tenant_id and user_id = :user_id',
            ExpressionAttributeValues: {
                ':tenant_id': tenant_id,
                ':user_id': user_id
            }
        };

        const result = await dynamoDb.query(params).promise();

        if (result.Items.length === 0) {
            return {
                statusCode: 404,
                body: { error: 'No se encontraron pagos para este usuario' }
            };
        }

        return {
            statusCode: 200,
            body: result.Items
        };

    } catch (error) {
        console.error('Error en getPaymentsByUserAndTenantId:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
