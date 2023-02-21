import {describe, expect, test} from 'vitest'
import {divideScalarBytesByCofactor, multiplyScalarBytesByCofactor} from './utils'
import * as crypto from 'node:crypto'

describe('utils', () => {
  test('Cofactor multiply and divide', () => {
    const x = new Uint8Array(crypto.randomBytes(32))
    x[31] &= 0b00011111
    const y = x.slice()
    multiplyScalarBytesByCofactor(y)
    divideScalarBytesByCofactor(y)
    expect(x).toEqual(y)
  })

  test('Cofactor divide and multiply', () => {
    const x = new Uint8Array(crypto.randomBytes(32))
    x[0] &= 0b11111000
    const y = x.slice()
    divideScalarBytesByCofactor(y)
    multiplyScalarBytesByCofactor(y)
    expect(x).toEqual(y)
  })
})
