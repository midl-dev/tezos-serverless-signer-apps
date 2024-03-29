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
import bip39 from 'bip39';
import https from 'https';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { createHash } from 'crypto';

const secretsManager = new SecretsManager();

async function generateTezosKeys() {
  const mnemonic = bip39.generateMnemonic(256); // 256 bits for 24 words
  return InMemorySigner.fromMnemonic({ mnemonic: mnemonic });
}

async function getOrCreateSecret(event) {
  const providedSecretArn = process.env.SECRET_ARN;
  let secretName;

  if (providedSecretArn) {
    console.log("Using provided secret ARN:", providedSecretArn);
    secretName = providedSecretArn;
  } else {
    const stackId = event.StackId.split(':').pop(); // Extract the stack ID
    secretName = `TezosSecretKey-${stackId}`; // Use stack ID in the secret name
    console.log("No secret ARN provided. Using generated name:", secretName);
  }

  try {
    const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).catch((error) => {
      if (!providedSecretArn && error.name === 'ResourceNotFoundException') {
        return null; // Secret does not exist
      }
      throw error;
    });

    if (secretValue) {
      console.log("Secret retrieved");
      const secretKey = JSON.parse(secretValue.SecretString).secretKey;
      return { signer: await InMemorySigner.fromSecretKey(secretKey), secretArn: secretValue.ARN };
    } else if (!providedSecretArn) {
      console.log("Generating new Tezos keys");
      const signer = await generateTezosKeys();
      const secretKey = await signer.secretKey();
      console.log("Creating secret in Secrets Manager:", secretName);
      const response = await secretsManager.createSecret({ Name: secretName, SecretString: JSON.stringify({ secretKey }) });
      console.log("Secret created:", response.ARN);
      return { signer, secretArn: response.ARN };
    } else {
      throw new Error("Provided secret ARN does not exist and cannot be created.");
    }
  } catch (error) {
    console.error("Error in getOrCreateSecret:", error);
    throw error;
  }
}

// Generate a random string deterministically based on the stack ID and pubkey
// This is to add to the signer path, for added security.
function generateDeterministicRandomString(stackId, publicKey) {
  const hash = createHash('sha256');
  hash.update(stackId);
  hash.update(publicKey);
  // Use only the first 16 bytes (32 hex characters)
  return hash.digest('hex').substring(0, 32);
}
function sendResponse(event, context, responseStatus, responseData) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: context.logStreamName || context.awsRequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  const parsedUrl = new URL(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'PUT',
    headers: {
      "content-type": "",
      "content-length": Buffer.byteLength(responseBody)
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      console.log("STATUS:", response.statusCode);
      console.log("HEADERS:", JSON.stringify(response.headers));
      resolve();
    });

    request.on('error', (error) => {
      console.log("sendResponse Error:", error);
      reject(error);
    });

    request.write(responseBody);
    request.end();
  });
}

const handler = async (event, context) => {
  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
  const responseData = {};

  try {
    if (event.RequestType === 'Delete') {
      // Handle the delete request
      console.log("Delete request - no action needed");
      await sendResponse(event, context, 'SUCCESS', {});
      return;
    }

    // Handle create and update requests
    const { signer, secretArn } = await getOrCreateSecret(event);
    responseData.SecretArn = secretArn;
    const publicKey = await signer.publicKey();
    const publicKeyHash = await signer.publicKeyHash();
    responseData.publicKey = publicKey;
    responseData.publicKeyHash = publicKeyHash;
    const randomString = generateDeterministicRandomString(event.StackId, publicKey);
    responseData.randomString = randomString;

    await sendResponse(event, context, 'SUCCESS', responseData);
  } catch (error) {
    console.error('An error occurred:', error);
    responseData.Error = error.message;
    await sendResponse(event, context, 'FAILED', responseData);
  }
};

export { handler };
