import {describe, test, expect, beforeAll} from "vitest";

import * as polkadotUtilCrypto from '@polkadot/util-crypto'

import {Sr25519} from '../src'

beforeAll(async () => {
  await polkadotUtilCrypto.cryptoWaitReady()
})

describe('main', async () => {
  test('sign', async () => {

    // 42 format:     5GuuxfuxbvaiwteUrV9U7Mj2Fz7TWK84WhLaZdMMJRvSuzr4
    // Kusama format: HRXczFqEHbehYTvdBxX1K62QaPhJywEy5BKxHdJnE8wfHH1
    // public key:    0xd678b3e00c4238888bbf08dbbe1d7de77c3f1ca1fc71a5a283770f06f7cd1205
    const publicKey = Uint8Array.from([214, 120, 179, 224, 12, 66, 56, 136, 139, 191, 8, 219, 190, 29, 125, 231, 124, 63, 28, 161, 252, 113, 165, 162, 131, 119, 15, 6, 247, 205, 18, 5])
    const secretKey = Uint8Array.from([168, 16, 86, 215, 19, 175, 31, 241, 123, 89, 158, 96, 210, 135, 149, 46, 137, 48, 27, 82, 8, 50, 74, 5, 41, 182, 45, 199, 54, 156, 116, 93, 239, 201, 200, 221, 103, 183, 197, 155, 32, 27, 193, 100, 22, 58, 137, 120, 212, 0, 16, 194, 39, 67, 219, 20, 42, 71, 242, 224, 100, 72, 13, 75])

    // test message: 'abc'
    const message = Uint8Array.from([97, 98, 99])

    const signature = Sr25519.sign(message, {publicKey, secretKey})

    const isValid = polkadotUtilCrypto.sr25519Verify(message, signature, publicKey)

    expect(isValid).toBe(true)
  })
})
