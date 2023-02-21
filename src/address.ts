import {hexStringToUint8Array, isHex, u8aConcatStrict} from '../translated/mnemonic/bytes'
import {blake2b} from '@noble/hashes/blake2b'

import basex from 'base-x'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const base58 = basex(BASE58_ALPHABET)
export const base64 = basex(BASE64_ALPHABET)

// strToU8a('SS58PRE')
const SS58_PREFIX = new Uint8Array([83, 83, 53, 56, 80, 82, 69])

const sshash = (data: Uint8Array): Uint8Array => {
  return blake2b(u8aConcatStrict([SS58_PREFIX, data]), {dkLen: 64})
}

export const encodeSubstrateAddress = (key: Uint8Array, ss58Format: number = 42): string => {
  if (ss58Format < 0 || ss58Format > 16383 || [46, 47].includes(ss58Format)) {
    throw new Error(`ss58Format is not valid, received ${typeof ss58Format} "${ss58Format}"`)
  }

  const allowedDecodedLengths = [1, 2, 4, 8, 32, 33]
  if (!allowedDecodedLengths.includes(key.length)) {
    throw new Error(`key length is not valid, received ${key.length}, valid values are ${allowedDecodedLengths.join(', ')}`)
  }

  const u8aPrefix = ss58Format < 64
    ? new Uint8Array([ss58Format])
    : new Uint8Array([
      ((ss58Format & 0xfc) >> 2) | 0x40,
      (ss58Format >> 8) | ((ss58Format & 0x03) << 6),
    ])

  const input = u8aConcatStrict([u8aPrefix, key])

  return base58.encode(
    u8aConcatStrict([
      input,
      sshash(input).subarray(0, [32, 33].includes(key.length) ? 2 : 1),
    ]),
  )
}

const checkAddressChecksum = (decoded: Uint8Array, ignoreChecksum: boolean = false): [boolean, number, number, number] => {
  const ss58Length = ((decoded[0] & 0b0100_0000) !== 0) ? 2 : 1
  const ss58Decoded = ss58Length === 1
    ? decoded[0]
    : ((decoded[0] & 0x3f) << 2) | (decoded[1] >> 6) | ((decoded[1] & 0x3f) << 8)

  // 32/33 bytes public + 2 bytes checksum + prefix
  const isPublicKey = [34 + ss58Length, 35 + ss58Length].includes(decoded.length)
  const length = decoded.length - (isPublicKey ? 2 : 1)

  let isValid = false

  if (!ignoreChecksum) {
    // calculate the hash and do the checksum byte checks
    const hash = sshash(decoded.subarray(0, length))
    isValid = (decoded[0] & 0x80) === 0 && ![46, 47].includes(decoded[0]) && (
      isPublicKey
        ? decoded[decoded.length - 2] === hash[0] && decoded[decoded.length - 1] === hash[1]
        : decoded[decoded.length - 1] === hash[0]
    )
  }

  return [isValid, length, ss58Length, ss58Decoded]
}

export function decodeSubstrateAddress(address: string, ignoreChecksum?: boolean, ss58Format: number = -1): Uint8Array {
  let realError: Error | null = null

  try {
    if (isHex(address)) {
      return hexStringToUint8Array(address)
    }

    const decoded = base58.decode(address)

    const allowedEncodedLengths = [3, 4, 6, 10, 35, 36, 37, 38]

    if (!allowedEncodedLengths.includes(decoded.length)) {
      realError = new Error(`key length is not valid, decoded key length is ${decoded.length}, valid values are ${allowedEncodedLengths.join(', ')}`)
      throw realError
    }

    const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded, ignoreChecksum)

    if (!ignoreChecksum && !isValid) {
      realError = new Error('Invalid decoded address checksum')
      throw realError
    }
    if (![-1, ss58Decoded].includes(ss58Format)) {
      realError = new Error(`Expected ss58Format ${ss58Format}, received ${ss58Decoded}`)
      throw realError
    }

    return decoded.slice(ss58Length, endPos)
  } catch (error) {
    throw (realError != null)
      ? realError
      : new Error(`Decoding ${address}: ${(error as Error).message}`)
  }
}
