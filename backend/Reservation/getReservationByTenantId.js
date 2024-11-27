const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports.getReservationByTenantId = async (event) => {
    try {
        console.log("Evento recibido:", event);

        // Validar token
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' })
            };
        }

        // Validar pathParameters
        if (!event.pathParameters || !event.pathParameters.tenant_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El tenant_id es obligatorio' })
            };
        }

        const { tenant_id } = event.pathParameters;

        console.log("Validando token para tenant_id:", tenant_id);

        // Llamar a la función de validación del token
        const validateTokenFunction = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const tokenPayload = {
            body: { token, tenant_id }
        };

        const tokenResponse = await lambda.invoke({
            FunctionName: validateTokenFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(tokenPayload)
        }).promise();

        const tokenResponseBody = JSON.parse(tokenResponse.Payload);

        if (tokenResponseBody.statusCode !== 200) {
            const parsedBody =
                typeof tokenResponseBody.body === 'string'
                    ? JSON.parse(tokenResponseBody.body)
                    : tokenResponseBody.body;

            return {
                statusCode: tokenResponseBody.statusCode,
                body: JSON.stringify({ error: parsedBody.error || 'Token inválido' })
            };
        }

        console.log("Token validado correctamente.");

        // Consultar las reservas por tenant_id
        console.log("Consultando reservas para tenant_id:", tenant_id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXLSI1_RESERVATIONS, // Usar el índice local
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: { ":tenant_id": tenant_id }
        };

        const result = await dynamoDb.query(params).promise();

        // Validar si no hay reservas
        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No se encontraron reservas para este tenant_id' })
            };
        }

        console.log("Reservas encontradas:", result.Items);

        // Retornar las reservas
        return {
            statusCode: 200,
            body: JSON.stringify({ reservations: result.Items })
        };

    } catch (error) {
        console.error('Error en getReservationsByTenantId:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message
            })
        };
    }
};
