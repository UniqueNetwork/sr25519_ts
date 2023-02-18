import {describe, test, expect, beforeAll} from 'vitest'
import {mnemonicToMiniSecret} from './mnemonicToMiniSecret'
import * as utilCrypto from '@polkadot/util-crypto'

const TEST_MNEMONIC = 'already peasant brick narrow jungle glimpse arena enhance regular gift raven cheese'

describe('mnemonic', async () => {
  beforeAll(async () => {
    await utilCrypto.cryptoWaitReady()
  })
  test('should work', async () => {
    const miniSecret = (await mnemonicToMiniSecret(TEST_MNEMONIC))
    console.log('miniSecret', miniSecret)
    expect(miniSecret).toEqual(utilCrypto.mnemonicToMiniSecret(TEST_MNEMONIC))
  })
})
