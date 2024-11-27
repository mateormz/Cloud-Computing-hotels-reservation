module.exports.updateReservation = async (event) => {
    try {
        const { tenant_id, reservation_id } = event.pathParameters;
        const updates = event.body;

        if (!tenant_id || !reservation_id || !updates) {
            return {
                statusCode: 400,
                body: { error: 'tenant_id, reservation_id o datos de actualización faltantes' }
            };
        }

        const updateExpression = "SET " + Object.keys(updates).map((key) => `${key} = :${key}`).join(", ");
        const expressionAttributeValues = Object.keys(updates).reduce((acc, key) => {
            acc[`:${key}`] = updates[key];
            return acc;
        }, {});

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            Key: { tenant_id, reservation_id },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        };

        const result = await dynamoDb.update(params).promise();

        return {
            statusCode: 200,
            body: { message: 'Reserva actualizada con éxito', updatedItem: result.Attributes }
        };
    } catch (error) {
        console.error('Error en updateReservation:', error);
        return {
            statusCode: 500,
            body: { error: 'Error interno del servidor', details: error.message }
        };
    }
};
