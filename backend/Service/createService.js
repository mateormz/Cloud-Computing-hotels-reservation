const AWS = require("aws-sdk");

exports.handler = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event));

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

        const { tenant_id, servicio_nombre, descripcion, precio } = body;

        if (!tenant_id || !servicio_nombre || !descripcion || !precio) {
            console.log("Error: Faltan campos requeridos.");
            return {
                statusCode: 400,
                body: { error: "Faltan campos requeridos: tenant_id, servicio_nombre, descripcion o precio" },
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

        // Validar existencia del servicio usando una query directa a DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_NAME_SERVICIOS;
        const indexName = process.env.INDEXGSI1_SERVICES; // GSI: servicio_nombre como Partition Key y tenant_id como Sort Key

        const queryParams = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: "servicio_nombre = :servicio_nombre AND tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":servicio_nombre": servicio_nombre,
                ":tenant_id": tenant_id,
            },
        };

        const queryResult = await dynamodb.query(queryParams).promise();
        console.log("Resultado de la consulta para validar existencia:", queryResult.Items);

        if (queryResult.Items && queryResult.Items.length > 0) {
            return {
                statusCode: 409, // Conflict
                body: {
                    error: `El servicio '${servicio_nombre}' ya existe para el tenant '${tenant_id}'`,
                },
            };
        }

        // Registrar el servicio en DynamoDB
        const putParams = {
            TableName: tableName,
            Item: {
                tenant_id,
                servicio_nombre,
                descripcion,
                precio: precio.toString(), // Convertir a string para DynamoDB
            },
        };

        await dynamodb.put(putParams).promise();
        console.log("Servicio creado con éxito:", servicio_nombre);

        return {
            statusCode: 200,
            body: {
                message: "Servicio creado con éxito",
                servicio_nombre,
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
