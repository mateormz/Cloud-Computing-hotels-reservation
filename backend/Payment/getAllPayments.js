const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_PAYMENTS;

exports.getAllPayments = async (event) => {
  const { tenant_id, token } = JSON.parse(event.body);

  try {
    // 1. Validar el token
    await validateToken(token, tenant_id);

    // 2. Obtener todos los pagos
    const params = {
      TableName: tableName,
      IndexName: "tenant-id-index", // Suponiendo que tenemos un índice global por tenant_id
      KeyConditionExpression: "tenant_id = :tenant_id",
      ExpressionAttributeValues: {
        ":tenant_id": tenant_id,
      },
    };

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        payments: result.Items,
      }),
    };
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
