import {Transcript, getBytesU32} from './external/merlin'
import {randomBytes} from '@noble/hashes/utils'
import {
  Scalar,
  ScalarAdd,
  ScalarMul,
  ScalarBigintToBytesForm,
  ScalarBytesToBigintForm,
} from './scalar'
import {CompressedRistretto, RistrettoBasepointTable, RistrettoPoint} from './ristretto'
import {sha512} from '@noble/hashes/sha512'

interface ISigningContext {
  BytesClone: (data: Uint8Array) => Transcript
  Bytes: (data: Uint8Array) => any
  GetTranscript: () => Transcript
}

function isUint8ArrayEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}

const textEncoder = new TextEncoder()

export class SecretKey {
  nonce: Uint8Array
  key: Scalar

  static FromBytes(bytes: Uint8Array): SecretKey {
    if (bytes.length !== 64) {
      throw new Error(`Invalid secret key length: ${bytes.length} (expected 64)`)
    }

    const secretKey: SecretKey = new SecretKey()

    secretKey.key = Scalar.FromBytes(
      Scalar.DivideScalarBytesByCofactor(bytes.slice(0, 32)),
    )

    secretKey.nonce = bytes.slice(32, 64)

    return secretKey
  }

  static FromScalarAndNonce(scalar: Scalar, nonce: Uint8Array): SecretKey {
    if (nonce.length !== 32) {
      throw new Error(`Invalid nonce length: ${nonce.length} (expected 32)`)
    }
    const secretKey: SecretKey = new SecretKey()

    secretKey.key = scalar
    secretKey.nonce = nonce

    return secretKey
  }

  static FromMiniSecret(miniSecret: Uint8Array): SecretKey {
    if (miniSecret.length !== 32) {
      throw new Error(`Invalid mini secret length: ${miniSecret.length} (expected 32)`)
    }

    const r = sha512(miniSecret)

    const key = r.slice(0, 32)
    key[0] &= 248 // 1111_1000 0xf8
    key[31] &= 63 // 0011_1111 0x3f
    key[31] |= 64 // 0100_0000 0x40
    const scalar = Scalar.FromBits(Scalar.DivideScalarBytesByCofactor(key))

    const nonce = r.slice(32, 64)

    const secretKey: SecretKey = new SecretKey()

    secretKey.key = scalar
    secretKey.nonce = nonce

    return secretKey
  }

  ToBytes(): Uint8Array {
    const bytes = new Uint8Array(64)
    const key = this.key.bytes.slice()
    Scalar.MultiplyScalarBytesByCofactor(key)
    bytes.set(key, 0)
    bytes.set(this.nonce.slice(), 32)
    return bytes
  }

  ToPublicKey(): PublicKey {
    const publicKey = new PublicKey()

    const point = new RistrettoBasepointTable().Mul(this.key).Compress()

    publicKey.key = point.ToBytes()

    return publicKey
  }

  sign(
    message: Uint8Array,
    publicKey: PublicKey,
    rng: RandomGenerator = new RandomGenerator(),
  ): Signature {
    const signingContext = new SigningContext085(textEncoder.encode('substrate'))

    const st = new SigningTranscript(signingContext)

    signingContext.Bytes(message)

    st.SetProtocolName(textEncoder.encode('Schnorr-sig'))
    st.CommitPointBytes(textEncoder.encode('sign:pk'), publicKey.ToBytes())

    const r = st.WitnessScalarLabel(
      textEncoder.encode('signing'),
      this.nonce,
      rng,
    )
    const sc = new Scalar()
    sc.bytes = r

    const tbl = new RistrettoBasepointTable()
    const R = tbl.Mul(sc).Compress()

    st.CommitPoint(textEncoder.encode('sign:R'), R)

    const k = st.ChallengeScalar(textEncoder.encode('sign:c')) // context, message, A/public_key, R=rG
    const scalar = ScalarAdd(
      ScalarMul(
        ScalarBytesToBigintForm(k),
        ScalarBytesToBigintForm(this.key.ToBytes()),
      ),
      ScalarBytesToBigintForm(r),
    )

    const sig = Signature.FromCompressedRistrettoAndScalar(
      R,
      Scalar.FromBytes(ScalarBigintToBytesForm(scalar)),
    )

    return sig
  }
}

export class PublicKey {
  key: Uint8Array

  static FromBytes(bytes: Uint8Array): PublicKey {
    const publicKey = new PublicKey()

    publicKey.key = bytes

    return publicKey
  }

  ToBytes(): Uint8Array {
    return this.key.slice()
  }

  ToRistrettoPoint(): RistrettoPoint {
    return RistrettoPoint.FromCompressedPointBytes(this.key)
  }

  verify(message: Uint8Array, signatureBytes: Uint8Array): boolean {
    const signingTranscript = new SigningContext085(textEncoder.encode('substrate')).BytesClone(message)

    const signature = Signature.FromBytes(signatureBytes)

    // console.log(printTranscriptMax(signingTranscript))
    // console.log("signature.R", signature.R)
    // console.log("signature.S", signature.S)

    signingTranscript.AppendMessage(textEncoder.encode('proto-name'), textEncoder.encode('Schnorr-sig'))
    signingTranscript.AppendMessage(textEncoder.encode('sign:pk'), this.key)
    signingTranscript.AppendMessage(textEncoder.encode('sign:R'), signature.R.ToBytes())

    const k = Scalar.FromBytes(Scalar.FromBytesModOrderWide(
      signingTranscript.ChallengeBytes(textEncoder.encode('sign:c'), 64),
    ))

    // printTranscriptMax(signingTranscript)
    // console.log("k", k)

    const A = this.ToRistrettoPoint()
    const negA = A.Negate()

    // console.log('negA', negA.Ep)

    const R = RistrettoPoint.vartimeDoubleScalarMulBasepoint(
      k,
      negA.Ep,
      signature.S,
    )
    const compressed = new RistrettoPoint(R).Compress()
    return isUint8ArrayEqual(compressed.ToBytes(), signature.R.ToBytes())
  }
}

