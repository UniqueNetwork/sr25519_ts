import {Strobe128} from './strobe128'
import {MERLIN_PROTOCOL_LABEL} from './constants'
import {b} from '../templateLiteralFunctions'
import {randomBytes} from '@noble/hashes/utils'

const encode_u64 = (x: bigint): Uint8Array => {
  const buf = new Uint8Array(8)
  buf[0] = Number(x & 255n)
  buf[1] = Number((x >> 8n) & 255n)
  buf[2] = Number((x >> 16n) & 255n)
  buf[3] = Number((x >> 24n) & 255n)
  buf[4] = Number((x >> 32n) & 255n)
  buf[5] = Number((x >> 40n) & 255n)
  buf[6] = Number((x >> 48n) & 255n)
  buf[7] = Number((x >> 56n) & 255n)
  return buf
}

const encode_usize_as_u32 = (x: number): Uint8Array => {
  if (x > 4294967295n) {
    throw new Error('encode_usize_as_u32: x > 4294967295n')
  }

  const buf = new Uint8Array(4)

  buf[0] = x & 255
  buf[1] = (x >> 8) & 255
  buf[2] = (x >> 16) & 255
  buf[3] = (x >> 24) & 255

  return buf
}

export class Transcript {
  private readonly strobe: Strobe128

  constructor(label: Uint8Array) {
    this.strobe = new Strobe128(MERLIN_PROTOCOL_LABEL)
    this.append_message(b`dom-sep`, label)
  }

  cloneStrobe() {
    return this.strobe.clone()
  }

  append_message(label: Uint8Array, message: Uint8Array) {
    const data_len = encode_usize_as_u32(message.length)
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(data_len, true)
    this.strobe.ad(message, false)
  }

  append_u64(label: Uint8Array, x: bigint) {
    this.append_message(label, encode_u64(x))
  }

  challenge_bytes(label: Uint8Array, dest: Uint8Array) {
    const data_len = encode_usize_as_u32(dest.length)
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(data_len, true)
    this.strobe.prf(dest, false)
  }

  build_rng() {
    return new TranscriptRngBuilder(this.strobe.clone())
  }

  fill_bytes(dest: Uint8Array) {
    const data_len = encode_usize_as_u32(dest.length)
    this.strobe.meta_ad(data_len, true)
    this.strobe.prf(dest, false)
  }

  witness_bytes_rng(label: Uint8Array, dest: Uint8Array, nonce_seeds: Uint8Array[]) {
    let br = this.build_rng()
    for (const ns of nonce_seeds) {
      br = br.rekey_with_witness_bytes(label, ns)
    }
    const r = br.finalize()
    r.fill_bytes(dest)
  }

  witness_bytes(label: Uint8Array, dest: Uint8Array, nonce_seeds: Uint8Array[]) {
    this.witness_bytes_rng(label, dest, nonce_seeds)
  }

  witness_scalar(label: Uint8Array, nonce_seeds: Uint8Array[]) {
    const scalar_bytes = new Uint8Array(64)
    this.witness_bytes(label, scalar_bytes, nonce_seeds)
    // todo:
  }
}

export class TranscriptRngBuilder {
  private readonly strobe: Strobe128

  constructor(label: Uint8Array | Strobe128) {
    if (label instanceof Uint8Array) {
      this.strobe = new Strobe128(label)
    } else if (label instanceof Strobe128) {
      this.strobe = label
    } else {
      throw new Error('TranscriptRngBuilder constructor: label is not Uint8Array or Strobe128')
    }
  }

  cloneStrobe() {
    return this.strobe.clone()
  }

  rekey_with_witness_bytes(label: Uint8Array, witness: Uint8Array) {
    const witness_len = encode_usize_as_u32(witness.length)
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(witness_len, true)
    this.strobe.key(witness, false)

    return this
  }

  finalize(generateRandomBytes32?: () => Uint8Array) {
    // let bytes = new Uint8Array(32)
    const bytes = generateRandomBytes32 ? generateRandomBytes32() : randomBytes(32)

    this.strobe.meta_ad(b`rng`, false)
    this.strobe.key(bytes, false)
    return new TranscriptRng(this.strobe)
  }
}

export class TranscriptRng {
  private readonly strobe: Strobe128

  constructor(strobe: Strobe128) {
    this.strobe = strobe
  }

  cloneStrobe() {
    return this.strobe.clone()
  }

  rekey_with_witness_bytes(label: Uint8Array, witness: Uint8Array) {
    const witness_len = encode_usize_as_u32(witness.length)
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(witness_len, true)
    this.strobe.key(witness, false)
  }

  rekey_with_witness_u64(label: Uint8Array, witness: bigint) {
    this.rekey_with_witness_bytes(label, encode_u64(witness))
  }

  fill_bytes(dest: Uint8Array) {
    const data_len = encode_usize_as_u32(dest.length)
    this.strobe.meta_ad(data_len, false)
    this.strobe.prf(dest, false)
  }
}
