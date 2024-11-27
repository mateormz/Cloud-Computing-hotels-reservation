const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); // Usamos uuid para generar un reservation_id único

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
                body: { error: 'Token no proporcionado' } // Manteniendo JSON
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
                body: { error: 'Campos requeridos faltantes' } // Manteniendo JSON
            };
        }

        console.log("Campos validados correctamente. tenant_id:", tenant_id);

        // Validar formato y lógica de las fechas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                statusCode: 400,
                body: { error: 'Las fechas proporcionadas no son válidas' } // Manteniendo JSON
            };
        }

        if (startDate >= endDate) {
            return {
                statusCode: 400,
                body: { error: 'La fecha de inicio debe ser anterior a la fecha de fin' } // Manteniendo JSON
            };
        }

        console.log("Fechas validadas correctamente. start_date:", startDate, "end_date:", endDate);

        // Validar el token del usuario llamando a la Lambda correspondiente
        const functionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        console.log("Llamando a la función de validación de token:", functionName);

        const payload = {
            body: { token, tenant_id } // No convertir a string
        };

        const tokenResponse = await lambda.invoke({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload), // Solo aquí se convierte porque AWS Lambda espera una string
        }).promise();

        const responseBody = JSON.parse(tokenResponse.Payload);

        if (responseBody.statusCode !== 200) {
            const parsedBody =
                typeof responseBody.body === 'string'
                    ? JSON.parse(responseBody.body)
                    : responseBody.body;

            return {
                statusCode: responseBody.statusCode,
                body: parsedBody // Retornar JSON directamente
            };
        }

        const parsedResponse =
            typeof responseBody.body === 'string'
                ? JSON.parse(responseBody.body)
                : responseBody.body;

        console.log(`Token válido. Usuario autenticado: ${parsedResponse.user_id}`);

        // Generar reservation_id único
        const reservation_id = uuidv4();
        console.log("reservation_id generado:", reservation_id);

        // Insertar la reserva en DynamoDB
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Item: {
                tenant_id,
                reservation_id, // Añadir reservation_id único
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

        return {
            statusCode: 200,
            body: {
                message: 'Reserva creada con éxito',
                reservation: params.Item // Retornar JSON directamente
            }
        };
    } catch (error) {
        console.error('Error en createReservation:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message } // Manteniendo JSON
        };
    }
};
