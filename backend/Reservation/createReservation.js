const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.createReservation = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event));

        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        console.log("Cuerpo del evento:", body);

        const { tenant_id, user_id, room_id, service_id, start_date, end_date } = body;

        if (!tenant_id || !user_id || !room_id || !start_date || !end_date) {
            console.error("Campos requeridos faltantes");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Campos requeridos faltantes' })
            };
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Fechas inválidas:", start_date, end_date);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Las fechas proporcionadas no son válidas' })
            };
        }

        if (startDate >= endDate) {
            console.error("La fecha de inicio es mayor o igual a la fecha de fin");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' })
            };
        }

        const token = event.headers.Authorization;
        if (!token) {
            console.error("Token no proporcionado");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' })
            };
        }

        console.log("Validando token...");
        const userValidation = await validateUserToken(token, tenant_id);
        console.log("Resultado de validación de usuario:", userValidation);

        if (!userValidation.success) {
            return {
                statusCode: userValidation.statusCode,
                body: JSON.stringify({ error: userValidation.message })
            };
        }

        console.log("Validando disponibilidad de la habitación...");
        const roomValidation = await validateRoomAvailability(tenant_id, room_id);
        console.log("Resultado de validación de habitación:", roomValidation);

        if (!roomValidation.success) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'La habitación no está disponible' })
            };
        }

        const reservation_id = uuid.v4();
        console.log("Creando reserva con ID:", reservation_id);

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

        await dynamoDb.put(params).promise();

        console.log("Reserva creada con éxito:", params.Item);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reserva creada con éxito',
                reservation: params.Item
            })
        };
    } catch (error) {
        console.error("Error inesperado en createReservation:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
