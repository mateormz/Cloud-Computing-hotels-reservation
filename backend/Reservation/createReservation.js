const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports.createReservation = async (event) => {
    try {
        console.log("Evento recibido:", event);

        // Obtener el token del encabezado
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }
            };
        }

        // Parsear el cuerpo del evento
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log("Cuerpo del evento parseado:", body);

        const { tenant_id, user_id, room_id, service_id, start_date, end_date } = body;

        // Validar campos requeridos
        if (!tenant_id || !user_id || !room_id || !service_id || !start_date || !end_date) {
            return {
                statusCode: 400,
                body: { error: 'Campos requeridos faltantes' }
            };
        }

        // Validar formato y lógica de las fechas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                statusCode: 400,
                body: { error: 'Las fechas proporcionadas no son válidas' }
            };
        }

        if (startDate >= endDate) {
            return {
                statusCode: 400,
                body: { error: 'La fecha de inicio debe ser anterior a la fecha de fin' }
            };
        }

        console.log("Fechas validadas correctamente. start_date:", startDate, "end_date:", endDate);

        // Validar el token del usuario llamando a la Lambda correspondiente
        const validateTokenFunction = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        console.log("Llamando a la función de validación de token:", validateTokenFunction);

        const tokenPayload = {
            body: { token, tenant_id }
        };

        const tokenResponse = await lambda.invoke({
            FunctionName: validateTokenFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(tokenPayload),
        }).promise();

        const tokenResponseBody = JSON.parse(tokenResponse.Payload);

        if (tokenResponseBody.statusCode !== 200) {
            const parsedBody =
                typeof tokenResponseBody.body === 'string'
                    ? JSON.parse(tokenResponseBody.body)
                    : tokenResponseBody.body;

            return {
                statusCode: tokenResponseBody.statusCode,
                body: parsedBody
            };
        }

        console.log("Token validado correctamente.");

        // Llamar a la función `getRoomById` para verificar la existencia del `room_id`
        const getRoomFunction = `${process.env.SERVICE_NAME_ROOM}-${process.env.STAGE}-room_getById`;
        console.log("Llamando a la función getRoomById:", getRoomFunction);

        const roomPayload = {
            path: { tenant_id, room_id },
            headers: { Authorization: token }
        };

        const roomResponse = await lambda.invoke({
            FunctionName: getRoomFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(roomPayload),
        }).promise();

        const roomResponseBody = JSON.parse(roomResponse.Payload);

        if (roomResponseBody.statusCode !== 200) {
            console.error("Error al verificar room_id:", roomResponseBody.body);
            return {
                statusCode: roomResponseBody.statusCode,
                body: { error: 'La habitación no existe' }
            };
        }

        console.log("Room encontrado:", roomResponseBody.body);

        // Generar reservation_id único
        const reservation_id = uuidv4();
        console.log("reservation_id generado:", reservation_id);

        // Insertar la reserva en DynamoDB
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Item: {
                tenant_id,
                reservation_id,
                user_id,
                room_id,
                service_id,
                start_date,
                end_date,
                created_at: new Date().toISOString(),
                status: 'confirmed'
            }
        };

        console.log("Guardando la reserva en DynamoDB con parámetros:", params);

        await dynamoDb.put(params).promise();

        console.log("Reserva creada exitosamente:", params.Item);

        // Actualizar la disponibilidad de la habitación
        const toggleAvailabilityFunction = `${process.env.SERVICE_NAME_ROOM}-${process.env.STAGE}-room_toggleAvailability`;
        const togglePayload = {
            path: { tenant_id, room_id },
            headers: { Authorization: token }
        };

        const toggleResponse = await lambda.invoke({
            FunctionName: toggleAvailabilityFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(togglePayload),
        }).promise();

        const toggleResponseBody = JSON.parse(toggleResponse.Payload);

        if (toggleResponseBody.statusCode !== 200) {
            console.error("Error al actualizar disponibilidad de la habitación:", toggleResponseBody.body);
            return {
                statusCode: 500,
                body: { error: 'Reserva creada, pero fallo al actualizar la disponibilidad de la habitación.' }
            };
        }

        console.log("Disponibilidad de la habitación actualizada exitosamente.");

        return {
            statusCode: 200,
            body: {
                message: 'Reserva creada con éxito y disponibilidad de la habitación actualizada.',
                reservation: params.Item
            }
        };
    } catch (error) {
        console.error('Error en createReservation:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
