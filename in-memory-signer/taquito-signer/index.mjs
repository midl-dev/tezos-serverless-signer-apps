/*!
 * Copyright (c) 2023-2024 MIDLDEV OU
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { InMemorySigner } from '@taquito/signer';
import { SecretsManager, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager();

async function getSecret(secretArn) {
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsManager.send(command);
  return JSON.parse(response.SecretString).secretKey;
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
