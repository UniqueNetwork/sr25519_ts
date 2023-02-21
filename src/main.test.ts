import {describe, test, expect, beforeAll} from 'vitest'

import {getAccount, utils} from './index'
import {encodeSubstrateAddress} from './address'
import {b, hex} from '../translated/templateLiteralFunctions'
import {DEFAULT_MNEMONIC} from '../translated/mnemonic/uri'
import * as utilCrypto from '@polkadot/util-crypto'
import {mnemonicToMiniSecret} from '../translated/mnemonic/mnemonic'
import {uInt8ArrayToHex} from '../translated/mnemonic/bytes'

const Alice = {
  uri: '//Alice',
  publicKey: Uint8Array.from([212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154, 86, 132, 231, 165, 109, 162, 125]),
  address: {
    default: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    unique: 'unjKJQJrRd238pkUZZvzDQrfKuM39zBSnQ5zjAGAGcdRhaJTx'
  }
}

describe('main test', async () => {
  beforeAll(async () => {
    await utilCrypto.cryptoWaitReady()
  })

  test('getAccount', () => {
    const account = getAccount(Alice.uri)
    expect(account.publicKey).toEqual(Alice.publicKey)
    expect(account.address).toEqual(Alice.address.default)
  })

  test('account address', () => {
    const address42 = encodeSubstrateAddress(Alice.publicKey)
    const address7391 = encodeSubstrateAddress(Alice.publicKey, 7391)
    expect(address42).toEqual(Alice.address.default)
    expect(address7391).toEqual(Alice.address.unique)

    const account = getAccount(Alice.uri)
    expect(account.address).toEqual(Alice.address.default)
    expect(account.prefixedAddress(7391)).toEqual(Alice.address.unique)
  })

  test('secretKey as in polkadot lib', () => {
    const miniSecretFromPolkadot = utilCrypto.mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    const miniSecretFromOurLib = mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    expect(miniSecretFromPolkadot).toEqual(miniSecretFromOurLib)

    const keypairFromPolkadot = utilCrypto.sr25519PairFromSeed(miniSecretFromPolkadot)
    const keypairFromOurLib = utils.dangerouslyParseUriAndGetFullKeypair(DEFAULT_MNEMONIC)

    expect(keypairFromPolkadot.publicKey).toEqual(keypairFromOurLib.publicKey.key)
    expect(keypairFromPolkadot.secretKey).toEqual(keypairFromOurLib.secretKey.ToBytes())
  })

  test('sign', () => {
    const account = getAccount(Alice.uri)
    const message = b`hello world`
    const signature = account.sign(message)
    const isValid = utilCrypto.sr25519Verify(message, signature, account.publicKey)
    expect(isValid).toBe(true)

    const isValid2 = account.verify(message, signature)
    //todo: fix this
  })

  test('sign with uniqueSdkSigner', async () => {
    const account = getAccount(Alice.uri)
    const message = b`hello world`
    const signResult = await account.uniqueSdkSigner.sign({signerPayloadHex: uInt8ArrayToHex(message)})

    const isValid = utilCrypto.sr25519Verify(
      message,
      // cut off the '0x' prefix and the first byte which is the signature type
      '0x' + signResult.signature.slice(4),
      account.publicKey
    )
    expect(isValid).toBe(true)
  })

  test('verify', () => {
    const keypair = utils.dangerouslyParseUriAndGetFullKeypair(Alice.uri)
    const account = getAccount(Alice.uri)
    const publicKey = account.publicKey

    //check that the account is the same as the keypair
    expect(publicKey).toEqual(keypair.publicKey.key)

    const message = b`hello world`
    const signature = utilCrypto.sr25519Sign(
      message,
      {
        publicKey,
        secretKey: keypair.secretKey.ToBytes()
      }
    )
    const isValidWithPolkadotVerifier = utilCrypto.sr25519Verify(message, signature, publicKey)
    expect(isValidWithPolkadotVerifier).toBe(true)

    const isValidWithOurVerifier = account.verify(message, signature)
    expect(isValidWithOurVerifier).toBe(true)
  })

  test('verify quick test', () => {
    const account = getAccount(Alice.uri)
    const message = b`abc`
    const signature = hex`8204a21d35c2e09ad44908b9835aea2a224944fa67ccfa3c69999aa03fe2882049a9fdab728795f0f8d1ee40e1f413574635ddf58600990277625d31dd031083`

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(true)
    expect(account.verify(message, signature)).toBe(true)
  })

  test('verify quick test - negative', () => {
    const account = getAccount(Alice.uri)
    const message = b`abd`
    const signature = hex`8204a21d35c2e09ad44908b9835aea2a224944fa67ccfa3c69999aa03fe2882049a9fdab728795f0f8d1ee40e1f413574635ddf58600990277625d31dd031083`

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(false)
    expect(account.verify(message, signature)).toBe(false)

    message[2] = 0x63   // abd -> abc
    signature[1] = 0x23 // just mangle the signature

    expect(utilCrypto.sr25519Verify(message, signature, account.publicKey)).toBe(false)
    expect(account.verify(message, signature)).toBe(false)
  })
})

