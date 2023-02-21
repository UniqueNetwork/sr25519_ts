import {Keypair as SecretKeypair} from './keypair';
import {isHex, hexStringToUint8Array, uInt8ArrayToHex} from '../translated/mnemonic/bytes'
import {decodeSubstrateAddress, encodeSubstrateAddress} from './address'
import {parseUriAndDerive} from '../translated/mnemonic/uri'

import {IUniqueSdkSigner, UNIQUE_SDK_SignTxResultResponse, UNIQUE_SDK_UnsignedTxPayloadBody} from './types'
import {PublicKey} from './signingContext'
export * from './types'

const textEncoder = new TextEncoder()
const toU8a = (message: Uint8Array | string): Uint8Array => {
  return typeof message === 'string'
    ? isHex(message)
      ? hexStringToUint8Array(message)
      : textEncoder.encode(message)
    : message
}

/**
 * private method, don't export
 * @param keypair
 */
const getAccountFromKeypair = (keypair: SecretKeypair) => {
  return {
    get publicKey() {
      return keypair.publicKey.key.slice()
    },
    address: encodeSubstrateAddress(keypair.publicKey.key),
    prefixedAddress(prefix: number = 42) {
      return encodeSubstrateAddress(keypair.publicKey.key, prefix)
    },

    /**
     * @name sign
     * @param message [Uint8Array | string]; Hex string or UTF-8 string will be automatically converted to a byte array
     * @returns [Uint8Array] - signature
     */
    sign(message: Uint8Array | string): Uint8Array {
      return keypair.secretKey.sign(toU8a(message), keypair.publicKey).ToBytes()
    },

    /**
     * @name verify
     * @param message [Uint8Array | string]; Hex string or UTF-8 string will be automatically converted to a byte array
     * @param signature [Uint8Array]
     * @returns [boolean] - true if the signature is valid, false otherwise
     */
    verify(message: Uint8Array | string, signature: Uint8Array): boolean {
      return keypair.publicKey.verify(toU8a(message), signature)
    },

    /**
     * @name uniqueSdkSigner
     * @description Returns message signature of `message`, using the supplied pair
     * @warning Unstable: need to check
     */
    uniqueSdkSigner: {
      async sign(payload: UNIQUE_SDK_UnsignedTxPayloadBody): Promise<UNIQUE_SDK_SignTxResultResponse> {
        const message = hexStringToUint8Array(payload.signerPayloadHex)
        const signatureBytes = keypair.secretKey.sign(message, keypair.publicKey).ToBytes()
        const signature = uInt8ArrayToHex(signatureBytes)

        // '01' is the prefix for sr25519 signature type
        return {
          signature: `0x01${signature.substring(2)}`,
          signatureType: 'sr25519'
        };
      }
    } satisfies IUniqueSdkSigner,
  }
}

export const getAccount = (uri: string) => {
  const keypair = SecretKeypair.FromUri(uri)
  return getAccountFromKeypair(keypair)
}

export const verifySignature = (message: Uint8Array | string, signature: Uint8Array | string, signerAdressOrPublicKey: Uint8Array | string) => {
  const messageU8a = toU8a(message)
  let publicKeyBytes: Uint8Array

  if (typeof signerAdressOrPublicKey === 'string') {
    if (isHex(signerAdressOrPublicKey)) {
      publicKeyBytes = hexStringToUint8Array(signerAdressOrPublicKey)
    } else {
      publicKeyBytes = decodeSubstrateAddress(signerAdressOrPublicKey)
    }
  } else {
    publicKeyBytes = signerAdressOrPublicKey
  }
  const publicKey = PublicKey.FromBytes(publicKeyBytes)
  const signatureU8a = typeof signature === 'string'
    ? hexStringToUint8Array(signature)
    : signature

  return publicKey.verify(messageU8a, signatureU8a)
}

export const utils = {
  getAccountFromMiniSecret: (miniSecret: Uint8Array) => {
    const keypair = SecretKeypair.FromMiniSecret(miniSecret)
    return getAccountFromKeypair(keypair)
  },
  getAccountFromKeypair,
  getAccountFromSecretKeyBytes: (secretKeyBytes: Uint8Array) => {
    const keypair = SecretKeypair.FromSecretKeyBytes(secretKeyBytes)
    return getAccountFromKeypair(keypair)
  },
  dangerouslyParseUriAndGetFullKeypair: parseUriAndDerive,
}
