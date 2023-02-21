import {describe, test, expect} from 'vitest'
import {bigIntToUint8Array, hexStringToUint8Array, toTwos, uInt8ArrayToHex} from './bytes'
import * as BN from 'bn.js'

describe('bytes', () => {
  test('toTwos polyfill', (t) => {
    const testCases = [
      {input: BigInt(0)},
      {input: BigInt(1)},
      {input: BigInt(-1)},
      {input: BigInt(127)},
      {input: BigInt(-128)},
      {input: BigInt(128)},
      {input: BigInt(-129)},
      {input: BigInt('999999999999999999')},
      {input: BigInt('-1000000000000000000')},
    ]

    for (const {input} of testCases) {
      const result = toTwos(input, 256)
      const bn = new BN.BN(input.toString(10)).toTwos(256).toString(10)
      expect(result.toString(10)).toEqual(bn)
    }
  })

  test('Function uInt8ArrayToHex: Uint8Array to hex string', () => {
    expect(uInt8ArrayToHex(new Uint8Array([0, 1, 2, 3]))).toEqual('0x00010203')
  })
})

describe('bigIntToUint8Array', (): void => {
  test('converts null values to 0x00', (): void => {
    expect(
      bigIntToUint8Array(null),
    ).toEqual(new Uint8Array(1))
  })

  test('converts null values to 0x00000000 (bitLength)', (): void => {
    expect(
      bigIntToUint8Array(null, {bitLength: 32}),
    ).toEqual(new Uint8Array([0, 0, 0, 0]))
  })

  test('converts BN values to a prefixed hex representation', (): void => {
    expect(
      bigIntToUint8Array(0x123456n, {isLe: false}),
    ).toEqual(new Uint8Array([0x12, 0x34, 0x56]))
  })

  test('converts BN values to a prefixed hex representation (bitLength)', (): void => {
    expect(
      bigIntToUint8Array(0x123456n, {bitLength: 32, isLe: false}),
    ).toEqual(new Uint8Array([0x00, 0x12, 0x34, 0x56]))
  })

  test('converts using little endian (as set)', (): void => {
    expect(
      bigIntToUint8Array(0x123456n, {bitLength: 32, isLe: true}),
    ).toEqual(new Uint8Array([0x56, 0x34, 0x12, 0x00]))
  })

  describe('signed', (): void => {
    test('converts negative numbers (BE)', (): void => {
      expect(
        bigIntToUint8Array(-1234n, {isLe: false, isNegative: true}),
      ).toEqual(new Uint8Array([251, 46]))
    })

    test('converts negative numbers (LE, i8)', (): void => {
      expect(
        bigIntToUint8Array(-12n, {isNegative: true}),
      ).toEqual(new Uint8Array([244]))
    })

    test('converts negative numbers (LE, i16)', (): void => {
      expect(
        bigIntToUint8Array(-1234n, {isNegative: true}),
      ).toEqual(new Uint8Array([46, 251]))
    })

    test('converts negative numbers (LE, i24)', (): void => {
      expect(
        bigIntToUint8Array(-123456n, {isNegative: true}),
      ).toEqual(new Uint8Array([192, 29, 254]))
    })

    test('converts negative numbers (LE, i32)', (): void => {
      expect(
        bigIntToUint8Array(-123456789n, {isNegative: true}),
      ).toEqual(new Uint8Array([235, 50, 164, 248]))
    })

    test('converts negative numbers (LE, i40)', (): void => {
      expect(
        bigIntToUint8Array(-5678999999n, {isNegative: true}),
      ).toEqual(new Uint8Array([65, 86, 129, 173, 254]))
    })

    test('converts negative numbers (LE, i48)', (): void => {
      expect(
        bigIntToUint8Array(-9999999999999n, {isNegative: true}),
      ).toEqual(new Uint8Array([1, 96, 141, 177, 231, 246]))
    })

    test('converts negative numbers (LE, i64)', (): void => {
      expect(
        bigIntToUint8Array(-999999999999999999n, {isNegative: true}),
      ).toEqual(new Uint8Array([1, 0, 156, 88, 76, 73, 31, 242]))
    })

    test('converts negative numbers (LE, bitLength)', (): void => {
      expect(
        bigIntToUint8Array(-1234n, {bitLength: 32, isNegative: true}),
      ).toEqual(new Uint8Array([46, 251, 255, 255]))
    })

    test('converts negative numbers (LE, bitLength)', (): void => {
      expect(
        bigIntToUint8Array(-123456n, {bitLength: 32, isNegative: true}),
      ).toEqual(new Uint8Array([192, 29, 254, 255]))
    })
  })
})

describe('hexStringToUint8Array', (): void => {
  test('returns an empty Uint8Array when null provided', (): void => {
    expect(
      hexStringToUint8Array(null),
    ).toHaveLength(0)
  })

  test('returns an empty Uint8Array when 0x provided', (): void => {
    expect(
      hexStringToUint8Array('0x'),
    ).toHaveLength(0)
  })

  test('returns a Uint8Array with the correct values', (): void => {
    expect(
      hexStringToUint8Array('0x80000a'),
    ).toEqual(
      new Uint8Array([128, 0, 10]),
    )
  })

  test('returns a Uint8Array with the correct values (bitLength > provided)', (): void => {
    expect(
      hexStringToUint8Array('0x80000A', 64),
    ).toEqual(
      new Uint8Array([0, 0, 0, 0, 0, 128, 0, 10]),
    )
  })

  test('returns a Uint8Array with the correct values (bitLength < provided)', (): void => {
    expect(
      hexStringToUint8Array('0x80000a', 16),
    ).toEqual(
      new Uint8Array([128, 0]),
    )
  })

  test('converts a non-aligned string', (): void => {
    expect(
      hexStringToUint8Array('0x1230'),
    ).toEqual(new Uint8Array([0x12, 0x30]))
  })

  test('fails when not aligned hex value provided', (): void => {
    expect(
      () => hexStringToUint8Array('0x123'),
    ).toThrow(/Invalid hex string/)
  })

  test('converts known bytes to their correct values', (): void => {
    expect(
      hexStringToUint8Array('0x68656c6c6f20776f726c64'), // hello world (11 bytes, non-aligned)
    ).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]))
  })

  test('converts known bytes to their correct values (upper/lower)', (): void => {
    expect(
      hexStringToUint8Array('0x68656C6c6f20776F726c64'), // hello world (11 bytes, non-aligned)
    ).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]))
  })

  test('fails when non-hex value provided', (): void => {
    expect(
      () => hexStringToUint8Array('notahex'),
    ).toThrow(/Invalid hex string/)
  })
})
