import {describe, test, expect, beforeAll} from 'vitest'
import {
  mnemonicToMiniSecretAsync,
  mnemonicToMiniSecret,
  entropyToMnemonic,
  generateMnemonic,
  validateMnemonic,
} from './mnemonic'
import {Keypair} from '../../src/keypair'
import {randomBytes} from '@noble/hashes/utils'
import {entropyToMnemonic as entropyToMnemonicFromLib} from '@polkadot/util-crypto/mnemonic/bip39'
import Sr25519Account from '../../src'

const PHRASE = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'

const miniSecretForPhrase = Uint8Array.from([250, 199, 149, 157, 191, 231, 47, 5, 46, 90, 12, 60, 141, 101, 48, 242, 2, 176, 47, 216, 249, 245, 202, 53, 128, 236, 141, 235, 119, 151, 71, 158])

const miniSecretForPhraseWithPassword = Uint8Array.from([112, 147, 171, 8, 215, 171, 187, 103, 255, 65, 71, 154, 152, 239, 153, 142, 75, 231, 115, 144, 31, 19, 102, 138, 1, 47, 81, 210, 7, 87, 122, 136])

const FOR_PHRASE = {
  miniSecret: Uint8Array.from([
    250, 199, 149, 157, 191, 231, 47, 5,
    46, 90, 12, 60, 141, 101, 48, 242,
    2, 176, 47, 216, 249, 245, 202, 53,
    128, 236, 141, 235, 119, 151, 71, 158,
  ]),
  publicKey: Uint8Array.from([
    70, 235, 221, 239, 140, 217, 187, 22,
    125, 195, 8, 120, 215, 17, 59, 126,
    22, 142, 111, 6, 70, 190, 255, 215,
    125, 105, 211, 155, 173, 118, 180, 122,
  ]),
  secretKeyWithNonce: Uint8Array.from([
    40, 176, 174, 34, 28, 107, 176, 104,
    86, 178, 135, 246, 13, 126, 160, 217,
    133, 82, 234, 90, 22, 219, 22, 149,
    104, 73, 170, 55, 29, 179, 235, 81,

    253, 25, 12, 206, 116, 223, 53, 100,
    50, 180, 16, 189, 100, 104, 35, 9,
    214, 222, 219, 39, 199, 104, 69, 218,
    243, 136, 85, 124, 186, 195, 202, 52,
  ]),
  secretKey: Uint8Array.from([
    5, 214, 85, 132, 99, 13, 22, 205,
    74, 246, 208, 190, 193, 15, 52, 187,
    80, 74, 93, 203, 98, 219, 162, 18,
    45, 73, 245, 166, 99, 118, 61, 10,
  ]),
  // full is the secretKey (key is multiplied by the cofactor) + publicKey
  // full is from the rust implementation
  full: Uint8Array.from([40, 176, 174, 34, 28, 107, 176, 104, 86, 178, 135, 246, 13, 126, 160, 217, 133, 82, 234, 90, 22, 219, 22, 149, 104, 73, 170, 55, 29, 179, 235, 81, 253, 25, 12, 206, 116, 223, 53, 100, 50, 180, 16, 189, 100, 104, 35, 9, 214, 222, 219, 39, 199, 104, 69, 218, 243, 136, 85, 124, 186, 195, 202, 52, 70, 235, 221, 239, 140, 217, 187, 22, 125, 195, 8, 120, 215, 17, 59, 126, 22, 142, 111, 6, 70, 190, 255, 215, 125, 105, 211, 155, 173, 118, 180, 122]),
}

describe('mini secret', async () => {
  test('on phrase', async () => {
    const miniSecret = mnemonicToMiniSecret(PHRASE)
    expect(miniSecret).toEqual(miniSecretForPhrase)
  })

  test('on phrase - async', async () => {
    const miniSecret = await mnemonicToMiniSecretAsync(PHRASE)
    expect(miniSecret).toEqual(miniSecretForPhrase)
  })

  test('on phrase with password', () => {
    const miniSecret = mnemonicToMiniSecret(PHRASE, 'password')
    expect(miniSecret).toEqual(miniSecretForPhraseWithPassword)
  })

  test('on phrase with password - async', async () => {
    const miniSecret = await mnemonicToMiniSecretAsync(PHRASE, 'password')
    expect(miniSecret).toEqual(miniSecretForPhraseWithPassword)
  })

  test('keypair - from mini secret', () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecret(PHRASE))

    expect(keypair.publicKey.key).toEqual(FOR_PHRASE.publicKey)
    expect(keypair.secretKey.ToBytes()).toEqual(FOR_PHRASE.secretKeyWithNonce)
    expect(keypair.secretKey.key.bytes).toEqual(FOR_PHRASE.secretKey)

    expect(keypair.ToBytes()).toEqual(FOR_PHRASE.full)

    const keypairBack = Keypair.FromBytes(FOR_PHRASE.full)
    expect(keypairBack.publicKey.key).toEqual(FOR_PHRASE.publicKey)
    expect(keypairBack.secretKey.ToBytes()).toEqual(FOR_PHRASE.secretKeyWithNonce)
    expect(keypairBack.secretKey.key.bytes).toEqual(FOR_PHRASE.secretKey)
  })

  test('entropyToMnemonic', () => {
    const random = randomBytes(128 / 8) // 128 bit entropy for 12 word mnemonic
    const mnemonic = entropyToMnemonic(random)
    expect(mnemonic.split(' ').length).toEqual(12)

    const testMnemonic = entropyToMnemonicFromLib(random)
    expect(mnemonic).toEqual(testMnemonic)
  })

  test('generateMnemonic', () => {
    const mnemonic = generateMnemonic()
    expect(mnemonic.split(' ').length).toEqual(12)

    expect(validateMnemonic(mnemonic).result).toEqual(true)
    expect(Sr25519Account.fromUri(mnemonic).address).toBeTypeOf('string')
  })
})
