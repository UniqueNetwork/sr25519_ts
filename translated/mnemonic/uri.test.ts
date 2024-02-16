import {describe, test, expect} from 'vitest'
import {
  getChainCode,
  parseUri,
  deriveHard,
  deriveSoft,
  parseUriAndDerive,
  parseUriAndDeriveAsync,
  DEFAULT_MNEMONIC,
} from './uri'
import {Keypair} from '../../src/keypair'
import {mnemonicToMiniSecret} from './mnemonic'
import * as utilCrypto from '@polkadot/util-crypto'
import {Sr25519Account} from '../../src'
import {uInt8ArrayToHex} from './bytes'

const PHRASE = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'

const EXTREMELY_COMPLEX_URI = PHRASE + '/a1//a2/255//12//0x123/0x1234/a6/qwertyuiopqwertyuiopqwertyuiop12'

const EXTREMELY_COMPLEX_URI_DERIVATIONS = [
  {
    value: 'a1',
    cc: Uint8Array.from([8, 97, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: 'a2',
    hard: true,
    cc: Uint8Array.from([8, 97, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: '255',
    cc: Uint8Array.from([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: '12',
    hard: true,
    cc: Uint8Array.from([12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: '0x123',
    hard: true,
    cc: Uint8Array.from([20, 48, 120, 49, 50, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: '0x1234',
    cc: Uint8Array.from([18, 52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: 'a6',
    cc: Uint8Array.from([8, 97, 54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  },
  {
    value: 'qwertyuiopqwertyuiopqwertyuiop12',
    cc: Uint8Array.from([196, 43, 87, 237, 164, 68, 8, 230, 67, 14, 101, 37, 14, 92, 151, 175, 6, 237, 178, 155, 23, 92, 240, 223, 3, 29, 25, 220, 198, 253, 159, 194]),
  },
]

const CCs = {
  foo: Uint8Array.from([12, 102, 111, 111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  bar: Uint8Array.from([12, 98, 97, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  42: Uint8Array.from([42, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  69: Uint8Array.from([69, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  Alice: Uint8Array.from([20, 65, 108, 105, 99, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
}

const sr25519TestData = [
  {
    pk: '0x46ebddef8cd9bb167dc30878d7113b7e168e6f0646beffd77d69d39bad76b47a',
    ss: '5DfhGyQdFobKM8NsWvEeAKk5EQQgYe9AydgJ7rMB6E1EqRzV',
    uri: PHRASE,
    uriParts: {mnemonic: PHRASE, password: '', derivations: []},
  },
  {
    pk: '0xb69355deefa7a8f33e9297f5af22e680f03597a99d4f4b1c44be47e7a2275802',
    ss: '5GC6LfpV352HtJPySfAecb5JdePtf4R9Vq49NUU8RhzgBqgq',
    uri: `${PHRASE}///password`,
    uriParts: {mnemonic: PHRASE, password: 'password', derivations: []},
  },
  {
    pk: '0x40b9675df90efa6069ff623b0fdfcf706cd47ca7452a5056c7ad58194d23440a',
    ss: '5DXZzrDxHbkQov4QBAY4TjpwnHCMrKXkomTnKSw8UArBEY5v',
    uri: `${PHRASE}/foo`,
    uriParts: {mnemonic: PHRASE, password: '', derivations: [{value: 'foo', cc: CCs.foo}]},
  },
  {
    pk: '0x547d4a55642ec7ebadc0bd29b6e570b8c926059b3c0655d4948075e9a7e6f31e',
    ss: '5DyV6fZuvPemWrUqBgWwTSgoV86w6xms3KhkFU6cQcWxU8eP',
    uri: `${PHRASE}//foo`,
    uriParts: {mnemonic: PHRASE, password: '', derivations: [{value: 'foo', cc: CCs.foo, hard: true}]},
  },
  {
    pk: '0x3841947ffcde6f5fef26fb68b59bb8665637e30e32ec2051f99cf6b9c674fe09',
    ss: '5DLU27is5iViNopQb2KxsTyPx6j4vCu8X3sk3j3NNLkPCqKM',
    uri: `${PHRASE}//foo/bar`,
    uriParts: {
      mnemonic: PHRASE,
      password: '',
      derivations: [{value: 'foo', cc: CCs.foo, hard: true}, {value: 'bar', cc: CCs.bar}],
    },
  },
  {
    pk: '0xdc142f7476a7b0aa262aeccf207f1d18daa90762db393006741e8a31f39dbc53',
    ss: '5H3GPTqDSpjkfDwbHy12PD6BWm8jvGSX4xYC8UMprHpTPcRg',
    uri: `${PHRASE}/foo//bar`,
    uriParts: {
      mnemonic: PHRASE,
      password: '',
      derivations: [{value: 'foo', cc: CCs.foo}, {value: 'bar', cc: CCs.bar, hard: true}],
    },
  },
  {
    pk: '0xa2e56b06407a6d1e819d2fc33fa0ec604b29c2e868b70b3696bb049b8725934b',
    ss: '5FkHmNgbg64MwStgCyDi2Uw3ufFu11mqQgmWT9uwK4Lghvpv',
    uri: `${PHRASE}//foo/bar//42/69`,
    uriParts: {
      mnemonic: PHRASE,
      password: '',
      derivations: [
        {value: 'foo', hard: true, cc: CCs.foo},
        {value: 'bar', cc: CCs.bar},
        {value: '42', hard: true, cc: CCs['42']},
        {value: '69', cc: CCs['69']}],
    },
  },
  {
    pk: '0x0e0d24e3e1ff2c07f269c99e2e0df8681fda1851ac42fc846ca2daaa90cd8f14',
    ss: '5CP8S23JBNXYNpJsL7ESPJBNnUZE6itcfM4EnDxEhaVEU6dT',
    uri: `${PHRASE}//foo/bar//42/69///password`,
    uriParts: {
      mnemonic: PHRASE,
      password: 'password',
      derivations: [
        {value: 'foo', hard: true, cc: CCs.foo},
        {value: 'bar', cc: CCs.bar},
        {value: '42', hard: true, cc: CCs['42']},
        {value: '69', cc: CCs['69']}],
    },
  },
  {
    pk: '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
    ss: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    uri: '//Alice',
    uriParts: {
      mnemonic: PHRASE,
      password: '',
      derivations: [{value: 'Alice', hard: true, cc: CCs.Alice}],
    },
  },
]

describe('derivation', async() => {
  test('hard derivation', () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecret(PHRASE))

    const derivedKeypair = deriveHard(keypair, getChainCode('Alice'))

    expect(derivedKeypair.publicKey.key).toEqual(Uint8Array.from([212, 53, 147, 199, 21, 253, 211, 28, 97, 20, 26, 189, 4, 169, 159, 214, 130, 44, 133, 88, 133, 76, 205, 227, 154, 86, 132, 231, 165, 109, 162, 125]))
  })

  test('soft derivation', () => {
    const keypair = Keypair.FromMiniSecret(mnemonicToMiniSecret(PHRASE))

    const derivedKeypair = deriveSoft(keypair, getChainCode('foo'))

    expect(derivedKeypair.publicKey.key).toEqual(Uint8Array.from([64, 185, 103, 93, 249, 14, 250, 96, 105, 255, 98, 59, 15, 223, 207, 112, 108, 212, 124, 167, 69, 42, 80, 86, 199, 173, 88, 25, 77, 35, 68, 10]))
    expect(derivedKeypair.secretKey.key.bytes).toEqual(Uint8Array.from([81, 163, 64, 84, 147, 172, 216, 60, 75, 176, 212, 16, 43, 255, 149, 194, 180, 247, 53, 31, 207, 161, 207, 81, 26, 128, 110, 153, 201, 220, 120, 14]))
  })

  test('hard derivation - comparing with polkadot', () => {
    const miniSecretFromPolkadot = utilCrypto.mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    const keypairFromPolkadot = utilCrypto.sr25519PairFromSeed(miniSecretFromPolkadot)
    const derivedFromPolkadot = utilCrypto.sr25519DeriveHard(keypairFromPolkadot, getChainCode('Alice'))

    const derivedFromOurLib = Sr25519Account.other.dangerouslyParseUriAndGetFullKeypair('//Alice')

    expect(derivedFromPolkadot.publicKey).toEqual(derivedFromOurLib.publicKey.key)
    expect(derivedFromPolkadot.secretKey).toEqual(derivedFromOurLib.secretKey.ToBytes())
  })

  test('soft derivation - comparing with polkadot', () => {
    const miniSecretFromPolkadot = utilCrypto.mnemonicToMiniSecret(DEFAULT_MNEMONIC)
    const keypairFromPolkadot = utilCrypto.sr25519PairFromSeed(miniSecretFromPolkadot)
    const derivedFromPolkadot = utilCrypto.sr25519DeriveSoft(keypairFromPolkadot, getChainCode('foo'))

    const derivedFromOurLib = Sr25519Account.other.dangerouslyParseUriAndGetFullKeypair(`${DEFAULT_MNEMONIC}/foo`)

    expect(derivedFromPolkadot.publicKey)
      .toEqual(derivedFromOurLib.publicKey.key)
    expect(derivedFromPolkadot.secretKey.slice(0, 32))
      .toEqual(derivedFromOurLib.secretKey.ToBytes().slice(0, 32))
  })
})

describe('uri', () => {
  test('parse uri - single', () => {
    const result = parseUri(EXTREMELY_COMPLEX_URI)

    for (const [i, {value, hard, cc}] of EXTREMELY_COMPLEX_URI_DERIVATIONS.entries()) {
      // console.log(`Testing ${i} ${value} ${hard} ${cc}`)
      expect(result.derivations[i].value).toEqual(value)
      expect(result.derivations[i].hard).toEqual(hard)
      expect(result.derivations[i].cc).toEqual(cc)
    }
  })

  test('parse uri - multiple', () => {
    for (const {uri, uriParts} of sr25519TestData) {
      expect(parseUri(uri)).toEqual(uriParts)
    }
  })

  test('parse uri and test derivations', () => {
    for (const {uri, pk} of sr25519TestData) {
      const keypair = parseUriAndDerive(uri)
      expect(uInt8ArrayToHex(keypair.publicKey.key)).toEqual(pk)
    }
  })

  test('parse uri and test derivations - async', async() => {
    for (const {uri, pk} of sr25519TestData) {
      const keypair = await parseUriAndDeriveAsync(uri)
      expect(uInt8ArrayToHex(keypair.publicKey.key)).toEqual(pk)
    }
  })
})
