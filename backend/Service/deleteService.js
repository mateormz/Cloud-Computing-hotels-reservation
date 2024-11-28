const AWS = require("aws-sdk");

exports.handler = async (event) => {
    try {
        console.log("Evento recibido:", event);

        // Verificar token en la cabecera Authorization
        const token = event.headers?.Authorization;
        if (!token) {
            console.log("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: { error: "Token no proporcionado" },
            };
        }

        // Obtener tenant_id y service_id de path
        const { tenant_id, service_id } = event.path;

        if (!tenant_id || !service_id) {
            console.log("Error: Faltan parámetros requeridos.");
            return {
                statusCode: 400,
                body: { error: "Faltan parámetros requeridos: tenant_id o service_id" },
            };
        }

        // Invocar la validación del token
        const validateTokenLambdaName = `user-api-${process.env.STAGE}-hotel_validateUserToken`;
        const lambdaClient = new AWS.Lambda();

        const validateTokenResponse = await lambdaClient
            .invoke({
                FunctionName: validateTokenLambdaName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({ body: { token, tenant_id } }),
            })
            .promise();

        const tokenResponsePayload = JSON.parse(validateTokenResponse.Payload.toString());
        if (tokenResponsePayload.statusCode === 403) {
            return {
                statusCode: 403,
                body: { error: "Acceso no autorizado - Token inválido o expirado" },
            };
        }

        // Verificar existencia del servicio en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_SERVICES;

        const getParams = {
            TableName: tableName,
            Key: {
                tenant_id: tenant_id,
                service_id: service_id,
            },
        };

        const service = await dynamodb.get(getParams).promise();

        // Si no se encuentra el servicio
        if (!service.Item) {
            return {
                statusCode: 404,
                body: { error: `Servicio con ID '${service_id}' no encontrado para el tenant '${tenant_id}'` },
            };
        }

        // Eliminar el servicio de DynamoDB
        await dynamodb.delete(getParams).promise();

        console.log(`Servicio con ID '${service_id}' eliminado con éxito.`);

        return {
            statusCode: 200,
            body: { message: `Servicio con ID '${service_id}' eliminado con éxito` },
        };
    } catch (error) {
        console.error("Error en deleteService:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};