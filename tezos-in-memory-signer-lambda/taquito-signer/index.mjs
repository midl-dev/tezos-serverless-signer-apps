import { InMemorySigner } from '@taquito/signer';
import { SecretsManager, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager();

async function getSecret(secretArn) {
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsManager.send(command);
  return response.SecretString;
}

const handler = async (event) => {
  try {
    // Assuming the ARN of the secret is stored in an environment variable
    const secretArn = process.env.SECRET_ARN;

    if (event.httpMethod !== 'POST') {
      return responses.error("Method Not Allowed", 405);
    }

    if (!event.body) {
      throw new Error('No message to sign in the request body');
    }

    // Retrieve the secret key from AWS Secrets Manager
    const secretKey = await getSecret(secretArn);
    const signer = await InMemorySigner.fromSecretKey(secretKey);

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
