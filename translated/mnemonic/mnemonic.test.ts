import {describe, test, expect, beforeAll} from 'vitest'
import {mnemonic, mnemonicToMiniSecretSync} from './mnemonic'
import {Keypair} from '../../src/keypair'


import * as utilCrypto from '@polkadot/util-crypto'

const TEST_MNEMONIC = 'already peasant brick narrow jungle glimpse arena enhance regular gift raven cheese'

describe('mnemonic', async () => {
  beforeAll(async () => {
    await utilCrypto.cryptoWaitReady()
  })
  test('mnemonic - async', async () => {
    const miniSecret = (await mnemonic(TEST_MNEMONIC))
    expect(miniSecret).toEqual(utilCrypto.mnemonicToMiniSecret(TEST_MNEMONIC))
  })
  test('mnemonic - sync', () => {
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



describe('keys', async () => {
  test('should work', async () => {
    const keypair = Keypair.FromMiniSecret(miniSecret)
    expect(keypair.secretKey.key.bytes).toEqual(bytesAfterExpansionEd25519)
    expect(keypair.secretKey.nonce).toEqual(nonceAfterExpansionEd25519)
    expect(keypair.publicKey.key).toEqual(publicKey)
  })

  test('should work with sr25519', async () => {
    const miniSecret = await mnemonic(PHRASE)
    expect(miniSecret).toEqual(miniSecretForPhrase)
  })

  test('should work with sr25519 - with password', async () => {
    const miniSecret = await mnemonic(PHRASE, 'password')
    expect(miniSecret).toEqual(miniSecretForPhraseWithPassword)
  })
})


