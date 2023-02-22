export const toTwos = (value: bigint, width: number | bigint): bigint => {
  return value >= 0 ? value : (1n << BigInt(width)) + value
}

const DEFAULT_OPTS = {bitLength: -1, isLe: true, isNegative: false}

export const bigIntToUint8Array = (value: bigint | null, options: {bitLength?: number, isLe?: boolean, isNegative?: boolean} = DEFAULT_OPTS): Uint8Array => {
  options = {...DEFAULT_OPTS, ...options}
  const {bitLength, isLe, isNegative} = options

  const byteLength = Math.ceil(bitLength === -1
    ? (value || 0n).toString(2).length / 8 // if bitLength is -1, take the real value's bit length
    : (bitLength || 0) / 8, // if bitLength is not -1, take the bitLength
  )

  if (!value) {
    return new Uint8Array(bitLength === -1 ? 1 : byteLength)
  }

  const bn = isNegative
    ? toTwos(value, byteLength * 8)
    : value

  const arr = (bn
    .toString(16)
    .padStart(byteLength * 2, '0')
    .match(/.{2}/g) || []
  ).map(x => parseInt(x, 16))

  return new Uint8Array(isLe ? arr.reverse() : arr)
}

const REGEX_HEX_PREFIXED = /^0x[\da-fA-F]+$/

export function isHex(value: unknown, bitLength = -1, ignoreLength?: boolean): boolean {
  return typeof value === 'string' && (value === '0x' || REGEX_HEX_PREFIXED.test(value)) && (
    bitLength === -1
      ? (ignoreLength || (value.length % 2 === 0))
      : (value.length === (2 + Math.ceil(bitLength / 4)))
  )
}

export const uInt8ArrayToHex = (bytes: Uint8Array | null): string => {
  return !bytes ? '0x' : bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '0x')
}

export const hexStringToUint8Array = (str: string | null, bitLength: number = -1): Uint8Array => {
  if (!str) {
    return new Uint8Array()
  }
  if (!isHex(str)) {
    throw new Error(`Invalid hex string: ${str}`)
  }
  if (str.startsWith('0x')) {
    str = str.slice(2)
  }

  if (bitLength !== -1) {
    str = (bitLength / 4 < str.length) // if the bit length is less than the string length
      ? str.slice(0, bitLength / 4) // slice the string to the bit length
      : str.padStart(bitLength / 4, '0') // otherwise, pad the string to the bit length
  }
  if (str.length % 2 !== 0) {
    str = str + '0'
  }

  const pairs = str
    .replace(/^0x/, '')
    .match(/.{1,2}/g)
  if (!pairs) {
    return new Uint8Array()
  }
  const bytes = pairs.map(b => parseInt(b, 16))
  return new Uint8Array(bytes)
}

export function u8aConcatStrict(u8as: readonly Uint8Array[], length = 0): Uint8Array {
  let offset = 0

  if (!length) {
    for (let i = 0; i < u8as.length; i++) {
      length += u8as[i].length
    }
  }

  const result = new Uint8Array(length)

  for (let i = 0; i < u8as.length; i++) {
    result.set(u8as[i], offset)
    offset += u8as[i].length
  }

  return result
}

const maxU8 = 0b111111n
const maxU16 = 0b11111111111111n
const maxU32 = 0b1111111111
const bl16 = {bitLength: 16}
const bl32 = {bitLength: 32}

const compactToU8a = (value: bigint | number): Uint8Array => {
  const bn = BigInt(value)

  if (bn <= maxU8) {
    return new Uint8Array([Number(bn << 2n)])
  } else if (bn <= maxU16) {
    return bigIntToUint8Array((bn << 2n) + 1n, bl16)
  } else if (bn <= maxU32) {
    return bigIntToUint8Array((bn << 2n) + 2n, bl32)
  }

  const u8a = bigIntToUint8Array(bn)
  let length = u8a.length

  while (u8a[length - 1] === 0) {
    length--
  }

  if (length < 4) {
    throw new Error('Invalid length, previous checks match anything less than 2^30')
  }

  return u8aConcatStrict([
    new Uint8Array([((length - 4) << 2) + 0b11]),
    u8a.subarray(0, length),
  ])
}

export function compactAddLength(input: Uint8Array): Uint8Array {
  return u8aConcatStrict([
    compactToU8a(input.length),
    input,
  ])
}
