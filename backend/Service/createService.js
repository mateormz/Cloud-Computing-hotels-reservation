const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid"); // Usamos UUID para generar un ID único

exports.handler = async (event) => {
    try {
        console.log("Evento recibido:", event);

        const token = event.headers?.Authorization;
        if (!token) {
            console.log("Error: Token no proporcionado.");
            return {
                statusCode: 400,
                body: { error: "Token no proporcionado" },
            };
        }

        let body;
        try {
            body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (error) {
            console.error("Error al parsear event.body:", event.body);
            return {
                statusCode: 400,
                body: { error: "El cuerpo de la solicitud no es un JSON válido." },
            };
        }

        const { tenant_id, service_category, service_name, descripcion, precio } = body;

        if (!tenant_id || !service_category || !service_name || !descripcion || !precio) {
            console.log("Error: Faltan campos requeridos.");
            return {
                statusCode: 400,
                body: {
                    error: "Faltan campos requeridos: tenant_id, service_category, service_name, descripcion o precio",
                },
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

        // Validar existencia del servicio por nombre dentro del tenant usando el LSI
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_SERVICES;
        const indexName = process.env.INDEXLSI1_SERVICES;

        const queryParams = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: "tenant_id = :tenant_id AND service_name = :service_name",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
                ":service_name": service_name,
            },
        };

        const queryResult = await dynamodb.query(queryParams).promise();
        console.log("Resultado de la consulta para validar existencia:", queryResult.Items);

        if (queryResult.Items && queryResult.Items.length > 0) {
            return {
                statusCode: 409, // Conflict
                body: {
                    error: `El servicio '${service_name}' ya existe para el tenant '${tenant_id}'`,
                },
            };
        }

        // Generar un service_id único
        const service_id = uuidv4();

        // Registrar el servicio en DynamoDB
        const putParams = {
            TableName: tableName,
            Item: {
                tenant_id,
                service_id, // Agregamos el ID único del servicio
                service_category,
                service_name,
                descripcion,
                precio: precio.toString(), // Convertir a string para DynamoDB
            },
        };

        await dynamodb.put(putParams).promise();
        console.log("Servicio creado con éxito:", service_name);

        return {
            statusCode: 200,
            body: {
                message: "Servicio creado con éxito",
                service_id,
                service_name,
                service_category,
            },
        };
    } catch (error) {
        console.error("Error inesperado:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};