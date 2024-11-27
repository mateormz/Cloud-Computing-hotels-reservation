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

        const { tenant_id, servicio_nombre } = body;

        if (!tenant_id || !servicio_nombre) {
            return {
                statusCode: 400,
                body: { error: "Faltan campos: tenant_id o servicio_nombre" },
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

        // Eliminar el servicio
        await dynamodb.delete(getParams).promise();

        return {
            statusCode: 200,
            body: {
                message: `Servicio ${servicio_nombre} eliminado con éxito`,
            },
        };
    } catch (error) {
        console.error("Error en deleteService:", error);
        return {
            statusCode: 500,
            body: { error: "Error interno del servidor", details: error.message },
        };
    }
};
