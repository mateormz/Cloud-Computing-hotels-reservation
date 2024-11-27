const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

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

        // Consultar la reserva en DynamoDB usando GSI (por user_id y start_date)
        console.log(`Consultando reserva en DynamoDB para tenant_id: ${tenant_id}, reservation_id: ${reservation_id}`);

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXGSI1_RESERVATIONS, // Usar el GSI
            KeyConditionExpression: "user_id = :user_id AND start_date = :start_date",
            ExpressionAttributeValues: {
                ":user_id": tenant_id, // Usar tenant_id como user_id
                ":start_date": "2024-12-01T00:00:00", // Ejemplo de fecha
            },
        };

        const reservationResponse = await dynamoDb.query(params).promise();

        if (!reservationResponse.Items || reservationResponse.Items.length === 0) {
            console.warn(`Reserva no encontrada para tenant_id: ${tenant_id}, reservation_id: ${reservation_id}`);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Reserva no encontrada' }),
            };
        }

        console.log("Reserva encontrada:", JSON.stringify(reservationResponse.Items[0]));

        return {
            statusCode: 200,
            body: JSON.stringify(reservationResponse.Items[0]),
        };
    } catch (error) {
        console.error('Error interno en getReservationById:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message,
            }),
        };
    }
};
