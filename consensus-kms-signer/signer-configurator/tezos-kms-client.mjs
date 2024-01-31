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
import { blake2b } from '@noble/hashes/blake2b';


const PUBLIC_KEY_HASH_LENGTH = 20;

const tezosSecp256k1Prefix = {
  publicKey: new Uint8Array([3, 254, 226, 86]),
  publicKeyHash: new Uint8Array([6, 161, 161]),
  signature: new Uint8Array([13, 115, 101, 19, 63]),
};

let asn1;

async function loadASN1() {
  const asn1Module = await import('@lapo/asn1js');
  asn1 = asn1Module.default;
  asn1.prototype.toHexStringContent = function() {
    const hex = this.stream.hexDump(this.posContent(), this.posEnd(), true);
    return hex.startsWith('00') ? hex.slice(2) : hex;
  };
}

loadASN1().catch(error => console.error('Error loading ASN1:', error));


class Utils {
  static compressKey(uncompressed) {
    const uncompressedKeySize = 65;
    if (uncompressed.length !== uncompressedKeySize) {
      throw new Error('Invalid length for uncompressed key');
    }
    const firstByte = uncompressed[0];
    if (firstByte !== 4) {
      throw new Error('Invalid compression byte');
    }
    const lastByte = uncompressed[64];
    const magicByte = lastByte % 2 === 0 ? 2 : 3;
    const xBytes = uncompressed.slice(1, 33);
    return this.mergeBytes(new Uint8Array([magicByte]), xBytes);
  }

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

  getPkh(publicKey) {
    const publicKeyBytes = Utils.base58CheckDecode(publicKey, tezosSecp256k1Prefix.publicKey);
    const publicKeyHash = blake2b(publicKeyBytes, { dkLen: PUBLIC_KEY_HASH_LENGTH });
    return Utils.base58CheckEncode(publicKeyHash, tezosSecp256k1Prefix.publicKeyHash);
  }

  async getKmsKeys() {
    const publicKeyResponse = await this.kms.getPublicKey({
      KeyId: this.kmsKeyId,
    });
    const publicKeyDer = publicKeyResponse.PublicKey;
    if (publicKeyDer === undefined) {
      throw new Error("Couldn't retrieve key from AWS KMS");
    }
    const decodedPublicKey = asn1.decode(publicKeyDer);
    const publicKeyHex = decodedPublicKey.sub[1].toHexStringContent();
    const uncompressedPublicKeyBytes = Utils.hexToBytes(publicKeyHex);
    const publicKeyBytes = Utils.compressKey(uncompressedPublicKeyBytes);
    const publicKeyHashBytes = blake2b(publicKeyBytes, { dkLen: PUBLIC_KEY_HASH_LENGTH });
    return [
      Utils.base58CheckEncode(publicKeyHashBytes, tezosSecp256k1Prefix.publicKeyHash),
      Utils.base58CheckEncode(publicKeyBytes, tezosSecp256k1Prefix.publicKey)
    ];
  }


}
