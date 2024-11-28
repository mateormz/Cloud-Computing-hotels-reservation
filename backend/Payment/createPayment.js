const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { Decimal } = require('aws-sdk/clients/dynamodb');

module.exports.createPayment = async (event) => {
    try {
        const token = event.headers.Authorization;
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        const { tenant_id, user_id, reservation_id } = body;

        if (!token || !tenant_id || !user_id || !reservation_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token, tenant_id, user_id o reservation_id no proporcionado' })
            };
        }

        // Validar el token
        const validateTokenFunction = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const tokenPayload = { body: { token, tenant_id } };
        const tokenResponse = await lambda.invoke({
            FunctionName: validateTokenFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(tokenPayload)
        }).promise();

        const tokenResponseBody = JSON.parse(tokenResponse.Payload);
        if (tokenResponseBody.statusCode !== 200) {
            return {
                statusCode: tokenResponseBody.statusCode,
                body: tokenResponseBody.body
            };
        }

        // 1. Obtener la reserva con getReservationById
        const getReservationFunction = `${process.env.SERVICE_NAME_RESERVATION}-${process.env.STAGE}-getReservationById`;
        const reservationPayload = { path: { tenant_id, reservation_id } };
        const reservationResponse = await lambda.invoke({
            FunctionName: getReservationFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(reservationPayload)
        }).promise();

        const reservation = JSON.parse(reservationResponse.Payload);

        if (reservation.statusCode !== 200) {
            return {
                statusCode: reservation.statusCode,
                body: reservation.body
            };
        }

        // 2. Obtener los detalles de la habitación con getRoomById
        const room_id = reservation.body.room_id; // De la respuesta de la reserva
        const getRoomFunction = `${process.env.SERVICE_NAME_ROOM}-${process.env.STAGE}-room_getById`;
        const roomPayload = { path: { tenant_id, room_id } };
        const roomResponse = await lambda.invoke({
            FunctionName: getRoomFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(roomPayload)
        }).promise();

        const room = JSON.parse(roomResponse.Payload);

        if (room.statusCode !== 200) {
            return {
                statusCode: room.statusCode,
                body: room.body
            };
        }

        // 3. Sumar el precio de la habitación (price_per_night)
        let monto_pago = parseFloat(room.body.price_per_night);  // Convertir precio de la habitación a número

        // 4. Obtener el precio de los servicios asociados a la reserva
        const service_ids = reservation.body.service_ids;  // Lista de service_ids de la reserva
        if (service_ids && Array.isArray(service_ids)) {
            for (const service_id of service_ids) {
                const getServiceFunction = `${process.env.SERVICE_NAME_SERVICE}-${process.env.STAGE}-service_getById`;
                const servicePayload = { path: { tenant_id, service_id } };
                const serviceResponse = await lambda.invoke({
                    FunctionName: getServiceFunction,
                    InvocationType: 'RequestResponse',
                    Payload: JSON.stringify(servicePayload)
                }).promise();

                const service = JSON.parse(serviceResponse.Payload);

                if (service.statusCode !== 200) {
                    return {
                        statusCode: service.statusCode,
                        body: service.body
                    };
                }

                // Sumar el precio del servicio al monto de pago
                monto_pago += parseFloat(service.body.price);  // Convertir precio de servicio a número
            }
        }

        // 5. Crear el pago en DynamoDB
        const payment_id = `${tenant_id}-${new Date().toISOString()}`;  // Un ID único para el pago (puedes cambiarlo si prefieres otro formato)

        const paymentParams = {
            TableName: process.env.TABLE_PAYMENTS,
            Item: {
                tenant_id,
                user_id,
                payment_id,
                reservation_id,
                monto_pago: monto_pago.toFixed(2),  // Guardamos el monto con 2 decimales
                status: 'completed',  // Estado actualizado a "completed"
                created_at: new Date().toISOString()
            }
        };

        // Guardar el pago en DynamoDB
        await dynamoDb.put(paymentParams).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Pago creado con éxito.',
                payment: paymentParams.Item
            })
        };

    } catch (error) {
        console.error('Error en createPayment:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
