import {describe, test, expect, beforeAll} from 'vitest'
import {deriveHard, deriveSoft, mnemonicToMiniSecret, mnemonicToMiniSecretSync} from './mnemonic'
import {Keypair} from '../../src/keypair'


import * as utilCrypto from '@polkadot/util-crypto'
import {b, hex, toHex} from '../merlin/utils'
import {getChainCode} from './uri'
import {Transcript} from '../merlin/transcript'

const TEST_MNEMONIC = 'already peasant brick narrow jungle glimpse arena enhance regular gift raven cheese'

describe('mnemonic', async () => {
  beforeAll(async () => {
    await utilCrypto.cryptoWaitReady()
  })
  test('mnemonicToMiniSecret - async', async () => {
    const miniSecret = (await mnemonicToMiniSecret(TEST_MNEMONIC))
    expect(miniSecret).toEqual(utilCrypto.mnemonicToMiniSecret(TEST_MNEMONIC))
  })
  test('mnemonicToMiniSecret - sync', () => {
    const miniSecret = mnemonicToMiniSecretSync(TEST_MNEMONIC)
    expect(miniSecret).toEqual(utilCrypto.mnemonicToMiniSecret(TEST_MNEMONIC))
  })
})

const miniSecret = Uint8Array.from([105, 235, 55, 249, 142, 185, 103, 97, 97, 104, 76, 250, 145, 84, 75, 168, 144, 128, 238, 87, 141, 15, 138, 11, 235, 152, 24, 104, 218, 160, 36, 213])

const bytesAfterExpansionEd25519 = Uint8Array.from([30, 120, 176, 79, 67, 254, 41, 88, 121, 198, 7, 156, 78, 186, 158, 13, 126, 139, 108, 58, 10, 172, 69, 14, 70, 220, 122, 164, 97, 221, 119, 10])
const nonceAfterExpansionEd25519 = Uint8Array.from([29, 191, 186, 31, 159, 142, 55, 180, 204, 87, 138, 111, 225, 163, 66, 24, 106, 80, 11, 149, 214, 75, 157, 103, 190, 40, 72, 79, 0, 63, 163, 0])

// CompressedRistrettoPoint
const publicKey = Uint8Array.from([216, 0, 178, 146, 92, 17, 182, 173, 172, 73, 97, 148, 231, 190, 3, 128, 230, 141, 248, 170, 100, 157, 253, 26, 114, 229, 182, 227, 99, 82, 162, 8])


const PHRASE = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'

const miniSecretForPhrase = Uint8Array.from([250, 199, 149, 157, 191, 231, 47, 5, 46, 90, 12, 60, 141, 101, 48, 242, 2, 176, 47, 216, 249, 245, 202, 53, 128, 236, 141, 235, 119, 151, 71, 158])

const miniSecretForPhraseWithPassword = Uint8Array.from([112, 147, 171, 8, 215, 171, 187, 103, 255, 65, 71, 154, 152, 239, 153, 142, 75, 231, 115, 144, 31, 19, 102, 138, 1, 47, 81, 210, 7, 87, 122, 136])

