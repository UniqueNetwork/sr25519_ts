import {bigIntToUint8Array, compactAddLength, hexStringToUint8Array, isHex} from './bytes'
import {blake2b} from '@noble/hashes/blake2b'

export const DEFAULT_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk';

const REGEX_DIGITS_ONLY = /^\d+$/
export type Derivation = { value: string, hard?: boolean, cc: Uint8Array }

export const parseUri = (uri: string): { mnemonic: string, password: string, derivations: Derivation[] } => {
  const derivations: Derivation[] = []

  const [beforePassword, password = ''] = uri.split('///')
  const hardSeparatedParts = beforePassword.split('//')

  let mnemonic = hardSeparatedParts.shift() || DEFAULT_MNEMONIC
  const mnemonicParts = mnemonic.split('/')
  mnemonic = mnemonicParts.shift()!
  if (mnemonicParts.length) {
    derivations.push(...mnemonicParts.map(value => ({value, cc: getChainCode(value)})))
  }

  for (const part of hardSeparatedParts) {
    const softSeparatedParts = part.split('/')
    const hard = softSeparatedParts.shift()!
    derivations.push({value: hard, hard: true, cc: getChainCode(hard)})
    derivations.push(...softSeparatedParts.map(value => ({value, cc: getChainCode(value)})))
  }

  return {
    mnemonic,
    password,
    derivations,
  }
}

const textEncoder = new TextEncoder()

export const getChainCode = (str: string): Uint8Array => {
  const value = REGEX_DIGITS_ONLY.test(str) ? BigInt(str) : str

  let u8a: Uint8Array

  if (typeof value === 'bigint') {
    u8a = bigIntToUint8Array(value, {bitLength: 256, isLe: true})
  } else { // value is string
    u8a = isHex(value)
      ? hexStringToUint8Array(value)
      : compactAddLength(textEncoder.encode(value))
  }

  const chainCode = new Uint8Array(32)
  chainCode.set(u8a.length > 32 ? blake2b(u8a, {dkLen: 32}) : u8a, 0)

  return chainCode
}
