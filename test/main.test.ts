import {describe, test, expect, beforeAll} from "vitest";

import * as polkadotUtilCrypto from '@polkadot/util-crypto'

import {Sr25519} from '../src'

beforeAll(async () => {
  await polkadotUtilCrypto.cryptoWaitReady()
})

describe('main', async () => {
  test('sign', async () => {
    // test message: 'abc'
    const message = Uint8Array.from([97, 98, 99])

    // new keys
    const publicKey = Uint8Array.from([212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154, 86, 132, 231, 165, 109, 162, 125]);
    const secretKey = Uint8Array.from([51, 166, 243, 9, 63, 21, 138, 113, 9, 246, 121, 65, 11, 239, 26, 12, 84, 22, 129, 69, 224, 206, 203, 77, 240, 6, 193, 194, 255, 251, 31, 9, 146, 90, 34, 93, 151, 170, 0, 104, 45, 106, 89, 185, 91, 24, 120, 12, 16, 215, 3, 35, 54, 232, 143, 52, 66, 180, 35, 97, 244, 166, 96, 17]);

    const controlSignature = polkadotUtilCrypto.sr25519Sign(message, {publicKey, secretKey})
    console.log(controlSignature);
    const controlIsValid = polkadotUtilCrypto.sr25519Verify(message, controlSignature, publicKey)
    expect(controlIsValid).toBe(true) // fails here

    const signature = Sr25519.sign(message, {publicKey, secretKey})
    const isValid = polkadotUtilCrypto.sr25519Verify(message, signature, publicKey)
    expect(isValid).toBe(true)
  })

  test('sign with old keys', async () => {
    // test message: 'abc'
    const message = Uint8Array.from([97, 98, 99])

    // Wrong keys format!
    // 42 format:     5GuuxfuxbvaiwteUrV9U7Mj2Fz7TWK84WhLaZdMMJRvSuzr4
    // Kusama format: HRXczFqEHbehYTvdBxX1K62QaPhJywEy5BKxHdJnE8wfHH1
    // public key:    0xd678b3e00c4238888bbf08dbbe1d7de77c3f1ca1fc71a5a283770f06f7cd1205
    const publicKey = Uint8Array.from([214, 120, 179, 224, 12, 66, 56, 136, 139, 191, 8, 219, 190, 29, 125, 231, 124, 63, 28, 161, 252, 113, 165, 162, 131, 119, 15, 6, 247, 205, 18, 5])
    const secretKey = Uint8Array.from([168, 16, 86, 215, 19, 175, 31, 241, 123, 89, 158, 96, 210, 135, 149, 46, 137, 48, 27, 82, 8, 50, 74, 5, 41, 182, 45, 199, 54, 156, 116, 93, 239, 201, 200, 221, 103, 183, 197, 155, 32, 27, 193, 100, 22, 58, 137, 120, 212, 0, 16, 194, 39, 67, 219, 20, 42, 71, 242, 224, 100, 72, 13, 75])

    const controlSignature = polkadotUtilCrypto.sr25519Sign(message, {publicKey, secretKey})
    console.log(controlSignature);
    const controlIsValid = polkadotUtilCrypto.sr25519Verify(message, controlSignature, publicKey)
    expect(controlIsValid).toBe(true)

    const signature = Sr25519.sign(message, {publicKey, secretKey})
    const isValid = polkadotUtilCrypto.sr25519Verify(message, signature, publicKey)

    expect(isValid).toBe(true) // fails here
  })
})
