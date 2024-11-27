const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

module.exports.createReservation = async (event) => {
    try {
        // Obtener el token del encabezado
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' })
            };
        }

        // Parsear el cuerpo del evento
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { tenant_id, user_id, room_id, service_id, start_date, end_date } = body;

        // Validar campos requeridos
        if (!tenant_id || !user_id || !room_id || !service_id || !start_date || !end_date) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Campos requeridos faltantes' })
            };
        }

        // Validar formato y lógica de las fechas
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Las fechas proporcionadas no son válidas' })
            };
        }

        if (startDate >= endDate) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' })
            };
        }

        // Validar el token del usuario llamando a la Lambda correspondiente
        const functionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const payload = {
            body: JSON.stringify({ token, tenant_id })
        };

        const tokenResponse = await lambda.invoke({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload),
        }).promise();

        const responseBody = JSON.parse(tokenResponse.Payload);
        if (responseBody.statusCode !== 200) {
            const parsedBody =
                typeof responseBody.body === 'string'
                    ? JSON.parse(responseBody.body)
                    : responseBody.body;

            return {
                statusCode: responseBody.statusCode,
                body: JSON.stringify({ error: parsedBody.error || 'Token inválido' })
            };
        }

        const parsedResponse =
            typeof responseBody.body === 'string'
                ? JSON.parse(responseBody.body)
                : responseBody.body;

        console.log(`Token válido. Usuario autenticado: ${parsedResponse.user_id}`);

        // Crear la ID de la reserva
        const id = `${tenant_id}#${room_id}#${service_id}`;

        // Insertar la reserva en DynamoDB
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

        await dynamoDb.put(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reserva creada con éxito',
                reservation: params.Item
            })
        };
    } catch (error) {
        console.error('Error en createReservation:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
