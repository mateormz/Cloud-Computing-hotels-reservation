const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.getReservationByTenantId = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event)); // Log del evento completo

        // Validación de token
        const token = event.headers?.Authorization;
        if (!token) {
            console.error("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        // Extraer tenant_id desde el path
        const tenant_id = event.path?.tenant_id;
        if (!tenant_id) {
            console.error("Error: tenant_id no proporcionado en la ruta.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'El tenant_id es obligatorio y no se proporcionó en la ruta' }),
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
        console.log("Payload enviado para validar token:", JSON.stringify(tokenPayload));

        const validateTokenResponse = await lambda
            .invoke({
                FunctionName: validateTokenFunctionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(tokenPayload),
            })
            .promise();

        const validateTokenBody = JSON.parse(validateTokenResponse.Payload);
        console.log("Respuesta de validación del token:", JSON.stringify(validateTokenBody));

        if (validateTokenBody.statusCode !== 200) {
            const parsedBody =
                typeof validateTokenBody.body === 'string'
                    ? JSON.parse(validateTokenBody.body)
                    : validateTokenBody.body;

            console.error("Error en la validación del token:", parsedBody.error || "Token inválido");
            return {
                statusCode: validateTokenBody.statusCode,
                body: JSON.stringify({ error: parsedBody.error || 'Token inválido' }),
            };
        }

        console.log("Token validado correctamente.");

        // Consulta en DynamoDB usando el índice secundario local (LSI)
        console.log("Consultando reservas para tenant_id:", tenant_id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXLSI1_RESERVATIONS, // Usar el índice LSI
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
            },
        };
        console.log("Parámetros de consulta en DynamoDB:", JSON.stringify(params));

        const reservationsResult = await dynamoDb.query(params).promise();

        if (!reservationsResult.Items || reservationsResult.Items.length === 0) {
            console.warn("No se encontraron reservas para tenant_id:", tenant_id);
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No se encontraron reservas para este tenant_id' }),
            };
        }

        console.log("Reservas encontradas:", JSON.stringify(reservationsResult.Items));

        // Preparar respuesta
        return {
            statusCode: 200,
            body: JSON.stringify({ reservations: reservationsResult.Items }),
        };
    } catch (error) {
        console.error('Error interno en getReservationByTenantId:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message,
            }),
        };
    }
};
