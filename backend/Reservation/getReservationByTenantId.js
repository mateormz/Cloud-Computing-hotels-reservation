module.exports.getReservationsByTenantId = async (event) => {
    try {
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' })
            };
        }

        const { tenant_id } = event.pathParameters;

        const functionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;
        const payload = {
            body: { token, tenant_id }
        };

        const tokenResponse = await lambda.invoke({
            FunctionName: functionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(payload),
        }).promise();

        const responseBody = JSON.parse(tokenResponse.Payload);
        if (responseBody.statusCode !== 200) {
            return {
                statusCode: responseBody.statusCode,
                body: responseBody.body
            };
        }

        const params = {
            TableName: process.env.TABLE_RESERVATIONS,
            IndexName: process.env.INDEXLSI1_RESERVATIONS, // Usamos el índice local
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: { ":tenant_id": tenant_id }
        };

        const result = await dynamoDb.query(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ reservations: result.Items })
        };
    } catch (error) {
        console.error('Error en getReservationsByTenantId:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message })
        };
    }
};
