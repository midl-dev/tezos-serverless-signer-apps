/*!
 * Copyright (c) 2023 MIDLDEV OU
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
// Mandatory Environment Variables

// Environment variable for the secret key
const SECRET_KEY = process.env.SECRET_KEY;

// all signing requests must be signed by the Tezos-encoded secp256k1 key below.
const BAKER_AUTHORIZED_KEY = process.env.BAKER_AUTHORIZED_KEY;

// A secret path.
// If the signer was directly accessible at the root path, an attacker
// with knowledge of the hostname would be able to flood it with requests
// with an invalid signature from BAKER_AUTHORIZED_KEY, putting it at risk
// of DDoS.
const SECRET_URL_PATH = process.env.SECRET_URL_PATH;

const handler = async (event) => {
  const httpMethod = event.requestContext.http.method;
  const path = event.rawPath;

  try {
    if (httpMethod === 'GET' && path === `/${SECRET_URL_PATH}/authorized_keys`) {
      //const authorizedPkh = tezosKMS.getPkh(BAKER_AUTHORIZED_KEY);
      //return responses.success({ "authorized_keys": [authorizedPkh] });
      return responses.success({});
    } else {
      const signer = await InMemorySigner.fromSecretKey(SECRET_KEY);
      const publicKey = await signer.publicKey();
      const publicKeyHash = await signer.publicKeyHash();
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

          try {
            const signature = await signer.sign(parsedBody);
            console.log(`Signed message.`);

            return {
              statusCode: 200,
              body: JSON.stringify({ signature: signature.prefixSig }),
              headers: {
                'Content-Type': 'application/json'
              }
            };
          } catch (error) {
            console.error("Error in signing process:", error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: "Error in signing process" }),
              headers: {
                'Content-Type': 'application/json'
              }
            };
          }
        } else {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Not Found" }),
            headers: {
              'Content-Type': 'application/json'
            }
          };
        }
      }
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: error.code || 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
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
