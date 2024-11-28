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

        // Obtener tenant_id desde pathParameters
        const { tenant_id } = event.pathParameters;

        if (!tenant_id) {
            console.log("Error: Faltan parámetros requeridos: tenant_id");
            return {
                statusCode: 400,
                body: { error: "Falta el parámetro: tenant_id" },
            };
        }

        // Invocar la validación del token (acceso autorizado)
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

        // Realizar la consulta para obtener todos los servicios del tenant_id
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_SERVICES;

        const queryParams = {
            TableName: tableName,
            IndexName: process.env.INDEXLSI1_SERVICES, // Asegúrate de tener un índice secundario en tenant_id si es necesario
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
            },
        };

        const result = await dynamodb.query(queryParams).promise();

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: { error: `No se encontraron servicios para el tenant '${tenant_id}'` },
            };
        }

        return {
            statusCode: 200,
            body: {
                message: `Servicios encontrados para el tenant '${tenant_id}'`,
                services: result.Items,
            },
        };
    } catch (error) {
        console.error("Error en getAllServicesByTenant:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};