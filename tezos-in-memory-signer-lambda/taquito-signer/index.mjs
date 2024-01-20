import { InMemorySigner } from '@taquito/signer';

const SECRET_KEY = process.env.SECRET_KEY;

const handler = async (event) => {
  try {
    // Assuming Lambda Proxy integration, the HTTP method is in event.httpMethod
    if (event.httpMethod !== 'POST') {
      return responses.error("Method Not Allowed", 405);
    }

    if (!event.body) {
      throw new Error('No message to sign in the request body', 400);
    }

    const signer = await InMemorySigner.fromSecretKey(SECRET_KEY);
    const parsedBody = JSON.parse(event.body);
    const signature = await signer.sign(parsedBody);
    console.log(`Signed message.`);

    return responses.success({ signature: signature.prefixSig });
  } catch (error) {
    console.error(error);
    return responses.error(error.message, error.code || 500);
  }
};

const responses = {
  success: (body) => ({
    statusCode: 200,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  error: (message, statusCode = 500) => ({
    statusCode,
    body: JSON.stringify({ error: message }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
};

export { handler };
