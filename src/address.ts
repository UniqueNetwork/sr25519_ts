import {u8aConcatStrict} from '../translated/mnemonic/bytes'
import {blake2b} from '@noble/hashes/blake2b'

import basex from 'base-x'

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const base58 = basex(BASE58_ALPHABET)
export const base64 = basex(BASE64_ALPHABET)

// strToU8a('SS58PRE')
const SS58_PREFIX = new Uint8Array([83, 83, 53, 56, 80, 82, 69])

const sshash = (data: Uint8Array): Uint8Array => {
  return blake2b(u8aConcatStrict([SS58_PREFIX, data]), {dkLen: 64});
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
      (ss58Format >> 8) | ((ss58Format & 0x03) << 6)
    ])

  const input = u8aConcatStrict([u8aPrefix, key])

  return base58.encode(
    u8aConcatStrict([
      input,
      sshash(input).subarray(0, [32, 33].includes(key.length) ? 2 : 1)
    ])
  );
}
