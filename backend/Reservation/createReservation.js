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

async function validateRoomAvailability(tenant_id, room_id) {
    const functionName = `${process.env.SERVICE_NAME_ROOM}-${process.env.STAGE}-hotel_validateRoomAvailability`;
    const payload = {
        body: { tenant_id, room_id }
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
        message: responseBody.body?.error || responseBody.body
    };
}

module.exports.createReservation = async (event) => {
    try {
        console.log("Evento recibido:", event);

        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log("Cuerpo del evento:", body);

        const { tenant_id, user_id, room_id, service_id, start_date, end_date } = body;

        // Validar campos requeridos
        if (!tenant_id || !user_id || !room_id || !service_id || !start_date || !end_date) {
            console.error("Campos requeridos faltantes");
            return {
                statusCode: 400,
                body: { error: 'Campos requeridos faltantes' }
            };
        }

        // Validar formato y lógica de las fechas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Fechas inválidas:", start_date, end_date);
            return {
                statusCode: 400,
                body: { error: 'Las fechas proporcionadas no son válidas' }
            };
        }

        if (startDate >= endDate) {
            console.error("La fecha de inicio es mayor o igual a la fecha de fin");
            return {
                statusCode: 400,
                body: { error: 'La fecha de inicio debe ser anterior a la fecha de fin' }
            };
        }

        // Validar token de usuario
        const token = event.headers.Authorization;
        if (!token) {
            console.error("Token no proporcionado");
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }
            };
        }

        console.log("Validando token...");
        const userValidation = await validateUserToken(token, tenant_id);
        if (!userValidation.success) {
            return {
                statusCode: userValidation.statusCode,
                body: userValidation.message
            };
        }

        // Validar disponibilidad de la habitación
        console.log("Validando disponibilidad de la habitación...");
        const roomValidation = await validateRoomAvailability(tenant_id, room_id);
        if (!roomValidation.success) {
            return {
                statusCode: 400,
                body: { error: 'La habitación no está disponible' }
            };
        }

        // Crear ID de la reserva basado en la lógica proporcionada
        const id = `${tenant_id}#${room_id}#${service_id}`;
        console.log("Creando reserva con ID:", id);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Item: {
                tenant_id,
                id,
                user_id,
                room_id,
                service_id,
                start_date,
                end_date,
                created_at: new Date().toISOString(),
                status: 'confirmed'
            }
        };

        // Guardar la reserva en DynamoDB
        await dynamoDb.put(params).promise();

        console.log("Reserva creada con éxito:", params.Item);
        return {
            statusCode: 200,
            body: {
                message: 'Reserva creada con éxito',
                reservation: params.Item
            }
        };
    } catch (error) {
        console.error("Error inesperado en createReservation:", error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