const FOR_PHRASE = {
  miniSecret: Uint8Array.from([
    250, 199, 149, 157, 191, 231, 47, 5,
    46, 90, 12, 60, 141, 101, 48, 242,
    2, 176, 47, 216, 249, 245, 202, 53,
    128, 236, 141, 235, 119, 151, 71, 158
  ]),
  publicKey: Uint8Array.from([
    70, 235, 221, 239, 140, 217, 187, 22,
    125, 195, 8, 120, 215, 17, 59, 126,
    22, 142, 111, 6, 70, 190, 255, 215,
    125, 105, 211, 155, 173, 118, 180, 122
  ]),
  secretKeyWithNonce: Uint8Array.from([
    40, 176, 174, 34, 28, 107, 176, 104,
    86, 178, 135, 246, 13, 126, 160, 217,
    133, 82, 234, 90, 22, 219, 22, 149,
    104, 73, 170, 55, 29, 179, 235, 81,

    253, 25, 12, 206, 116, 223, 53, 100,
    50, 180, 16, 189, 100, 104, 35, 9,
    214, 222, 219, 39, 199, 104, 69, 218,
    243, 136, 85, 124, 186, 195, 202, 52
  ]),
  secretKey: Uint8Array.from([
    5, 214, 85, 132, 99, 13, 22, 205,
    74, 246, 208, 190, 193, 15, 52, 187,
    80, 74, 93, 203, 98, 219, 162, 18,
    45, 73, 245, 166, 99, 118, 61, 10
  ]),
  // full is the secretKey (key is multiplied by the cofactor) + publicKey
  // full is from the rust implementation
  full: Uint8Array.from([40, 176, 174, 34, 28, 107, 176, 104, 86, 178, 135, 246, 13, 126, 160, 217, 133, 82, 234, 90, 22, 219, 22, 149, 104, 73, 170, 55, 29, 179, 235, 81, 253, 25, 12, 206, 116, 223, 53, 100, 50, 180, 16, 189, 100, 104, 35, 9, 214, 222, 219, 39, 199, 104, 69, 218, 243, 136, 85, 124, 186, 195, 202, 52, 70, 235, 221, 239, 140, 217, 187, 22, 125, 195, 8, 120, 215, 17, 59, 126, 22, 142, 111, 6, 70, 190, 255, 215, 125, 105, 211, 155, 173, 118, 180, 122]),
}

const formatNumbers = (numbers: number[] | Uint8Array): string => {
  let output = '';
  for (let i = 0; i < numbers.length; i++) {
    output += numbers[i] + ',';
    if ((i + 1) % 16 === 0) {
      output += '\n';
    }
  }
  return output;
}
const printTranscript = (transcript: Transcript) => {
  const strobe = transcript.cloneStrobe().clone().cloneState()
  console.log('state', formatNumbers(strobe.state))
  console.log('pos', strobe.pos)
  console.log('pos_begin', strobe.pos_begin)
  console.log('cur_flags', strobe.cur_flags)
}

describe('keys', async () => {
  test('should work', async () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecretSync(PHRASE))
    expect(keypair.publicKey.key).toEqual(FOR_PHRASE.publicKey)
    expect(keypair.secretKey.getInConcatenatedForm()).toEqual(FOR_PHRASE.secretKeyWithNonce)
    expect(keypair.secretKey.key.bytes).toEqual(FOR_PHRASE.secretKey)

    expect(keypair.ToBytes()).toEqual(FOR_PHRASE.full)
  })

  test('should work with sr25519', async () => {
    const miniSecret = await mnemonicToMiniSecret(PHRASE)
    expect(miniSecret).toEqual(miniSecretForPhrase)
  })

  test('should work with sr25519 - with password', async () => {
    const miniSecret = await mnemonicToMiniSecret(PHRASE, 'password')
    expect(miniSecret).toEqual(miniSecretForPhraseWithPassword)
  })

  test('hard derivation', async () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecretSync(PHRASE))

    const derivedKeypair = deriveHard(
      keypair.secretKey.key.bytes.slice(),
      getChainCode('Alice')
    )

    expect(derivedKeypair.publicKey.key).toEqual(Uint8Array.from([212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154, 86, 132, 231, 165, 109, 162, 125]))
  })

  test('soft derivation', async () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecretSync(PHRASE))

    const derivedKeypair = deriveSoft(
      keypair,
      getChainCode('foo')
    )

    expect(derivedKeypair.publicKey.key).toEqual(Uint8Array.from([64, 185, 103, 93, 249, 14, 250, 96, 105, 255, 98, 59, 15, 223, 207, 112, 108, 212, 124, 167, 69, 42, 80, 86, 199, 173, 88, 25, 77, 35, 68, 10]))
    expect(derivedKeypair.secretKey.key.bytes).toEqual(Uint8Array.from([81, 163, 64, 84, 147, 172, 216, 60, 75, 176, 212, 16, 43, 255, 149, 194, 180, 247, 53, 31, 207, 161, 207, 81, 26, 128, 110, 153, 201, 220, 120, 14]))
  })
})


