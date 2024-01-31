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
import TezosKmsClient from './tezos-kms-client.mjs';
import TezosHighWatermark from './high-watermark.mjs';

// Mandatory Environment Variables

// The ARN of your KMS key
const KMS_KEY_ID = process.env.KMS_KEY_ID;

// all signing requests must be signed by the Tezos-encoded secp256k1 key below.
const BAKER_AUTHORIZED_KEY = process.env.BAKER_AUTHORIZED_KEY;

// the consensus public key hash.
const CONSENSUS_PUBLIC_KEY_HASH = process.env.CONSENSUS_PUBLIC_KEY_HASH;

// Other mandatory variables
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const AWS_REGION = process.env.AWS_REGION;

const tezosKMS = new TezosKmsClient(KMS_KEY_ID, AWS_REGION);


const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return responses.error("Method Not Allowed", 405);
    }

    if (!event.body) {
      const error = new Error('No message to sign in the request body');
      error.code = 400;
      throw error;
    }

    const parsedBody = JSON.parse(event.body);

    if (!event.queryStringParameters.authentication) {
      const error = new Error('Unauthenticated Signing Request');
      error.code = 400;
      throw error;
    }
    tezosKMS.checkQuerySig(CONSENSUS_PUBLIC_KEY_HASH, parsedBody,
      event.queryStringParameters.authentication,
      BAKER_AUTHORIZED_KEY);

    // Get level and round of the signature request
    const blockData = tezosKMS.parseOperation(parsedBody);

    // Read the current high watermark
    const tezosHWM = new TezosHighWatermark(DYNAMODB_TABLE_NAME, AWS_REGION, CONSENSUS_PUBLIC_KEY_HASH);
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

    console.log(`Signed ${blockData.opType} of level ${blockData.blockLevel}, round ${blockData.blockRound}.`);
    return responses.success({ signature: signature.toString('hex') });
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
