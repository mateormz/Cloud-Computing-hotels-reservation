const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.TABLE_RESERVATIONS;
const validateTokenFunctionName = `${process.env.SERVICE_NAME_USER}-${process.env.STAGE}-hotel_validateUserToken`;

exports.getReservationById = async (event) => {
    try {
        // Extraer tenant_id y reservation_id de los pathParameters
        const { tenant_id, reservation_id } = event.pathParameters;

        if (!tenant_id || !reservation_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'tenant_id o reservation_id no proporcionado' }),
            };
        }

        // Validación de token
        const token = event.headers.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        // Llamar a la función Lambda para validar el token
        const lambda = new AWS.Lambda();
        const validateTokenPayload = {
            body: {
                token: token,
                tenant_id: tenant_id,
            },
        };

        const validateTokenResponse = await lambda
            .invoke({
                FunctionName: validateTokenFunctionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(validateTokenPayload),
            })
            .promise();

        const validateTokenResult = JSON.parse(validateTokenResponse.Payload);

        if (validateTokenResult.statusCode !== 200) {
            return {
                statusCode: validateTokenResult.statusCode,
                body: validateTokenResult.body,
            };
        }

        // Token válido, proceder a buscar la reserva
        const reservationResponse = await dynamoDb
            .get({
                TableName: tableName,
                Key: {
                    tenant_id: tenant_id,
                    reservation_id: reservation_id,
                },
            })
            .promise();

        if (!reservationResponse.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Reserva no encontrada' }),
            };
        }

        // Convertir valores de tipo Decimal a números si es necesario
        const reservation = reservationResponse.Item;
        for (const key in reservation) {
            if (reservation[key]?.constructor?.name === 'Decimal') {
                reservation[key] = Number(reservation[key]);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(reservation),
        };
    } catch (error) {
        console.error('Error interno del servidor:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
