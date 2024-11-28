const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const { v4: uuidv4 } = require('uuid');

module.exports.createPayment = async (event) => {
    try {
        console.log("Evento recibido:", event);

        // Obtener el token de autorización
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

        const { tenant_id, user_id, reservation_id } = body;

        // Validar campos requeridos
        if (!tenant_id || !user_id || !reservation_id) {
            return {
                statusCode: 400,
                body: { error: 'Campos requeridos faltantes' }
            };
        }

        // Validar el token llamando a la función lambda correspondiente
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

        console.log("Token validado correctamente.");

        // Obtener la reserva usando getReservationById
        const reservationFunction = `${process.env.SERVICE_NAME_RESERVATION}-${process.env.STAGE}-reservation_getById`;
        const reservationPayload = {
            path: { tenant_id, reservation_id },
            headers: { Authorization: token }
        };

        const reservationResponse = await lambda.invoke({
            FunctionName: reservationFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(reservationPayload)
        }).promise();

        const reservationData = JSON.parse(reservationResponse.Payload);
        if (reservationData.statusCode !== 200) {
            return {
                statusCode: reservationData.statusCode,
                body: { error: 'No se pudo obtener la reserva' }
            };
        }

        console.log("Reserva obtenida correctamente:", reservationData.body);

        const room_id = reservationData.body.room_id;
        const service_ids = reservationData.body.service_ids;

        // Obtener información de la habitación usando getRoomById
        const roomFunction = `${process.env.SERVICE_NAME_ROOM}-${process.env.STAGE}-room_getById`;
        const roomPayload = {
            path: { tenant_id, room_id },
            headers: { Authorization: token }
        };

        const roomResponse = await lambda.invoke({
            FunctionName: roomFunction,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(roomPayload)
        }).promise();

        const roomData = JSON.parse(roomResponse.Payload);
        if (roomData.statusCode !== 200) {
            return {
                statusCode: roomData.statusCode,
                body: { error: 'No se pudo obtener la información de la habitación' }
            };
        }

        console.log("Habitación obtenida correctamente:", roomData.body);

        const price_per_night = parseFloat(roomData.body.price_per_night);
        if (isNaN(price_per_night)) {
            return {
                statusCode: 400,
                body: { error: 'Precio de la habitación no válido' }
            };
        }

        // Calcular el monto sumando el precio por noche de la habitación
        let totalAmount = price_per_night;

        // Obtener los precios de los servicios usando getServiceById
        for (const service_id of service_ids) {
            const serviceFunction = `${process.env.SERVICE_NAME_SERVICE}-${process.env.STAGE}-service_getById`;
            const servicePayload = {
                path: { tenant_id, service_id },
                headers: { Authorization: token }
            };

            const serviceResponse = await lambda.invoke({
                FunctionName: serviceFunction,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(servicePayload)
            }).promise();

            const serviceData = JSON.parse(serviceResponse.Payload);
            if (serviceData.statusCode !== 200) {
                return {
                    statusCode: serviceData.statusCode,
                    body: { error: `No se pudo obtener el servicio con id: ${service_id}` }
                };
            }

            console.log("Servicio obtenido correctamente:", serviceData.body);

            const service_price = parseFloat(serviceData.body.price);
            if (isNaN(service_price)) {
                return {
                    statusCode: 400,
                    body: { error: `Precio del servicio ${service_id} no válido` }
                };
            }

            // Sumar el precio del servicio al total
            totalAmount += service_price;
        }

        console.log("Monto total calculado:", totalAmount);

        // Generar payment_id único
        const payment_id = uuidv4();

        // Crear el pago en DynamoDB
        const paymentParams = {
            TableName: process.env.TABLE_PAYMENTS,
            Item: {
                tenant_id,
                payment_id,
                user_id,
                reservation_id,
                monto_pago: totalAmount.toFixed(2), // Guardar el monto con dos decimales
                created_at: new Date().toISOString(),
                status: 'completed'
            }
        };

        await dynamoDb.put(paymentParams).promise();

        console.log("Pago creado exitosamente:", paymentParams.Item);

        return {
            statusCode: 200,
            body: {
                message: 'Pago creado con éxito',
                payment: paymentParams.Item
            }
        };
    } catch (error) {
        console.error('Error al crear el pago:', error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message
            }
        };
    }
};
