const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

exports.getReservationById = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event)); // Log del evento completo

        // Extraer tenant_id y reservation_id desde pathParameters
        const tenant_id = event.path?.tenant_id;
        const reservation_id = event.path?.reservation_id;

        if (!tenant_id || !reservation_id) {
            console.error("Error: tenant_id o reservation_id no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'tenant_id o reservation_id no proporcionado' }),
            };
        }

        console.log("Parámetros extraídos: tenant_id =", tenant_id, ", reservation_id =", reservation_id);

        // Validación del token
        const token = event.headers?.Authorization;
        if (!token) {
            console.error("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        console.log("Validando token para tenant_id:", tenant_id);

        // Llamar a la función Lambda para validar el token
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

        // Consultar la reserva en DynamoDB por tenant_id y reservation_id
        console.log(`Consultando reserva en DynamoDB para tenant_id: ${tenant_id}, reservation_id: ${reservation_id}`);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Key: {
                tenant_id: tenant_id,
                reservation_id: reservation_id,
            },
        };

        const reservationResponse = await dynamoDb.get(params).promise();

        // Si no encontramos la reserva con la clave primaria, usamos el GSI
        if (!reservationResponse.Item) {
            console.warn(`Reserva no encontrada para tenant_id: ${tenant_id}, reservation_id: ${reservation_id}`);
            console.log("Buscando la reserva usando GSI...");

            // Parámetros de consulta usando GSI (por ejemplo, usando user_id y start_date)
            const gsiParams = {
                TableName: process.env.TABLE_RESERVATIONS,
                IndexName: process.env.INDEXGSI1_RESERVATIONS,  // Usamos el GSI
                KeyConditionExpression: "tenant_id = :tenant_id AND reservation_id = :reservation_id",
                ExpressionAttributeValues: {
                    ":tenant_id": tenant_id,
                    ":reservation_id": reservation_id,
                },
            };

            const gsiResponse = await dynamoDb.query(gsiParams).promise();

            if (!gsiResponse.Items || gsiResponse.Items.length === 0) {
                console.error("Reserva no encontrada usando GSI.");
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'Reserva no encontrada' }),
                };
            }

            console.log("Reserva encontrada usando GSI:", JSON.stringify(gsiResponse.Items[0]));
            return {
                statusCode: 200,
                body: JSON.stringify(gsiResponse.Items[0]),  // Respuesta usando GSI
            };
        }

        console.log("Reserva encontrada:", JSON.stringify(reservationResponse.Item));

        // Convertir valores Decimal a números si existen
        const reservation = reservationResponse.Item;
        for (const key in reservation) {
            if (reservation[key]?.constructor?.name === 'Decimal') {
                reservation[key] = Number(reservation[key]);
            }
        }

        // Preparar respuesta
        return {
            statusCode: 200,
            body: reservation, // Respuesta directa como objeto JSON
        };

    } catch (error) {
        console.error("Error interno en getReservationById:", error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message,
            }, // Respuesta como objeto JSON
        };
    }

};
