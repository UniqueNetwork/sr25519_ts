import {Strobe128} from './strobe128'
import {MERLIN_PROTOCOL_LABEL, stringToUint8Array} from './constants_and_utils'

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

const encode_usize_as_u32 = (x: bigint): Uint8Array => {
  if (x > 4294967295n) {
    throw new Error('encode_usize_as_u32: x > 4294967295n')
  }

  const buf = new Uint8Array(4)

  buf[0] = Number(x & 255n)
  buf[1] = Number((x >> 8n) & 255n)
  buf[2] = Number((x >> 16n) & 255n)
  buf[3] = Number((x >> 24n) & 255n)

  return buf
}

export class Transcript {
  private strobe: Strobe128

  constructor(label: Uint8Array) {
    this.strobe = new Strobe128(MERLIN_PROTOCOL_LABEL)
    this.append_message('dom-sep', label)
  }

  append_message(label: string, message: Uint8Array) {
    const data_len = encode_usize_as_u32(BigInt(message.length))
    this.strobe.meta_ad(stringToUint8Array(label), false)
    this.strobe.meta_ad(data_len, true)
    this.strobe.ad(message, false)
  }

  append_u64(label: string, x: bigint) {
    this.append_message(label, encode_u64(x))
  }

  challenge_bytes(label: string, dest: Uint8Array) {
    const data_len = encode_usize_as_u32(BigInt(dest.length))
    this.strobe.meta_ad(stringToUint8Array(label), false)
    this.strobe.meta_ad(data_len, true)
    this.strobe.prf(dest, false)
  }

  build_rng() {
    return new TranscriptRngBuilder(this.strobe.clone())
  }
}

export class TranscriptRngBuilder {
  private strobe: Strobe128

  constructor(label: Uint8Array | Strobe128) {
    if (label instanceof Uint8Array) {
      this.strobe = new Strobe128(label)
    } else if (label instanceof Strobe128) {
      this.strobe = label
    } else {
      throw new Error(`TranscriptRngBuilder constructor: label is not Uint8Array or Strobe128`)
    }
  }

  rekey_with_witness_bytes(label: Uint8Array, witness: Uint8Array) {
    const witness_len = encode_usize_as_u32(BigInt(witness.length))
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(witness_len, true)
    this.strobe.key(witness, false)
  }

  finalize() {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)

    this.strobe.meta_ad(stringToUint8Array('rng'), false)
    this.strobe.key(bytes, false)
    return new TranscriptRng(this.strobe)
  }
}

export class TranscriptRng {
  private strobe: Strobe128

  constructor(strobe: Strobe128) {
    this.strobe = strobe
  }

  rekey_with_witness_bytes(label: Uint8Array, witness: Uint8Array) {
    const witness_len = encode_usize_as_u32(BigInt(witness.length))
    this.strobe.meta_ad(label, false)
    this.strobe.meta_ad(witness_len, true)
    this.strobe.key(witness, false)
  }

  rekey_with_witness_u64(label: Uint8Array, witness: bigint) {
    this.rekey_with_witness_bytes(label, encode_u64(witness))
  }

  fill_bytes(dest: Uint8Array) {
    const data_len = encode_usize_as_u32(BigInt(dest.length))
    this.strobe.meta_ad(data_len, true)
    this.strobe.prf(dest, false)
  }
}
