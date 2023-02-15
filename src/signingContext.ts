import { Transcript, getBytesU32 } from './merlin'
import { randomBytes } from '@noble/hashes/utils'
import {
  Scalar,
  ScalarAdd,
  ScalarMul,
  ScalarBigintToBytesForm,
  ScalarBytesToBigintForm
} from './scalar'
import { RistrettoBasepointTable, RistrettoPoint } from './ristretto'
import { EdwardsPoint } from './edwardsPoint'

interface ISigningContext {
  BytesClone: (data: Uint8Array) => Transcript
  Bytes: (data: Uint8Array) => any
  GetTranscript: () => Transcript
}

export class SecretKey {
  nonce: Uint8Array
  key: Scalar

  static FromBytes (bytes: Uint8Array): SecretKey {
    // TODO add size !== 64 error
    const r: SecretKey = new SecretKey()
    r.key = Scalar.FromBytes(bytes.slice(0, 32))
    r.nonce = bytes.slice(32, 64)
    return r
  }

  static FromBytes095 (bytes: Uint8Array): SecretKey {
    // TODO add size !== 64 error
    const r: SecretKey = new SecretKey()
    r.key = Scalar.FromBytes(
      Scalar.DivideScalarBytesByCofactor(bytes.slice(0, 32))
    )
    r.nonce = bytes.slice(32, 64)
    return r
  }
}

export class PublicKey {
  key: Uint8Array

  static FromBytes (bytes: Uint8Array): PublicKey {
    const pk = new PublicKey()
    pk.key = bytes
    return pk
  }
}

export class RandomGenerator {
  GetRandomArrayU8_32 (): Uint8Array {
    return randomBytes(32)
  }

  GetHardcoded (): Uint8Array {
    return Uint8Array.from([
      77, 196, 92, 65, 167, 196, 215, 23, 222, 26, 136, 164, 123, 67, 115, 78,
      178, 96, 208, 59, 8, 157, 203, 111, 157, 87, 69, 105, 155, 61, 111, 153
    ])
  }
}

class Signature {
  public R: Uint8Array
  public S: Uint8Array

  FromBytes (bytes: Uint8Array) {
    this.R = new Uint8Array(32)
    this.S = new Uint8Array(32)

    this.R.set(bytes.slice(0, 32))
    this.S.set(bytes.slice(32, 64))
  }

  ToBytes () {
    const mergedArray = new Uint8Array(this.R.length + this.S.length)
    mergedArray.set(this.R)
    mergedArray.set(this.S, this.R.length)
    mergedArray[63] |= 128
    return mergedArray
  }
}
class CompressedRistretto {
  ToBytes (): Uint8Array {
    return new Uint8Array(2)
  }
}

export class SigningTranscript {
  context: ISigningContext

  constructor (context: ISigningContext) {
    // _operations = new SigningTranscriptOperation();
    this.context = context
  }

  SetProtocolName (label: Uint8Array) {
    this.CommitBytesB(
      this.context.GetTranscript(),
      Buffer.from('proto-name', 'ascii'),
      label
    )
  }

  CommitPoint (label: Uint8Array, compressed: CompressedRistretto) {
    this.CommitBytesB(this.context.GetTranscript(), label, compressed.ToBytes())
  }

  CommitPointBytes (label: Uint8Array, bytes: Uint8Array) {
    this.CommitBytesB(this.context.GetTranscript(), label, bytes)
  }

  WitnessScalarLabel (
    label: Uint8Array,
    bytes: Uint8Array,
    rng: RandomGenerator
  ): Uint8Array {
    return this.WitnessScalarFR(this.context.GetTranscript(), label, bytes, rng)
  }

  WitnessScalar (bytes: Uint8Array, rng: RandomGenerator): Uint8Array {
    return this.WitnessScalarSR(this.context.GetTranscript(), bytes, rng)
  }

  ChallengeScalar (label: Uint8Array): Uint8Array {
    const data = this.ChallengeBytes(label)
    return Scalar.FromBytesModOrderWide(data)
  }

  ChallengeBytes (label: Uint8Array): Uint8Array {
    const result = this.ChallengeBytesTL(this.context.GetTranscript(), label)
    return result
  }

