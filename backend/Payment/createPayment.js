const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

const TABLE_PAYMENTS = process.env.TABLE_PAYMENTS;
const SERVICE_NAME = process.env.SERVICE_NAME;
const STAGE = process.env.STAGE;

async function validateToken(token, tenant_id) {
  // Invoca la función Lambda para validar el token
  const params = {
    FunctionName: `${SERVICE_NAME}-${STAGE}-hotel_validateUserToken`,
    Payload: JSON.stringify({
      body: {
        token: token,
        tenant_id: tenant_id,
      },
    }),
  };

  try {
    const result = await lambda.invoke(params).promise();
    const payload = JSON.parse(result.Payload);

    if (payload.statusCode !== 200) {
      throw new Error('Token no válido');
    }
  } catch (error) {
    throw new Error('Error de validación de token: ' + error.message);
  }
}

async function getReservaById(tenant_id, reserva_id) {
  // Simulamos la llamada para obtener la reserva por ID
  const params = {
    TableName: `${STAGE}-hotel-reservas`, // Suponemos que hay una tabla de reservas
    Key: {
      tenant_id: tenant_id,
      reserva_id: reserva_id,
    },
  };

  try {
    const result = await dynamodb.get(params).promise();
    if (!result.Item) {
      throw new Error('Reserva no encontrada');
    }
    return result.Item;
  } catch (error) {
    throw new Error('Error al obtener la reserva: ' + error.message);
  }
}

async function getRoomById(tenant_id, room_id) {
  // Simulamos la llamada a getRoomById para obtener la información de la habitación
  const params = {
    FunctionName: `${SERVICE_NAME}-${STAGE}-room_getById`,
    Payload: JSON.stringify({
      pathParameters: {
        tenant_id: tenant_id,
        room_id: room_id,
      },
      headers: {
        Authorization: 'dummy-token', // Aquí iría el token validado
      },
    }),
  };

  try {
    const result = await lambda.invoke(params).promise();
    const room = JSON.parse(result.Payload);
    if (!room || room.error) {
      throw new Error('Error al obtener la habitación: ' + room.error);
    }
    return room;
  } catch (error) {
    throw new Error('Error al obtener la habitación: ' + error.message);
  }
}

exports.createPayment = async (event) => {
  const { tenant_id, reserva_id, token } = JSON.parse(event.body);

  try {
    // 1. Validar el token
    await validateToken(token, tenant_id);

    // 2. Obtener la reserva por ID
    const reserva = await getReservaById(tenant_id, reserva_id);
    
    // 3. Obtener la habitación asociada a la reserva
    const room = await getRoomById(tenant_id, reserva.room_id);

    // 4. Calcular el monto del pago
    const days = reserva.dias_reserva;  // Asumimos que la reserva tiene un atributo 'dias_reserva'
    const costPerDay = room.price_per_night;  // El costo por noche de la habitación
    const totalAmount = costPerDay * days;

    // 5. Guardar el pago
    const paymentId = AWS.util.uuid.v4();
    const payment = {
      tenant_id: tenant_id,
      payment_id: paymentId,
      reserva_id: reserva_id,
      room_id: reserva.room_id,
      amount: totalAmount,
      payment_date: new Date().toISOString(),
      status: 'pending',  // El estado puede ser "pending", "completed", etc.
    };

    const paymentParams = {
      TableName: TABLE_PAYMENTS,
      Item: payment,
    };

    await dynamodb.put(paymentParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Pago creado con éxito',
        payment_id: paymentId,
        amount: totalAmount,
      }),
    };
  } catch (error) {
    console.error('Error al crear el pago:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
