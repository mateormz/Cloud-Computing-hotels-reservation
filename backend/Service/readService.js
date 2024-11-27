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

        // Validar y obtener tenant_id desde queryStringParameters o query (pruebas de API Gateway)
        const tenant_id =
            event.queryStringParameters?.tenant_id || // Invocaciones reales
            event.query?.tenant_id ||                 // Pruebas de API Gateway
            null;

        if (!tenant_id) {
            console.log("Error: tenant_id es obligatorio.");
            console.log("queryStringParameters recibido:", JSON.stringify(event.queryStringParameters));
            console.log("query recibido (prueba API Gateway):", JSON.stringify(event.query));
            return {
                statusCode: 400,
                body: { error: "El parámetro tenant_id es obligatorio." },
            };
        }

        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.TABLE_NAME_SERVICIOS;

        const params = {
            TableName: tableName,
            IndexName: process.env.INDEXLSI1_SERVICES,
            KeyConditionExpression: "tenant_id = :tenant_id",
            ExpressionAttributeValues: {
                ":tenant_id": tenant_id,
            },
            ScanIndexForward: true,
        };

        console.log("Parámetros de consulta:", JSON.stringify(params));

        const result = await dynamodb.query(params).promise();
        console.log("Resultado de la consulta:", JSON.stringify(result.Items));

        // Validar si no se encontraron servicios
        if (!result.Items || result.Items.length === 0) {
            return {
                statusCode: 404,
                body: {
                    message: `El hotel con tenant_id '${tenant_id}' no tiene servicios registrados.`,
                },
            };
        }

        // Construir la respuesta directamente como JSON
        return {
            statusCode: 200,
            body: {
                services: result.Items,
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