  ChallengeBytesTL (ts: Transcript, label: Uint8Array): Uint8Array {
    return ts.ChallengeBytes(label, 64)
  }

  CommitBytesB (ts: Transcript, label: Uint8Array, bytes: Uint8Array) {
    ts.AppendMessage(label, bytes)
  }

  CommitBytesS (ts: Transcript, label: string, bytes: Uint8Array) {
    ts.AppendMessage(Buffer.from(label, 'ascii'), bytes)
  }

  CommitPointF (
    ts: Transcript,
    label: Uint8Array,
    compressedRistretto: Uint8Array
  ) {
    this.CommitBytesB(ts, label, compressedRistretto)
  }

  WitnessScalarSR (
    ts: Transcript,
    nonce: Uint8Array,
    rng: RandomGenerator
  ): Uint8Array {
    const t = ts.WitnessBytes(new Uint8Array(0), nonce, rng)

    // Fill bytes  size = 64
    t.MetaAd(Uint8Array.from([64]), false)
    const dst = t.Prf(64, false)

    return Scalar.FromBytesModOrderWide(dst)
  }

  WitnessScalarFR (
    ts: Transcript,
    label: Uint8Array,
    nonce: Uint8Array,
    rng: RandomGenerator
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

  constructor (context: Uint8Array) {
    this.ts = new Transcript()
    this.ts.Init('SigningContext')
    this.ts.AppendMessage(new Uint8Array(), context)
  }

  Bytes (data: Uint8Array) {
    this.ts.AppendMessage(Buffer.from('sign-bytes', 'ascii'), data)
  }

  BytesClone (data: Uint8Array): Transcript {
    const clone = this.ts.Clone()
    clone.AppendMessage(Buffer.from('sign-bytes', 'ascii'), data)
    return clone
  }

  GetTranscript (): Transcript {
    return this.ts
  }

  verify (
    st: SigningTranscript,
    signature: Uint8Array,
    publicKey: PublicKey
  ): boolean {
    const sig = new Signature()
    sig.FromBytes(signature)

    st.SetProtocolName(Buffer.from('Schnorr-sig', 'ascii'))
    st.CommitPointBytes(Buffer.from('sign:pk', 'ascii'), publicKey.key)
    st.CommitPointBytes(Buffer.from('sign:R', 'ascii'), sig.R)

    const k = st.ChallengeScalar(Buffer.from('sign:c', 'ascii')) // context, message, A/public_key, R=rG

    const A = EdwardsPoint.Decompress(publicKey.key)
    const negA = A.Negate()

    const R = RistrettoPoint.lettimeDoubleScalarMulBasepoint(
      Scalar.FromBytes(k),
      negA,
      Scalar.FromBytes(sig.S)
    )

    return new RistrettoPoint(R).Compress().ToBytes() === sig.R
  }

  // public static Signature
  sign (
    st: SigningTranscript,
    secretKey: SecretKey,
    publicKey: PublicKey,
    rng: RandomGenerator
  ): Signature {
    st.SetProtocolName(Buffer.from('Schnorr-sig', 'ascii'))
    st.CommitPointBytes(Buffer.from('sign:pk', 'ascii'), publicKey.key)

    const r = st.WitnessScalarLabel(
      Buffer.from('signing', 'ascii'),
      secretKey.nonce,
      rng
    )
    const sc = new Scalar()
    sc.bytes = r

    const tbl = new RistrettoBasepointTable()
    const R = tbl.Mul(sc).Compress()

    st.CommitPoint(Buffer.from('sign:R', 'ascii'), R)

    const k = st.ChallengeScalar(Buffer.from('sign:c', 'ascii')) // context, message, A/public_key, R=rG
    const scalar = ScalarAdd(
      ScalarMul(
        ScalarBytesToBigintForm(k),
        ScalarBytesToBigintForm(secretKey.key.bytes)
      ),
      ScalarBytesToBigintForm(r)
    )

    const sig = new Signature()
    sig.R = R.ToBytes()
    sig.S = ScalarBigintToBytesForm(scalar)

    return sig
  }
}
