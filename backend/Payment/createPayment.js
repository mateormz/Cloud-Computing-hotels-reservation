const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const uuid = require('uuid');
const moment = require('moment');

exports.createPayment = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event));

        // Extraer token y tenant_id
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }
        
        const tenant_id = event.body?.tenant_id;
        const reservation_id = event.body?.reservation_id;
        const user_id = event.body?.user_id;
        const service_ids = event.body?.service_ids || [];

        // Validar datos
        if (!tenant_id || !reservation_id || !user_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'tenant_id, reservation_id, y user_id son requeridos' }),
            };
        }

        // Validar token
        const validateTokenResponse = await validateToken(token, tenant_id);
        if (validateTokenResponse.statusCode !== 200) {
            return validateTokenResponse;
        }

        // Obtener la reserva
        const reservation = await getReservationById(reservation_id, tenant_id);
        if (!reservation) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Reserva no encontrada' }),
            };
        }

        // Obtener la habitación asociada a la reserva
        const room = await getRoomById(reservation.room_id, tenant_id);
        if (!room) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Habitación no encontrada' }),
            };
        }

        // Calcular el monto (suma de la habitación y los servicios)
        let totalAmount = parseFloat(room.price_per_night);

        for (const service_id of service_ids) {
            const service = await getServiceById(service_id, tenant_id);
            if (service) {
                totalAmount += parseFloat(service.price);
            }
        }

        // Crear el pago
        const payment_id = uuid.v4();
        const payment = {
            payment_id,
            tenant_id,
            reservation_id,
            user_id,
            amount: totalAmount.toFixed(2),
            created_at: moment().toISOString(),
        };

        // Insertar el pago en DynamoDB
        const params = {
            TableName: process.env.TABLE_PAYMENTS,
            Item: payment,
        };
        await dynamoDb.put(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Pago creado con éxito', payment }),
        };

    } catch (error) {
        console.error('Error en createPayment:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};

// Función para validar el token
async function validateToken(token, tenant_id) {
    const validateTokenFunctionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
    const payload = {
        body: {
            token: token,
            tenant_id: tenant_id,
        },
    };

    const response = await lambda.invoke({
        FunctionName: validateTokenFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
    }).promise();

    return JSON.parse(response.Payload);
}

// Función para obtener la reserva
async function getReservationById(reservation_id, tenant_id) {
    const params = {
        TableName: process.env.TABLE_RESERVATIONS,
        Key: { tenant_id, reservation_id },
    };

    const result = await dynamoDb.get(params).promise();
    return result.Item;
}

// Función para obtener la habitación
async function getRoomById(room_id, tenant_id) {
    const params = {
        TableName: process.env.TABLE_ROOMS,
        Key: { tenant_id, room_id },
    };

    const result = await dynamoDb.get(params).promise();
    return result.Item;
}

// Función para obtener el servicio
async function getServiceById(service_id, tenant_id) {
    const params = {
        TableName: process.env.TABLE_SERVICES,
        Key: { tenant_id, service_id },
    };

    const result = await dynamoDb.get(params).promise();
    return result.Item;
}
