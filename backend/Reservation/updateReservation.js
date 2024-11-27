const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.updateReservation = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event)); // Log del evento completo

        // Extraer tenant_id, reservation_id desde pathParameters y los updates desde el body
        const tenant_id = event.pathParameters?.tenant_id;
        const reservation_id = event.pathParameters?.reservation_id;
        const updates = JSON.parse(event.body);

        if (!tenant_id || !reservation_id) {
            console.error("Error: tenant_id o reservation_id no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'tenant_id o reservation_id no proporcionado' }),
            };
        }

        console.log("Parámetros extraídos: tenant_id =", tenant_id, ", reservation_id =", reservation_id);

        // Construir la expresión de actualización
        let updateExpression = "SET ";
        const expressionValues = {};
        Object.keys(updates).forEach((key, index) => {
            updateExpression += `${key} = :${key}`;
            if (index < Object.keys(updates).length - 1) {
                updateExpression += ", ";
            }
            expressionValues[`:${key}`] = updates[key];
        });

        // Configurar la tabla de DynamoDB y realizar la actualización
        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Key: {
                tenant_id: tenant_id,
                reservation_id: reservation_id,
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionValues,
            ReturnValues: "ALL_NEW"
        };

        const result = await dynamoDb.update(params).promise();

        // Verificar si la reserva fue actualizada correctamente
        if (!result.Attributes) {
            console.warn(`Reserva no encontrada o no se pudo actualizar para tenant_id: ${tenant_id}, reservation_id: ${reservation_id}`);
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Reserva no encontrada o no se pudo actualizar' }),
            };
        }

        console.log("Reserva actualizada con éxito:", result.Attributes);

// Respuesta de éxito
        return {
            statusCode: 200,
            body: {
                message: 'Reserva actualizada con éxito',
                reservation: result.Attributes
            },
        };

// Respuesta de error
    } catch (error) {
        console.error("Error interno en updateReservation:", error);
        return {
            statusCode: 500,
            body: {
                error: 'Error interno del servidor',
                details: error.message
            }
        };
    }

};
