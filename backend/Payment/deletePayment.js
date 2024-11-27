const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_PAYMENTS;

exports.deletePayment = async (event) => {
  const { tenant_id, payment_id, token } = event.pathParameters;

  try {
    // 1. Validar el token
    await validateToken(token, tenant_id);

    // 2. Eliminar el pago
    const params = {
      TableName: tableName,
      Key: {
        tenant_id: tenant_id,
        payment_id: payment_id,
      },
    };

    await dynamodb.delete(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Pago eliminado exitosamente' }),
    };
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
