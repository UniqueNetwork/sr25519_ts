import {describe, test, expect, beforeAll} from 'vitest'

import {Account} from './index'
import {encodeSubstrateAddress} from './address'
import {b, hex} from '../translated/templateLiteralFunctions'
import {DEFAULT_MNEMONIC} from '../translated/mnemonic/uri'
import * as utilCrypto from '@polkadot/util-crypto'
import {mnemonicToMiniSecret} from '../translated/mnemonic/mnemonic'
import {uInt8ArrayToHex} from '../translated/mnemonic/bytes'
import {Keypair} from './keypair'

const Alice = {
  uri: '//Alice',
  publicKey: Uint8Array.from([212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154, 86, 132, 231, 165, 109, 162, 125]),
  address: {
    default: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    unique: 'unjKJQJrRd238pkUZZvzDQrfKuM39zBSnQ5zjAGAGcdRhaJTx',
  },
}

describe('main test', async() => {
  beforeAll(async() => {
    await utilCrypto.cryptoWaitReady()
  })

  test('getAccount', () => {
    const account = Account.fromUri(Alice.uri)
    expect(account.publicKey).toEqual(Alice.publicKey)
    expect(account.address).toEqual(Alice.address.default)
  })

  test('account address', () => {
    const address42 = encodeSubstrateAddress(Alice.publicKey)
    const address7391 = encodeSubstrateAddress(Alice.publicKey, 7391)
    expect(address42).toEqual(Alice.address.default)
    expect(address7391).toEqual(Alice.address.unique)

    const account = Account.fromUri(Alice.uri)
    expect(account.address).toEqual(Alice.address.default)
    expect(account.prefixedAddress(7391)).toEqual(Alice.address.unique)
  })

  test('secretKey as in polkadot lib', () => {
    const miniSecretFromPolkadot = utilCrypto.mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    const miniSecretFromOurLib = mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    expect(miniSecretFromPolkadot).toEqual(miniSecretFromOurLib)

    const keypairFromPolkadot = utilCrypto.sr25519PairFromSeed(miniSecretFromPolkadot)
    const keypairFromOurLib = Account.other.dangerouslyParseUriAndGetFullKeypair(DEFAULT_MNEMONIC)

    expect(keypairFromPolkadot.publicKey).toEqual(keypairFromOurLib.publicKey.key)
    expect(keypairFromPolkadot.secretKey).toEqual(keypairFromOurLib.secretKey.ToBytes())
  })

  test('sign', () => {
    const account = Account.fromUri(Alice.uri)
    const message = b`hello world`
    const signature = account.sign(message)
    const isValid = utilCrypto.sr25519Verify(message, signature, account.publicKey)
    expect(isValid).toBe(true)

    expect(account.verify(message, signature)).toBe(true)
  })

  test('sign with a signer for Unique SDK', async() => {
    const account = Account.fromUri(Alice.uri)
    const message = b`hello world`
    const signResult = await account.signer.sign({signerPayloadHex: uInt8ArrayToHex(message)})

    const isValid = utilCrypto.sr25519Verify(
      message,
      // cut off the '0x' prefix and the first byte which is the signature type
      '0x' + signResult.signature.slice(4),
      account.publicKey,
    )
    expect(isValid).toBe(true)
  })

  test('verify', () => {
    const keypair = Account.other.dangerouslyParseUriAndGetFullKeypair(Alice.uri)
    const account = Account.fromUri(Alice.uri)
    const publicKey = account.publicKey

    // check that the account is the same as the keypair
    expect(publicKey).toEqual(keypair.publicKey.key)

    const message = b`hello world`
    const signature = utilCrypto.sr25519Sign(
      message,
      {
        publicKey,
        secretKey: keypair.secretKey.ToBytes(),
      },
    )
    const isValidWithPolkadotVerifier = utilCrypto.sr25519Verify(message, signature, publicKey)
    expect(isValidWithPolkadotVerifier).toBe(true)

    const isValidWithOurVerifier = account.verify(message, signature)
    expect(isValidWithOurVerifier).toBe(true)
  })

  test('verify quick test', () => {
    const account = Account.fromUri(Alice.uri)
    const message = b`abc`
    const signature = hex`8204a21d35c2e09ad44908b9835aea2a224944fa67ccfa3c69999aa03fe2882049a9fdab728795f0f8d1ee40e1f413574635ddf58600990277625d31dd031083`

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(true)
    expect(account.verify(message, signature)).toBe(true)
  })

  test('verify quick test - negative', () => {
    const account = Account.fromUri(Alice.uri)
    const message = b`abd`
    const signature = hex`8204a21d35c2e09ad44908b9835aea2a224944fa67ccfa3c69999aa03fe2882049a9fdab728795f0f8d1ee40e1f413574635ddf58600990277625d31dd031083`

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(false)
    expect(account.verify(message, signature)).toBe(false)

    message[2] = 0x63 // abd -> abc
    signature[1] = 0x23 // just mangle the signature

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(false)
    expect(account.verify(message, signature)).toBe(false)
  })
})

