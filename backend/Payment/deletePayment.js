const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.deletePayment = async (event) => {
    try {
        // Obtener parámetros del evento
        const token = event.headers?.Authorization;
        const tenant_id = event.path?.tenant_id;
        const payment_id = event.path?.payment_id;

        // Verificar que todos los parámetros necesarios estén presentes
        if (!token || !tenant_id || !payment_id) {
            return {
                statusCode: 400,
                body: { error: 'Token, tenant_id o payment_id no proporcionado' }
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

        // Eliminar el pago en DynamoDB
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            Key: { tenant_id, payment_id }
        };

        await dynamoDb.delete(params).promise();
        console.log(`Pago ${payment_id} eliminado exitosamente`);

        return {
            statusCode: 200,
            body: { message: 'Pago eliminado con éxito' }
        };

    } catch (error) {
        console.error('Error en deletePayment:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
