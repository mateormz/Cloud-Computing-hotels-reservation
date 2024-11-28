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

        // Obtener tenant_id y service_id desde pathParameters
        const { tenant_id, service_id } = event.path;

        // Verificar que los parámetros sean proporcionados
        if (!tenant_id || !service_id) {
            console.log("Error: Faltan parámetros requeridos: tenant_id o service_id");
            return {
                statusCode: 400,
                body: { error: "Faltan parámetros requeridos: tenant_id o service_id" },
            };
        }

        let body;
        try {
            body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (error) {
            console.log("Error al parsear el cuerpo de la solicitud.");
            return {
                statusCode: 400,
                body: { error: "Cuerpo de solicitud no válido" },
            };
        }

        // Obtener los campos a actualizar
        const { descripcion, precio } = body;

        // Verificar que al menos uno de los campos a actualizar esté presente
        if (!descripcion && !precio) {
            return {
                statusCode: 400,
                body: { error: "Debe proporcionar al menos uno de los siguientes campos: descripcion o precio." },
            };
        }

        // Invocar la validación del token (acceso autorizado)
        const validateTokenLambdaName = `user-api-${process.env.STAGE}-hotel_validateUserToken`;
        const lambdaClient = new AWS.Lambda();

        const validateTokenResponse = await lambdaClient
            .invoke({
                FunctionName: validateTokenLambdaName,
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({ body: { token, tenant_id } }), // Necesario para invocar el lambda de validación
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

        // Si el servicio no existe, retornar error 404
        if (!service.Item) {
            return {
                statusCode: 404,
                body: { error: `Servicio con ID '${service_id}' no encontrado para el tenant '${tenant_id}'` },
            };
        }

        // Construir la expresión de actualización dependiendo de los campos proporcionados
        const updateExpression = [];
        const expressionAttributeValues = {};

        if (descripcion) {
            updateExpression.push("descripcion = :descripcion");
            expressionAttributeValues[":descripcion"] = descripcion;
        }

        if (precio) {
            updateExpression.push("precio = :precio");
            expressionAttributeValues[":precio"] = precio.toString(); // Convertir precio a string
        }

        // Ejecutar la actualización en DynamoDB
        await dynamodb
            .update({
                TableName: tableName,
                Key: {
                    tenant_id,
                    service_id,
                },
                UpdateExpression: `SET ${updateExpression.join(", ")}`,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: "UPDATED_NEW", // Devuelve los nuevos valores actualizados
            })
            .promise();

        return {
            statusCode: 200,
            body: {
                message: `Servicio con ID '${service_id}' actualizado con éxito`,
            },
        };
    } catch (error) {
        console.error("Error en updateService:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};