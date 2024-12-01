const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.getReservationByUserId = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event)); // Log del evento completo

        // Validación de token
        const token = event.headers?.Authorization;
        if (!token) {
            console.error("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }, // Respuesta como objeto
            };
        }

        // Extraer tenant_id y user_id desde el path
        const tenant_id = event.path?.tenant_id;
        const user_id = event.path?.user_id;

        if (!tenant_id) {
            console.error("Error: tenant_id no proporcionado en la ruta.");
            return {
                statusCode: 400,
                body: { error: 'El tenant_id es obligatorio y no se proporcionó en la ruta' }, // Respuesta como objeto
            };
        }

        if (!user_id) {
            console.error("Error: user_id no proporcionado en la ruta.");
            return {
                statusCode: 400,
                body: { error: 'El user_id es obligatorio y no se proporcionó en la ruta' }, // Respuesta como objeto
            };
        }

        console.log("Validando token para tenant_id y user_id:", tenant_id, user_id);

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
                body: { error: parsedBody.error || 'Token inválido' }, // Respuesta como objeto
            };
        }

        console.log("Token validado correctamente.");

        // Escanear la tabla DynamoDB y filtrar manualmente por tenant_id y user_id
        console.log("Escaneando reservas para tenant_id y user_id:", tenant_id, user_id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
        };
        console.log("Parámetros de escaneo en DynamoDB:", JSON.stringify(params));

        const scanResult = await dynamoDb.scan(params).promise();

        if (!scanResult.Items || scanResult.Items.length === 0) {
            console.warn("No se encontraron reservas en la tabla.");
            return {
                statusCode: 404,
                body: { message: 'No se encontraron reservas para este tenant_id y user_id' }, // Respuesta como objeto
            };
        }

        // Filtrar las reservas por tenant_id y user_id
        const filteredReservations = scanResult.Items.filter(
            (item) => item.tenant_id === tenant_id && item.user_id === user_id
        );

        if (filteredReservations.length === 0) {
            console.warn("No se encontraron reservas después de filtrar por tenant_id y user_id.");
            return {
                statusCode: 404,
                body: { message: 'No se encontraron reservas para este tenant_id y user_id' }, // Respuesta como objeto
            };
        }

        console.log("Reservas encontradas después de filtrar:", filteredReservations);

        // Preparar respuesta
        return {
            statusCode: 200,
            body: {
                reservations: filteredReservations, // Respuesta como objeto
            },
        };
    } catch (error) {
        console.error('Error interno en getReservationByUserId:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message,
            }, // Respuesta como objeto
        };
    }
};