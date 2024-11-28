const AWS = require("aws-sdk");

exports.handler = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event));

        // Verificar token en la cabecera Authorization
        const token = event.headers?.Authorization;
        if (!token) {
            console.log("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Token no proporcionado" }),
            };
        }

        // Obtener tenant_id desde pathParameters
        const { tenant_id } = event.path;

        if (!tenant_id) {
            console.log("Error: Faltan parámetros requeridos: tenant_id");
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Falta el parámetro: tenant_id" }),
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
                body: JSON.stringify({ error: "Acceso no autorizado - Token inválido o expirado" }),
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
                body: JSON.stringify({ error: `No se encontraron servicios para el tenant '${tenant_id}'` }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Servicios encontrados para el tenant '${tenant_id}'`,
                services: result.Items,
            }),
        };
    } catch (error) {
        console.error("Error en getAllServicesByTenant:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno del servidor", details: error.message }),
        };
    }
};