export class RandomGenerator {
  GetRandomArrayU8_32(): Uint8Array {
    return randomBytes(32)
  }

  GetHardcoded(): Uint8Array {
    return Uint8Array.from([
      77, 196, 92, 65, 167, 196, 215, 23, 222, 26, 136, 164, 123, 67, 115, 78,
      178, 96, 208, 59, 8, 157, 203, 111, 157, 87, 69, 105, 155, 61, 111, 153,
    ])
  }
}

class Signature {
  public R: CompressedRistretto
  public S: Scalar

  static FromBytes(bytes: Uint8Array) {
    const signature = new Signature()
    if (bytes.length !== 64) {
      throw new Error('Invalid signature length')
    }

    const lower = bytes.slice(0, 32)
    const upper = bytes.slice(32, 64)
    if ((upper[31] & 128) === 0) {
      throw new Error('Invalid signature')
    }
    upper[31] &= 127

    signature.R = CompressedRistretto.FromBytes(lower)

    // todo: proper check scalar and reduce it if necessary
    signature.S = Scalar.FromBytes(upper)

    return signature
  }

  static FromCompressedRistrettoAndScalar(R: CompressedRistretto, S: Scalar): Signature {
    const signature = new Signature()
    signature.R = R
    signature.S = S
    return signature
  }

  ToBytes() {
    const compressedRistrettoBytes = this.R.ToBytes()
    const scalarBytes = this.S.ToBytes()
    const mergedArray = new Uint8Array(compressedRistrettoBytes.length + scalarBytes.length)
    mergedArray.set(compressedRistrettoBytes)
    mergedArray.set(scalarBytes, compressedRistrettoBytes.length)
    mergedArray[63] |= 128
    return mergedArray
  }
}

export class SigningTranscript {
  context: ISigningContext

  constructor(context: ISigningContext) {
    // _operations = new SigningTranscriptOperation();
    this.context = context
  }

  SetProtocolName(label: Uint8Array) {
    this.CommitBytesB(
      this.context.GetTranscript(),
      textEncoder.encode('proto-name'),
      label,
    )
  }

  CommitPoint(label: Uint8Array, compressed: CompressedRistretto) {
    this.CommitBytesB(this.context.GetTranscript(), label, compressed.ToBytes())
  }

  CommitPointBytes(label: Uint8Array, bytes: Uint8Array) {
    this.CommitBytesB(this.context.GetTranscript(), label, bytes)
  }

  WitnessScalarLabel(
    label: Uint8Array,
    bytes: Uint8Array,
    rng: RandomGenerator,
  ): Uint8Array {
    return this.WitnessScalarFR(this.context.GetTranscript(), label, bytes, rng)
  }

  WitnessScalar(bytes: Uint8Array, rng: RandomGenerator): Uint8Array {
    return this.WitnessScalarSR(this.context.GetTranscript(), bytes, rng)
  }

  ChallengeScalar(label: Uint8Array): Uint8Array {
    const data = this.ChallengeBytes(label)
    return Scalar.FromBytesModOrderWide(data)
  }

  ChallengeBytes(label: Uint8Array): Uint8Array {
    return this.ChallengeBytesTL(this.context.GetTranscript(), label)
  }

  ChallengeBytesTL(ts: Transcript, label: Uint8Array): Uint8Array {
    return ts.ChallengeBytes(label, 64)
  }

  CommitBytesB(ts: Transcript, label: Uint8Array, bytes: Uint8Array) {
    ts.AppendMessage(label, bytes)
  }

  CommitBytesS(ts: Transcript, label: string, bytes: Uint8Array) {
    ts.AppendMessage(textEncoder.encode(label), bytes)
  }

  CommitPointF(
    ts: Transcript,
    label: Uint8Array,
    compressedRistretto: Uint8Array,
  ) {
    this.CommitBytesB(ts, label, compressedRistretto)
  }

  WitnessScalarSR(
    ts: Transcript,
    nonce: Uint8Array,
    rng: RandomGenerator,
  ): Uint8Array {
    const t = ts.WitnessBytes(new Uint8Array(0), nonce, rng)

    // Fill bytes size = 64
    t.MetaAd(Uint8Array.from([64]), false)
    const dst = t.Prf(64, false)

    return Scalar.FromBytesModOrderWide(dst)
  }

  WitnessScalarFR(
    ts: Transcript,
    label: Uint8Array,
    nonce: Uint8Array,
    rng: RandomGenerator,
  ): Uint8Array {
    const t = ts.WitnessBytes(label, nonce, rng)

    // Fill bytes  size = 64
    t.MetaAd(getBytesU32(64), false)
    const dst = t.Prf(64, false)

    return Scalar.FromBytesModOrderWide(dst)
  }
}

export class SigningContext085 implements ISigningContext {
  ts: Transcript

  constructor(context: Uint8Array) {
    this.ts = new Transcript()
    this.ts.Init('SigningContext')
    this.ts.AppendMessage(new Uint8Array(), context)
  }

  Bytes(data: Uint8Array) {
    this.ts.AppendMessage(textEncoder.encode('sign-bytes'), data)
  }

  BytesClone(data: Uint8Array): Transcript {
    const clone = this.ts.Clone()
    clone.AppendMessage(textEncoder.encode('sign-bytes'), data)
    return clone
  }

  GetTranscript(): Transcript {
    return this.ts
  }
}
