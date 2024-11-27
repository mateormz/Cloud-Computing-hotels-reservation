const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_PAYMENTS;

exports.getPaymentsByUserAndTenant = async (event) => {
  const { tenant_id, user_id, token } = JSON.parse(event.body);

  try {
    // 1. Validar el token
    await validateToken(token, tenant_id);

    // 2. Obtener pagos por tenant_id y user_id
    const params = {
      TableName: tableName,
      IndexName: "user-id-tenant-id-index", // Suponiendo que tenemos un índice global por user_id y tenant_id
      KeyConditionExpression: "tenant_id = :tenant_id AND user_id = :user_id",
      ExpressionAttributeValues: {
        ":tenant_id": tenant_id,
        ":user_id": user_id,
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
    console.error('Error al obtener los pagos del usuario:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
