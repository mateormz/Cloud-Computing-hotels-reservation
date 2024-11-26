const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_PAYMENTS;

exports.getPaymentById = async (event) => {
  const { tenant_id, payment_id, token } = event.pathParameters;

  try {
    // 1. Validar el token
    await validateToken(token, tenant_id);

    // 2. Obtener el pago por ID
    const params = {
      TableName: tableName,
      Key: {
        tenant_id: tenant_id,
        payment_id: payment_id,
      },
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      throw new Error('Pago no encontrado');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error al obtener el pago:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
