import {describe, expect, test} from 'vitest'
import {b, hex} from './templateLiteralFunctions'

describe('Template literal functions', () => {
  test('Template literal function "b"', () => {
    expect(b`hello world`).toEqual(new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]))
  })

  test('Template literal function "hex"', () => {
    expect(hex`0xdeadbeef`).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
    expect(hex`deadbeef`).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
    expect(() => { hex`0xdeadbeefg` }).toThrow('Invalid hex string')
  })
})
