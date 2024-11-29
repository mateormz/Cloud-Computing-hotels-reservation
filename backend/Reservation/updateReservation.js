const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.updateReservation = async (event) => {
    try {
        // Log del evento recibido
        console.log("Evento recibido:", JSON.stringify(event));

        // Extraer tenant_id y reservation_id desde pathParameters
        const tenant_id = event.path?.tenant_id;
        const reservation_id = event.path?.reservation_id;

        // Validar si los parámetros están presentes
        if (!tenant_id || !reservation_id) {
            console.error("Error: tenant_id o reservation_id no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'tenant_id o reservation_id no proporcionado' }),
            };
        }

        console.log("Parámetros extraídos: tenant_id =", tenant_id, ", reservation_id =", reservation_id);

        // Verificar si el cuerpo de la solicitud es un objeto o una cadena
        let updates;
        if (typeof event.body === "string") {
            updates = JSON.parse(event.body); // Si es un string, parseamos
        } else {
            updates = event.body; // Si ya es un objeto, lo usamos directamente
        }

        // Preparar la expresión de actualización
        const updateExpression = "SET " + Object.keys(updates).map((key) => `${key} = :${key}`).join(", ");
        const expressionValues = Object.fromEntries(Object.keys(updates).map((key) => [`:${key}`, updates[key]]));

        // Definir parámetros para la actualización en DynamoDB
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Key: {
                tenant_id: tenant_id,
                reservation_id: reservation_id,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: "ALL_NEW", // Obtener los atributos actualizados
        };

        // Realizar la actualización en la base de datos
        const result = await dynamoDb.update(params).promise();

        console.log("Reserva actualizada:", JSON.stringify(result.Attributes));

        // Responder con éxito
        return {
            statusCode: 200,
            body: {
                message: 'Reserva actualizada con éxito',
                reservation: result.Attributes,
            },
        };

    } catch (error) {
        // Manejo de errores
        console.error("Error interno en updateReservation:", error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message,
            }, // Aquí tampoco se usa JSON.stringify
        };
    }

};
