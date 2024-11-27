const AWS = require("aws-sdk");

exports.handler = async (event) => {
    try {
        console.log("Evento recibido:", JSON.stringify(event));

        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 400,
                body: { error: "Token no proporcionado" },
            };
        }

        let body;
        try {
            body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        } catch (error) {
            return {
                statusCode: 400,
                body: { error: "Cuerpo de solicitud no válido" },
            };
        }

        const { tenant_id, servicio_nombre, descripcion, precio } = body;

        if (!tenant_id || !servicio_nombre || (!descripcion && !precio)) {
            return {
                statusCode: 400,
                body: { error: "Faltan campos requeridos" },
            };
        }

        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_NAME_SERVICIOS;

        // Verificar existencia del servicio
        const getParams = {
            TableName: tableName,
            Key: {
                tenant_id,
                servicio_nombre,
            },
        };

        const service = await dynamodb.get(getParams).promise();

        if (!service.Item) {
            return {
                statusCode: 404,
                body: { error: "Servicio no encontrado" },
            };
        }

        const updateExpression = [];
        const expressionAttributeValues = {};
        if (descripcion) {
            updateExpression.push("descripcion = :descripcion");
            expressionAttributeValues[":descripcion"] = descripcion;
        }
        if (precio) {
            updateExpression.push("precio = :precio");
            expressionAttributeValues[":precio"] = precio.toString();
        }

        await dynamodb
            .update({
                TableName: tableName,
                Key: {
                    tenant_id,
                    servicio_nombre,
                },
                UpdateExpression: `SET ${updateExpression.join(", ")}`,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: "UPDATED_NEW",
            })
            .promise();

        return {
            statusCode: 200,
            body: {
                message: "Servicio actualizado con éxito",
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
