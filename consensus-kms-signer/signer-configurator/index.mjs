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

/*!
 * The purpose of this lambda function is to populate the environment
 * for the lambda that actually does the signing:
 * * calculate the public key of the KMS signer to configure the mock URLs
 * * calculate the pkh of the authorized key
 * * generate a random path for the app's URL
 */
import TezosKmsClient from './tezos-kms-client.mjs';
import { createHash } from 'crypto';
import https from 'https';

const KMS_KEY_ID = process.env.KMS_KEY_ID;
const AWS_REGION = process.env.AWS_REGION;
const BAKER_AUTHORIZED_KEY = process.env.BAKER_AUTHORIZED_KEY;
const tezosKMS = new TezosKmsClient(KMS_KEY_ID, AWS_REGION);


// Generate a random string deterministically based on the stack ID and pubkey
// This is to add to the signer path, for added security.
function generateDeterministicRandomString(stackId, publicKey) {
  const hash = createHash('sha256');
  hash.update(stackId);
  hash.update(publicKey);
  // Use only the first 16 bytes (32 hex characters)
  return hash.digest('hex').substring(0, 32);
}

const handler = async (event, context) => {
  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));
  const responseData = {};

  try {
    // Check for CloudFormation RequestType
    switch (event.RequestType) {
      case 'Delete':
      case 'Update':
      case 'Create':
        const [publicKeyHash, publicKey] = await tezosKMS.getKmsKeys();
        responseData.publicKeyHash = publicKeyHash;
        responseData.publicKey = publicKey;
        const randomString = generateDeterministicRandomString(event.StackId, publicKey);
        responseData.randomString = randomString;
        responseData.bakerAuthorizedKeyHash = tezosKMS.getPkh(BAKER_AUTHORIZED_KEY);
        await sendResponse(event, context, 'SUCCESS', responseData);
        break;
      default:
        // Send fail response
        await sendResponse(event, context, 'FAILED');
        break;
    }
  } catch (error) {
    console.log('An error occurred:', error);
    await sendResponse(event, context, 'FAILED');
  }
};

// Function to send a response to CloudFormation
function sendResponse(event, context, responseStatus, responseData) {
  return new Promise((resolve, reject) => {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
      PhysicalResourceId: context.logStreamName || context.awsRequestId, // Fallback in case logStreamName is unavailable
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData,
    });

    console.log("RESPONSE BODY:\n", responseBody);

    const parsedUrl = new URL(event.ResponseURL); // Using the URL global object instead of url module
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search, // pathname and search are separate in the URL object
      method: 'PUT',
      headers: {
        "content-type": "",
        "content-length": Buffer.byteLength(responseBody), // Correctly calculate the byte length
      }
    };

    console.log("SENDING RESPONSE...\n");

    const request = https.request(options, function(response) {
      console.log("STATUS: " + response.statusCode);
      console.log("HEADERS: " + JSON.stringify(response.headers));
      resolve(); // Resolve the promise on successful response
    });

    request.on('error', function(error) {
      console.log("sendResponse Error:" + error);
      reject(error); // Reject the promise on error
    });

    // write data to request body
    request.write(responseBody);
    request.end();
  });
}

export { handler };
