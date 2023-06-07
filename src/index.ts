import {Keypair as SecretKeypair} from './keypair'
import {isHex, hexStringToUint8Array, uInt8ArrayToHex} from '../translated/mnemonic/bytes'
import {decodeSubstrateAddress, encodeSubstrateAddress} from './address'
import {parseUriAndDerive} from '../translated/mnemonic/uri'

import type {IUniqueSdkSigner, UNIQUE_SDK_SignTxResultResponse, UNIQUE_SDK_UnsignedTxPayloadBody} from './types'
import {PublicKey} from './signingContext'
import {generateMnemonic, mnemonicToMiniSecret} from '../translated/mnemonic/mnemonic'

export type {IUniqueSdkSigner}

const textEncoder = new TextEncoder()
const anyToU8a = (message: Uint8Array | string): Uint8Array => {
  return typeof message === 'string'
    ? isHex(message)
      ? hexStringToUint8Array(message)
      : textEncoder.encode(message)
    : message
}
const u8aOrHexToU8a = (message: Uint8Array | string): Uint8Array => {
  if (message instanceof Uint8Array) {
    return message
  } else {
    if (isHex(message)) {
      return hexStringToUint8Array(message)
    } else {
      throw new Error('Invalid message: should be Uint8Array or hex string')
    }
  }
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
      return keypair.secretKey.sign(anyToU8a(message), keypair.publicKey).ToBytes()
    },

    /**
     * @name verify
     * @param message [Uint8Array | string]; Hex string or UTF-8 string will be automatically converted to a byte array
     * @param signature [Uint8Array]
     * @returns [boolean] - true if the signature is valid, false otherwise
     */
    verify(message: Uint8Array | string, signature: Uint8Array | string): boolean {
      return keypair.publicKey.verify(anyToU8a(message), u8aOrHexToU8a(signature))
    },

    /**
     * @name signer
     * @description signer for @unique-nft/sdk
     */
    signer: {
      async sign(payload: UNIQUE_SDK_UnsignedTxPayloadBody): Promise<UNIQUE_SDK_SignTxResultResponse> {
        const message = hexStringToUint8Array(payload.signerPayloadHex)
        const signatureBytes = keypair.secretKey.sign(message, keypair.publicKey).ToBytes()
        const signature = uInt8ArrayToHex(signatureBytes)

        // '01' is the prefix for sr25519 signature type
        return {
          signature: `0x01${signature.substring(2)}`,
          signatureType: 'sr25519',
        }
      },
    } satisfies IUniqueSdkSigner,
  }
}

export const verifySignature = (message: Uint8Array | string, signature: Uint8Array | string, signerAddressOrPublicKey: Uint8Array | string) => {
  let publicKeyBytes: Uint8Array
  if (signerAddressOrPublicKey instanceof Uint8Array) {
    publicKeyBytes = signerAddressOrPublicKey
  } else if (typeof signerAddressOrPublicKey === 'string') {
    publicKeyBytes = isHex(signerAddressOrPublicKey)
      ? hexStringToUint8Array(signerAddressOrPublicKey)
      : decodeSubstrateAddress(signerAddressOrPublicKey)
  } else {
    throw new Error('Invalid signerAddressOrPublicKey: should be Uint8Array or hex string')
  }

  const publicKey = PublicKey.FromBytes(publicKeyBytes)

  return publicKey.verify(anyToU8a(message), u8aOrHexToU8a(signature))
}

export const dangerouslyParseUriAndGetFullKeypair = parseUriAndDerive

export const Sr25519Account = {
  fromUri: (uri: string) => {
    const keypair = SecretKeypair.FromUri(uri)
    return getAccountFromKeypair(keypair)
  },
  verifySignature,
  other: {
    fromMiniSecret: (miniSecret: Uint8Array | string) => {
      const keypair = SecretKeypair.FromMiniSecret(u8aOrHexToU8a(miniSecret))
      return getAccountFromKeypair(keypair)
    },
    fromSecretKeyBytes: (secretKeyBytes: Uint8Array | string) => {
      const keypair = SecretKeypair.FromSecretKeyBytes(u8aOrHexToU8a(secretKeyBytes))
      return getAccountFromKeypair(keypair)
    },
    fromKeypair: getAccountFromKeypair,
    mnemonicToMiniSecret,
    dangerouslyParseUriAndGetFullKeypair,
  },
  utils: {
    encodeSubstrateAddress,
    decodeSubstrateAddress,
  },
  generateMnemonic,
}

/** @deprecated use Sr25519Account instead */
export const Account = Sr25519Account

export default Sr25519Account

export type ISr25519Account = ReturnType<typeof getAccountFromKeypair>
