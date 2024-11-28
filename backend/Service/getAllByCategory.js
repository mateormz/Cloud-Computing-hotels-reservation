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

        // Obtener tenant_id y service_category desde pathParameters
        const { tenant_id, service_category } = event.pathParameters; // Acceder correctamente a pathParameters

        if (!tenant_id || !service_category) {
            console.log("Error: Faltan parámetros requeridos: tenant_id o service_category");
            return {
                statusCode: 400,
                body: { error: "Faltan parámetros: tenant_id o service_category" },
            };
        }

        // Invocar la validación del token (acceso autorizado)
        const validateTokenLambdaName = `user-api-${process.env.STAGE}-hotel_validateUserToken`;
        const lambdaClient = new AWS.Lambda();

        const validateTokenResponse = await lambdaClient
            .invoke({
                FunctionName: validateTokenLambdaName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({ body: { token, tenant_id } }), // Convertimos el objeto a JSON solo para la invocación
            })
            .promise();

        const tokenResponsePayload = JSON.parse(validateTokenResponse.Payload.toString());
        if (tokenResponsePayload.statusCode === 403) {
            return {
                statusCode: 403,
                body: { error: "Acceso no autorizado - Token inválido o expirado" },
            };
        }

        // Realizar la consulta para obtener todos los servicios del tenant_id y la service_category
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_SERVICES;

        const queryParams = {
            TableName: tableName,
            IndexName: process.env.INDEXGSI1_SERVICES, // Asegúrate de que este es el índice correcto (GSI)
            KeyConditionExpression: "service_category = :service_category", // Usamos solo service_category
            FilterExpression: "tenant_id = :tenant_id", // Filtramos por tenant_id
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
                ":service_category": service_category,
            },
        };

        const result = await dynamodb.query(queryParams).promise();

        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: { error: `No se encontraron servicios en la categoría '${service_category}' para el tenant '${tenant_id}'` },
            };
        }

        return {
            statusCode: 200,
            body: {
                message: `Servicios encontrados para la categoría '${service_category}' del tenant '${tenant_id}'`,
                services: result.Items,
            },
        };
    } catch (error) {
        console.error("Error en service_getAllByCategory:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};