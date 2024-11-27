const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.deleteReservation = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event)); // Log del evento completo

        // Extraer tenant_id y reservation_id desde pathParameters
        const tenant_id = event.path?.tenant_id;
        const reservation_id = event.path?.reservation_id;

        // Validar si los parámetros están presentes
        if (!tenant_id || !reservation_id) {
            console.error("Error: tenant_id o reservation_id no proporcionado.");
            return {
                statusCode: 400,
                body: {
                    error: 'tenant_id o reservation_id no proporcionado',
                }, // Directo como JSON
            };
        }

        console.log("Parámetros extraídos: tenant_id =", tenant_id, ", reservation_id =", reservation_id);

        // Definir parámetros para la eliminación en DynamoDB
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Key: {
                tenant_id: tenant_id,
                reservation_id: reservation_id,
            },
        };

        // Eliminar la reserva en la base de datos
        const result = await dynamoDb.delete(params).promise();

        console.log("Reserva eliminada:", result);

        // Responder con éxito
        return {
            statusCode: 200,
            body: {
                message: 'Reserva eliminada exitosamente',
            }, // Directo como JSON
        };
    } catch (error) {
        // Manejo de errores
        console.error("Error interno en deleteReservation:", error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message,
            }, // Directo como JSON
        };
    }
};
