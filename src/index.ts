import {Keypair as SecretKeypair} from './keypair';
import {Sr25519} from './sign'
import {isHex, hexStringToUint8Array, uInt8ArrayToHex} from '../translated/mnemonic/bytes'
import {encodeSubstrateAddress} from './address'
import {parseUriAndDerive} from '../translated/mnemonic/uri'

import {IUniqueSdkSigner, UNIQUE_SDK_SignTxResultResponse, UNIQUE_SDK_UnsignedTxPayloadBody} from './types'
export * from './types'

const textEncoder = new TextEncoder()
const toU8a = (message: Uint8Array | string): Uint8Array => {
  return typeof message === 'string'
    ? isHex(message)
      ? hexStringToUint8Array(message)
      : textEncoder.encode(message)
    : message
}

export const getAccount = (uri: string) => {
  const keypair = SecretKeypair.FromUri(uri)

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
    sign(message: Uint8Array | string) {
      return Sr25519.sign(toU8a(message), keypair)
    },
    /**
     * @name verify
     * @param message [Uint8Array | string]; Hex string or UTF-8 string will be automatically converted to a byte array
     * @param signature [Uint8Array]
     * @returns [boolean] - true if the signature is valid, false otherwise
     */
    verify(message: Uint8Array | string, signature: Uint8Array) {
      return Sr25519.verify(toU8a(message), signature, keypair.publicKey.key)
    },

    /**
     * @name uniqueSdkSigner
     * @description Returns message signature of `message`, using the supplied pair
     * @warning Unstable: need to check
     */
    uniqueSdkSigner: {
      async sign(payload: UNIQUE_SDK_UnsignedTxPayloadBody): Promise<UNIQUE_SDK_SignTxResultResponse> {
        const message = hexStringToUint8Array(payload.signerPayloadHex)
        const signatureBytes = Sr25519.sign(message, keypair)
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

export const dangerouslyParseUriAndGetFullKeypair = parseUriAndDerive
