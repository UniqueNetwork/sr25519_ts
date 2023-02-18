import {describe, expect, test} from 'vitest'
import {divideScalarBytesByCofactor, multiplyScalarBytesByCofactor} from './utils'

import * as crypto from 'node:crypto'

describe('utils - cofactor', () => {
  test('cofactor adjustment', () => {
    const x = new Uint8Array(crypto.randomBytes(32))
    x[31] &= 0b00011111
    const y = x.slice()
    multiplyScalarBytesByCofactor(y)
    divideScalarBytesByCofactor(y)
    expect(x).toEqual(y)
  })

  test('cofactor adjustment 2', () => {
    const x = new Uint8Array(crypto.randomBytes(32))
    x[0] &= 0b11111000
    const y = x.slice()
    divideScalarBytesByCofactor(y)
    multiplyScalarBytesByCofactor(y)
    expect(x).toEqual(y)
  })
})
