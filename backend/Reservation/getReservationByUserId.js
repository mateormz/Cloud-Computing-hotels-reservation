const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.getReservationByUserId = async (event) => {
    try {
        console.log("Evento recibido:", event); // Log del evento completo

        // Validación de token
        const token = event.headers?.Authorization;
        if (!token) {
            console.error("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }, // Respuesta como objeto
            };
        }

        // Extraer user_id desde el path
        const user_id = event.path?.user_id;
        if (!user_id) {
            console.error("Error: user_id no proporcionado en la ruta.");
            return {
                statusCode: 400,
                body: { error: 'El user_id es obligatorio y no se proporcionó en la ruta' }, // Respuesta como objeto
            };
        }

        console.log("Validando token para user_id:", user_id);

        // Llamar a la función de validación del token
        const validateTokenFunctionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const tokenPayload = {
            body: {
                token: token,
                user_id: user_id,
            },
        };
        console.log("Payload enviado para validar token:", tokenPayload);

        const validateTokenResponse = await lambda
            .invoke({
                FunctionName: validateTokenFunctionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(tokenPayload),
            })
            .promise();

        const validateTokenBody = JSON.parse(validateTokenResponse.Payload);
        console.log("Respuesta de validación del token:", validateTokenBody);

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

        // Consulta en DynamoDB usando el índice global secundario (GSI)
        console.log("Consultando reservas para user_id:", user_id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXGSI1_RESERVATIONS, // Usar el índice GSI
            KeyConditionExpression: "user_id = :user_id",
            ExpressionAttributeValues: {
                ":user_id": user_id,
            },
        };
        console.log("Parámetros de consulta en DynamoDB:", params);

        const reservationsResult = await dynamoDb.query(params).promise();

        if (!reservationsResult.Items || reservationsResult.Items.length === 0) {
            console.warn("No se encontraron reservas para user_id:", user_id);
            return {
                statusCode: 404,
                body: { message: 'No se encontraron reservas para este user_id' }, // Respuesta como objeto
            };
        }

        console.log("Reservas encontradas:", reservationsResult.Items);

        // Preparar respuesta
        return {
            statusCode: 200,
            body: {
                reservations: reservationsResult.Items, // Respuesta como objeto
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