describe('extra tests', async() => {
  test('sign with random keys', async() => {
    // test message: 'abc'
    const message = Uint8Array.from([97, 98, 99])

    const mn = utilCrypto.mnemonicToMiniSecret(utilCrypto.mnemonicGenerate(18))
    const kp = utilCrypto.sr25519PairFromSeed(mn)

    const publicKey = kp.publicKey
    const secretKey = kp.secretKey

    const controlSignature = utilCrypto.sr25519Sign(message, {
      publicKey,
      secretKey,
    })

    const controlIsValid = utilCrypto.sr25519Verify(
      message,
      controlSignature,
      publicKey,
    )
    expect(controlIsValid).toBe(true)

    const keypair = Keypair.FromSecretKeyBytes(secretKey)

    const signature = keypair.secretKey.sign(message, keypair.publicKey).ToBytes()
    const isValid = utilCrypto.sr25519Verify(message, signature, publicKey)
    expect(isValid).toBe(true)
  })

  test('sign with old keys', async() => {
    // test message: 'abc'
    const message = Uint8Array.from([97, 98, 99])

    // 42 format:     5GuuxfuxbvaiwteUrV9U7Mj2Fz7TWK84WhLaZdMMJRvSuzr4
    // Kusama format: HRXczFqEHbehYTvdBxX1K62QaPhJywEy5BKxHdJnE8wfHH1
    // public key:    0xd678b3e00c4238888bbf08dbbe1d7de77c3f1ca1fc71a5a283770f06f7cd1205
    const publicKey = Uint8Array.from([
      214, 120, 179, 224, 12, 66, 56, 136, 139, 191, 8, 219, 190, 29, 125, 231,
      124, 63, 28, 161, 252, 113, 165, 162, 131, 119, 15, 6, 247, 205, 18, 5,
    ])
    const secretKey = Uint8Array.from([
      168, 16, 86, 215, 19, 175, 31, 241, 123, 89, 158, 96, 210, 135, 149, 46,
      137, 48, 27, 82, 8, 50, 74, 5, 41, 182, 45, 199, 54, 156, 116, 93, 239,
      201, 200, 221, 103, 183, 197, 155, 32, 27, 193, 100, 22, 58, 137, 120,
      212, 0, 16, 194, 39, 67, 219, 20, 42, 71, 242, 224, 100, 72, 13, 75,
    ])

    const controlSignature = utilCrypto.sr25519Sign(message, {publicKey, secretKey})

    const controlIsValid = utilCrypto.sr25519Verify(message, controlSignature, publicKey)
    expect(controlIsValid).toBe(true)

    const keypair = Keypair.FromSecretKeyBytes(secretKey)
    const signature = keypair.secretKey.sign(message, keypair.publicKey).ToBytes()

    expect(utilCrypto.sr25519Verify(message, signature, publicKey)).toBe(true)
    expect(keypair.publicKey.verify(message, signature)).toBe(true)
  })
})
