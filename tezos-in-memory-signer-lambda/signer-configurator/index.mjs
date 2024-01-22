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
  const stackId = event.StackId.split(':').pop(); // Extract the stack ID
  const secretName = `TezosSecretKey-${stackId}`; // Use stack ID in the secret name
  console.log("getOrCreateSecret - Start with secret name:", secretName);

  try {
    const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).catch((error) => {
      // If the secret does not exist, create it
      if (error.name === 'ResourceNotFoundException') {
        return null; // Indicate that the secret does not exist
      }
      throw error;
    });

    if (secretValue) {
      console.log("Secret retrieved:", secretValue);
      const secretKey = JSON.parse(secretValue.SecretString).secretKey;
      return { signer: InMemorySigner.fromSecretKey(secretKey), secretArn: secretValue.ARN };
    } else {
      console.log("Generating new Tezos keys");
      const signer = await generateTezosKeys();
      const secretKey = await signer.secretKey();
      console.log("Creating secret in Secrets Manager:", secretName);
      const response = await secretsManager.createSecret({ Name: secretName, SecretString: JSON.stringify({ secretKey: secretKey }) });
      console.log("Secret created:", response.ARN);
      return { signer, secretArn: response.ARN };
    }
  } catch (error) {
    console.error("Error in getOrCreateSecret:", error);
    throw error;
  }
}

// Generate a random string deterministically based on the stack ID and pubkey
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
    const { signer, secretArn } = await getOrCreateSecret(event);
    responseData.SecretArn = secretArn;

    const publicKey = await signer.publicKey();
    const publicKeyHash = await signer.publicKeyHash();

    responseData.publicKey = publicKey;
    responseData.publicKeyHash = publicKeyHash;

    // Generate a deterministic random string
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

