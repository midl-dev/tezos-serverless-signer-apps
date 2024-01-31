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
import { KMS } from "@aws-sdk/client-kms";
import base58Check from 'bs58check';
import { secp256k1 } from '@noble/curves/secp256k1';
import { blake2b } from '@noble/hashes/blake2b';


const SIGNING_ALGORITHM = 'ECDSA_SHA_256';
const DIGEST_LENGTH = 32;

const tezosSecp256k1Prefix = {
  publicKey: new Uint8Array([3, 254, 226, 86]),
  publicKeyHash: new Uint8Array([6, 161, 161]),
  signature: new Uint8Array([13, 115, 101, 19, 63]),
};

const MAGIC_BYTES = {
  0x11: 'Block',
  0x12: 'Preattestation',
  0x13: 'Attestation'
};

class Utils {
  static base58CheckEncode(bytes, prefix) {
    const prefixedBytes = this.mergeBytes(prefix, bytes);
    return base58Check.encode(prefixedBytes);
  }

  static base58CheckDecode(encoded, expectedPrefix) {
    const decoded = base58Check.decode(encoded);
    const slicedPrefix = decoded.slice(0, expectedPrefix.length);

    if (!slicedPrefix.every((byte, index) => byte === expectedPrefix[index])) {
      const errorMsg = `Unexpected Prefix for ${encoded}`;
      throw new Error(errorMsg);
    }

    return Buffer.from(decoded.slice(expectedPrefix.length));
  }

  static mergeBytes(a, b) {
    const merged = new Uint8Array(a.length + b.length);
    merged.set(a);
    merged.set(b, a.length);
    return merged;
  }

  static isHex(input) {
    const hexRegEx = /([0-9]|[a-f])/gim;
    return (input.match(hexRegEx) || []).length === input.length;
  }

  static hexToBytes(hex) {
    if (!this.isHex(hex)) {
      throw new Error(`Invalid hex: ${hex}`);
    }
    return Uint8Array.from(Buffer.from(hex, 'hex'));
  }
}

export default class TezosKmsClient {
  constructor(kmsKeyId, region) {
    this.kms = new KMS({
      region,
    });
    this.kmsKeyId = kmsKeyId;
  }

  checkQuerySig(publicKeyHash, hex, signature, bakerAuthorizedKey) {
    const publicKeyHashBytes = Utils.base58CheckDecode(publicKeyHash, tezosSecp256k1Prefix.publicKeyHash);
    const signatureBytes = Utils.base58CheckDecode(signature, tezosSecp256k1Prefix.signature);
    const authorizedPublicKeyBytes = Utils.base58CheckDecode(bakerAuthorizedKey, tezosSecp256k1Prefix.publicKey);

    // The message signed by the authorized key consists of a prefix, followed
    // by the signer public key hash, and the message being signed.
    const msgPrefix = Buffer.from("040101", 'hex');
    const data = Buffer.from(hex, 'hex');
    const fullMessage = Buffer.concat([msgPrefix, publicKeyHashBytes, data]);
    const messageHash = Buffer.from(blake2b(fullMessage, { dkLen: DIGEST_LENGTH }));

    // Verify the signature from the authorized key
    if (!secp256k1.verify(signatureBytes.toString('hex'), messageHash.toString('hex'), authorizedPublicKeyBytes.toString('hex'))) {
      const error = new Error('Unauthorized');
      error.code = 401;
      throw error;
    }
  }

  parseOperation(hex) {
    const data = Buffer.from(Utils.hexToBytes(hex), 'hex');

    if (data.length < 4) {
      const error = new Error('Data Too Short');
      error.code = 400;
      throw error;
    }

    const opTypeByte = data[0];
    const opType = MAGIC_BYTES[opTypeByte];

    if (!opType) {
      const error = new Error('Invalid Magic Byte');
      error.code = 400;
      throw error;
    }

    let blockData = { opType, blockLevel: null, blockRound: null };

    const readUInt32BE = (offset) => data.readUInt32BE(offset);

    if (opTypeByte === 0x11) {
      blockData.blockLevel = readUInt32BE(5);

      const fitnessSize = readUInt32BE(83);
      const offset = 87 + fitnessSize - 4;
      blockData.blockRound = readUInt32BE(offset);
    } else if (opTypeByte === 0x12 || opTypeByte === 0x13) {
      blockData.blockLevel = readUInt32BE(40);
      blockData.blockRound = readUInt32BE(44);
    }

    return blockData;
  }

  async signOperation(hex) {
    const digest = blake2b(Utils.hexToBytes(hex), { dkLen: DIGEST_LENGTH });

    const params = {
      KeyId: this.kmsKeyId,
      Message: digest,
      SigningAlgorithm: SIGNING_ALGORITHM,
      MessageType: 'DIGEST',
    };

    const { Signature: derSignature } = await this.kms.sign(params);

    if (!(derSignature instanceof Uint8Array)) {
      throw new Error('Unexpected response from KMS');
    }

    const signature = secp256k1.Signature.fromDER(Buffer.from(derSignature));
    return Utils.base58CheckEncode(signature.normalizeS().toCompactRawBytes(), tezosSecp256k1Prefix.signature);

  }

}
