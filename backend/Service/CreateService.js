const AWS = require('aws-sdk');

exports.handler = async (event) => {
    try {
        // Log del evento recibido
        console.log("Evento recibido:", JSON.stringify(event));

        // Validación del token
        const token = event.headers?.Authorization;
        console.log("Token recibido en Authorization Header:", token);

        if (!token) {
            console.log("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token no proporcionado' }),
            };
        }

        const functionName = `${process.env.SERVICE_NAME}-${process.env.STAGE}-hotel_validateUserToken`;
        console.log("Nombre de la función de validación de token:", functionName);

        const tenantId = JSON.parse(event.body).tenant_id;
        const payload = {
            body: {
                token,
                tenant_id: tenantId,
            },
        };

        const lambdaClient = new AWS.Lambda();
        const validateTokenResponse = await lambdaClient
            .invoke({
                FunctionName: functionName,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify(payload),
            })
            .promise();

        const tokenResponsePayload = JSON.parse(validateTokenResponse.Payload);
        console.log("Respuesta de validateUserToken:", tokenResponsePayload);

        if (tokenResponsePayload.statusCode === 403) {
            console.log("Error: Token inválido o expirado.");
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Acceso no autorizado - Token inválido o expirado' }),
            };
        }

        // Token válido, continuar con la creación del servicio
        const { tenant_id, servicio_nombre, descripcion, precio } = JSON.parse(event.body);

        if (!tenant_id || !servicio_nombre || !descripcion || !precio) {
            console.log("Error: Faltan campos requeridos.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Faltan campos requeridos: tenant_id, servicio_nombre, descripcion o precio' }),
            };
        }

        // Conectar con DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_NAME_SERVICIOS;
        console.log("Nombre de la tabla DynamoDB:", tableName);

        // Registrar el servicio
        await dynamodb
            .put({
                TableName: tableName,
                Item: {
                    tenant_id,
                    servicio_nombre,
                    descripcion,
                    precio,
                },
            })
            .promise();

        console.log("Servicio creado con éxito:", servicio_nombre);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Servicio creado con éxito', servicio_nombre }),
        };
    } catch (error) {
        console.error("Error inesperado:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
        };
    }
};
