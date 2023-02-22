import {bigIntToUint8Array, compactAddLength, hexStringToUint8Array, isHex} from './bytes'
import {blake2b} from '@noble/hashes/blake2b'
import {mnemonicToMiniSecretAsync, mnemonicToMiniSecret} from './mnemonic'
import {Keypair} from '../../src/keypair'
import {Transcript} from '../merlin/transcript'
import {SecretKey} from '../../src/signingContext'
import {b} from '../templateLiteralFunctions'
import {Scalar, ScalarAdd, ScalarBigintToBytesForm, ScalarBytesToBigintForm} from '../../src/scalar'

export const DEFAULT_MNEMONIC = 'bottom drive obey lake curtain smoke basket hold race lonely fit walk'

const REGEX_DIGITS_ONLY = /^\d+$/
export interface Derivation { value: string, hard?: boolean, cc: Uint8Array }

export const parseUri = (uri: string): {mnemonic: string, password: string, derivations: Derivation[]} => {
  const derivations: Derivation[] = []

  const [beforePassword, password = ''] = uri.split('///')
  const hardSeparatedParts = beforePassword.split('//')

  let mnemonic = hardSeparatedParts.shift() || DEFAULT_MNEMONIC
  const mnemonicParts = mnemonic.split('/')
  mnemonic = mnemonicParts.shift() || ''
  if (!mnemonic) {
    throw new Error(`Invalid mnemonic: ${uri}`)
  }
  if (mnemonicParts.length) {
    derivations.push(...mnemonicParts.map(value => ({value, cc: getChainCode(value)})))
  }

  for (const part of hardSeparatedParts) {
    const softSeparatedParts = part.split('/')
    const hard = softSeparatedParts.shift()
    if (!hard) throw new Error('Invalid hard derivation')
    derivations.push({value: hard, hard: true, cc: getChainCode(hard)})
    derivations.push(...softSeparatedParts.map(value => ({value, cc: getChainCode(value)})))
  }

  return {
    mnemonic,
    password,
    derivations,
  }
}

const textEncoder = new TextEncoder()

export const getChainCode = (str: string): Uint8Array => {
  const value = REGEX_DIGITS_ONLY.test(str) ? BigInt(str) : str

  let u8a: Uint8Array

  if (typeof value === 'bigint') {
    u8a = bigIntToUint8Array(value, {bitLength: 256, isLe: true})
  } else { // value is string
    u8a = isHex(value)
      ? hexStringToUint8Array(value)
      : compactAddLength(textEncoder.encode(value))
  }

  const chainCode = new Uint8Array(32)
  chainCode.set(u8a.length > 32 ? blake2b(u8a, {dkLen: 32}) : u8a, 0)

  return chainCode
}

export const deriveHard = (keypair: Keypair, chainCode: Uint8Array): Keypair => {
  const transcript = new Transcript(b`SchnorrRistrettoHDKD`)

  transcript.append_message(b`sign-bytes`, new Uint8Array())
  transcript.append_message(b`chain-code`, chainCode)
  transcript.append_message(b`secret-key`, keypair.secretKey.key.bytes.slice())

  const msk = new Uint8Array(32)
  transcript.challenge_bytes(b`HDKD-hard`, msk)

  const chaincode_2 = new Uint8Array(32)
  transcript.challenge_bytes(b`HDKD-chaincode`, chaincode_2)

  return Keypair.FromMiniSecret(msk)
}

export const deriveSoft = (keypair: Keypair, chainCode: Uint8Array): Keypair => {
  const transcript = new Transcript(b`SchnorrRistrettoHDKD`)
  transcript.append_message(b`sign-bytes`, new Uint8Array())

  transcript.append_message(b`chain-code`, chainCode)
  transcript.append_message(b`public-key`, keypair.publicKey.key.slice())

  const buf = new Uint8Array(64)
  transcript.challenge_bytes(b`HDKD-scalar`, buf)
  const scalar = Scalar.FromBytesModOrderWide(buf)

  const chaincode_2 = new Uint8Array(32)
  transcript.challenge_bytes(b`HDKD-chaincode`, chaincode_2)

  const nonce = new Uint8Array(32)
  transcript.witness_bytes(b`HDKD-nonce`, nonce, [keypair.secretKey.nonce.slice(), keypair.secretKey.ToBytes().slice()])

  const derivedSecretKeyKey = Scalar.FromBytes(ScalarBigintToBytesForm(
    ScalarAdd(
      ScalarBytesToBigintForm(keypair.secretKey.key.bytes.slice()),
      ScalarBytesToBigintForm(scalar),
    ),
  ))
  const derivedSecretKey = SecretKey.FromScalarAndNonce(derivedSecretKeyKey, nonce)
  const publicKey = derivedSecretKey.ToPublicKey()

  return new Keypair(publicKey, derivedSecretKey)
}

const processDerivations = (keypair: Keypair, derivations: Derivation[]): Keypair => {
  for (const {hard, cc} of derivations) {
    keypair = hard ? deriveHard(keypair, cc) : deriveSoft(keypair, cc)
  }

  return keypair
}

export const parseUriAndDerive = (uri: string): Keypair => {
  const {mnemonic, password, derivations} = parseUri(uri)

  return processDerivations(
    Keypair.FromMiniSecret(mnemonicToMiniSecret(mnemonic, password)),
    derivations,
  )
}

export const parseUriAndDeriveAsync = async(uri: string): Promise<Keypair> => {
  const {mnemonic, password, derivations} = parseUri(uri)

  return processDerivations(
    Keypair.FromMiniSecret(await mnemonicToMiniSecretAsync(mnemonic, password)),
    derivations,
  )
}
