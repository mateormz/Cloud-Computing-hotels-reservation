const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.getReservationByTenantId = async (event) => {
    try {
        console.log("Evento recibido:", event);

        // Validación del token
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        // Extraer tenant_id de los pathParameters
        const tenant_id = event.pathParameters?.tenant_id;
        if (!tenant_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El tenant_id es obligatorio y no se proporcionó en los parámetros de la ruta' }),
            };
        }

        console.log("Validando token para tenant_id:", tenant_id);

        // Llamar a la función de validación del token
        const validateTokenFunctionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const tokenPayload = {
            body: {
                token: token,
                tenant_id: tenant_id,
            },
        };

        const validateTokenResponse = await lambda
            .invoke({
                FunctionName: validateTokenFunctionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(tokenPayload),
            })
            .promise();

        const validateTokenBody = JSON.parse(validateTokenResponse.Payload);

        if (validateTokenBody.statusCode !== 200) {
            const parsedBody =
                typeof validateTokenBody.body === 'string'
                    ? JSON.parse(validateTokenBody.body)
                    : validateTokenBody.body;

            return {
                statusCode: validateTokenBody.statusCode,
                body: JSON.stringify({ error: parsedBody.error || 'Token inválido' }),
            };
        }

        console.log("Token validado correctamente.");

        // Consultar las reservas usando el índice secundario local (LSI)
        console.log("Consultando reservas para tenant_id:", tenant_id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXLSI1_RESERVATIONS, // Usar el índice LSI para consultas optimizadas
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
            },
        };

        const reservationsResult = await dynamoDb.query(params).promise();

        if (!reservationsResult.Items || reservationsResult.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No se encontraron reservas para este tenant_id' }),
            };
        }

        console.log("Reservas encontradas:", reservationsResult.Items);

        // Preparar respuesta
        return {
            statusCode: 200,
            body: JSON.stringify({ reservations: reservationsResult.Items }),
        };
    } catch (error) {
        console.error('Error en getReservationsByTenantId:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message,
            }),
        };
    }
};
