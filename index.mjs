import TezosKmsClient from './tezos-kms-client.mjs';
import TezosHighWatermark from './high-watermark.mjs';

// Mandatory Environment Variables

// The ARN of your KMS key
const KMS_KEY_ID = process.env.KMS_KEY_ID;

// all signing requests must be signed by the Tezos-encoded secp256k1 key below.
const BAKER_AUTHORIZED_KEY = process.env.BAKER_AUTHORIZED_KEY;

// A secret path.
// If the signer was directly accessible at the root path, an attacker
// with knowledge of the hostname would be able to flood it with requests
// with an invalid signature from BAKER_AUTHORIZED_KEY, putting it at risk
// of DDoS.
const SECRET_URL_PATH = process.env.SECRET_URL_PATH;

// Other mandatory variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const AWS_REGION = process.env.AWS_REGION;

const tezosKMS = new TezosKmsClient(KMS_KEY_ID, AWS_REGION);


const handler = async (event) => {
  console.log(JSON.stringify(event));

  const httpMethod = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    if (httpMethod === 'GET' && path === `/${SECRET_URL_PATH}/authorized_keys`) {
      const authorizedPkh = tezosKMS.getPkh(BAKER_AUTHORIZED_KEY);
      return responses.success({ "authorized_keys": [authorizedPkh] });
    } else {
      const [publicKeyHash, publicKey] = await tezosKMS.getKmsKeys();
      const tezosHWM = new TezosHighWatermark(DYNAMODB_TABLE_NAME, AWS_REGION, publicKeyHash);

      if (path === `/${SECRET_URL_PATH}/keys/${publicKeyHash}`) {
        if (httpMethod === 'GET') {
          return responses.success({ public_key: publicKey });
        } else if (httpMethod === 'POST') {
          if (!event.body) {
            const error = new Error('No message to sign in the request body');
            error.code = 400;
            throw error;
          }

          const parsedBody = JSON.parse(event.body);

          tezosKMS.checkQuerySig(publicKeyHash, parsedBody,
            event.queryStringParameters.authentication,
            BAKER_AUTHORIZED_KEY);

          // Get level and round of the signature request
          const blockData = tezosKMS.parseOperation(parsedBody);

          // Read the current high watermark
          const currentWatermark = await tezosHWM.read(blockData.opType);

          if (blockData.blockLevel < currentWatermark.blockLevel ||
            (blockData.blockLevel == currentWatermark.blockLevel &&
              blockData.blockRound <= currentWatermark.blockRound)) {
            const error = new Error('High Watermark Violation');
            error.code = 400;
            throw error;
          }

          const signature = await tezosKMS.signOperation(parsedBody);

          // do a conditional write of the high watermark. If it changed since we
          // read it, it will toss the signature and throw an error.
          // This is ensuring mutual exclusion of concurrent signatures.
          await tezosHWM.write(blockData.opType, blockData.blockLevel, blockData.blockRound,
            currentWatermark.blockLevel, currentWatermark.blockRound);

          return responses.success({ signature: signature.toString('hex') });

        } else {
          const error = new Error('Method Not Allowed');
          error.code = 405;
          throw error;
        }
      } else {
        const error = new Error('Not Found');
        error.code = 404;
        throw error;
      }
    }
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
