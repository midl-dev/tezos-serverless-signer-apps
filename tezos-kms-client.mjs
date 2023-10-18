import { KMS } from "@aws-sdk/client-kms";
import base58Check from 'bs58check';
import * as secp256k1 from '@noble/secp256k1';
import { blake2b } from '@noble/hashes/blake2b';


const SIGNING_ALGORITHM = 'ECDSA_SHA_256';
const DIGEST_LENGTH = 32;
const PUBLIC_KEY_HASH_LENGTH = 20;

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

  static derSignatureToRaw(derSignature) {
    const decodedSignature = asn1.decode(derSignature);
    const rHex = decodedSignature.sub[0].toHexStringContent();
    const sHex = decodedSignature.sub[1].toHexStringContent();

    // Pad r and s with leading zeros if they are less than 64 characters long
    const rPadded = rHex.padStart(64, '0');
    const sPadded = sHex.padStart(64, '0');

    // Normalize the s value if necessary
    let sBigInt = BigInt(`0x${sPadded}`);
    if (sBigInt > secp256k1.CURVE.n / 2n) {
      sBigInt = secp256k1.CURVE.n - sBigInt;
    }

    // Concatenate the raw bytes of r and s
    const rawSignature = Buffer.from(rPadded + sBigInt.toString(16).padStart(64, '0'), 'hex');

    return rawSignature;
  }

  static base58CheckEncode(bytes, prefix) {
    const prefixedBytes = this.mergeBytes(prefix, bytes);
    return base58Check.encode(prefixedBytes);
  }

  static base58CheckDecode(encoded, expectedPrefix) {
    const decoded = base58Check.decode(encoded);
    const slicedPrefix = decoded.slice(0, expectedPrefix.length);

    if (!slicedPrefix.every((byte, index) => byte === expectedPrefix[index])) {
      const errorMsg = [
        'Invalid prefix. Expected',
        Buffer.from(expectedPrefix).toString('hex'),
        'for a',
        Buffer.from(decoded).toString('base64'),
        'encoded string. Only Tezos keys of type secp256k1 are supported.'
      ].join(' ');

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

    const signature = Utils.derSignatureToRaw(derSignature);
    return Utils.base58CheckEncode(Buffer.from(signature), tezosSecp256k1Prefix.signature);
  }

}
