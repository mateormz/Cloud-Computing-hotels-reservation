const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.createReservation = async (event) => {
    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { tenant_id, user_id, room_id, service_id, start_date, end_date } = body;

        // Validar campos requeridos
        if (!tenant_id || !user_id || !room_id || !start_date || !end_date) {
            return {
                statusCode: 400,
                body: { error: 'Campos requeridos faltantes' }
            };
        }

        // Validar formato de fechas
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

        // Validar token de usuario
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: { error: 'Token no proporcionado' }
            };
        }

        const userValidation = await validateUserToken(token, tenant_id);
        if (!userValidation.success) {
            return {
                statusCode: userValidation.statusCode,
                body: { error: userValidation.message }
            };
        }

        // Validar disponibilidad de la habitación
        const roomValidation = await validateRoomAvailability(tenant_id, room_id);
        if (!roomValidation.success) {
            return {
                statusCode: 400,
                body: { error: 'La habitación no está disponible' }
            };
        }

        // Crear la reserva
        const reservation_id = uuid.v4();
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

        return {
            statusCode: 200,
            body: {
                message: 'Reserva creada con éxito',
                reservation: params.Item
            }
        };
    } catch (error) {
        console.error('Error en createReservation:', {
            error,
            tenant_id: event.body?.tenant_id,
            user_id: event.body?.user_id,
            room_id: event.body?.room_id
        });
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
