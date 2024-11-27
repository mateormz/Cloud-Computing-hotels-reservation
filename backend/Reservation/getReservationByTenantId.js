const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

async function validateUserToken(token, tenant_id) {
    const functionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
    const payload = {
        body: { token, tenant_id }
    };

    const response = await lambda.invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
    }).promise();

    const responseBody = JSON.parse(response.Payload);

    return {
        success: responseBody.statusCode === 200,
        statusCode: responseBody.statusCode,
        message: responseBody.body?.error || responseBody.body,
        user_id: responseBody.body?.user_id // Extrae el user_id si el token es válido
    };
}

module.exports.getReservationsByTenantId = async (event) => {
    try {
        // Obtener el token del encabezado
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }
            };
        }

        // Obtener tenant_id desde los parámetros de ruta
        const { tenant_id } = event.pathParameters;

        // Validar token de usuario
        console.log("Validando token...");
        const userValidation = await validateUserToken(token, tenant_id);
        if (!userValidation.success) {
            return {
                statusCode: userValidation.statusCode,
                body: userValidation.message
            };
        }

        console.log("Token validado correctamente. Consultando reservas...");

        // Consultar reservas usando el índice local secundario
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXLSI1_RESERVATIONS, // Índice local secundario
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: { ":tenant_id": tenant_id }
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            body: { reservations: result.Items }
        };
    } catch (error) {
        console.error("Error en getReservationsByTenantId:", error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
