// translated from the original Rust version of Strobe128
// https://github.com/dalek-cryptography/merlin/blob/53535f32e6d6de421372d67f56176af0c0f55fd7/src/strobe.rs
import {b} from '../templateLiteralFunctions'

import {keccakP} from '@noble/hashes/sha3'
const keccakF1600 = (state: Uint8Array) => {
  keccakP(new Uint32Array(state.buffer, state.byteOffset, Math.floor(state.byteLength / 4)), 24)
}

const STROBE_R = 166

const FLAG_I = 1
const FLAG_A = 1 << 1
const FLAG_C = 1 << 2
const FLAG_T = 1 << 3
const FLAG_M = 1 << 4
const FLAG_K = 1 << 5

export class Strobe128 {
  private readonly state: Uint8Array
  private pos: number
  private pos_begin: number
  private cur_flags: number

  constructor(protocol_label: Uint8Array) {
    const initial_state = new Uint8Array(200)
    initial_state[0] = 1
    initial_state[1] = STROBE_R + 2
    initial_state[2] = 1
    initial_state[3] = 0
    initial_state[4] = 1
    initial_state[5] = 96
    initial_state.set(b`STROBEv1.0.2`, 6)
    keccakF1600(initial_state)

    this.state = initial_state
    this.pos = 0
    this.pos_begin = 0
    this.cur_flags = 0

    this.meta_ad(protocol_label, false)
  }

  /// /////////////////////////////////////
  // public methods
  /// /////////////////////////////////////

  public meta_ad(data: Uint8Array, more: boolean): void {
    this.begin_op(FLAG_M | FLAG_A, more)
    this.absorb(data)
  }

  public ad(data: Uint8Array, more: boolean): void {
    this.begin_op(FLAG_A, more)
    this.absorb(data)
  }

  public prf(data: Uint8Array, more: boolean): void {
    this.begin_op(FLAG_I | FLAG_A | FLAG_C, more)
    this.squeeze(data)
  }

  public key(data: Uint8Array, more: boolean): void {
    this.begin_op(FLAG_A | FLAG_C, more)
    this.overwrite(data)
  }

  public clone(): Strobe128 {
    const clone: Strobe128 = new Strobe128(new Uint8Array(0))
    clone.state.set(this.state)
    clone.pos = this.pos
    clone.pos_begin = this.pos_begin
    clone.cur_flags = this.cur_flags
    return clone
  }

  public cloneState() {
    return {
      state: this.state.slice(),
      pos: this.pos,
      pos_begin: this.pos_begin,
      cur_flags: this.cur_flags,
    }
  }

  /// /////////////////////////////////////
  // private methods
  /// /////////////////////////////////////
  private run_f(): void {
    this.state[this.pos] ^= this.pos_begin
    this.state[this.pos + 1] ^= 0x04
    this.state[STROBE_R + 1] ^= 0x80
    keccakF1600(this.state)
    this.pos = 0
    this.pos_begin = 0
  }

  private absorb(data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      this.state[this.pos] ^= data[i]
      this.pos++
      if (this.pos === STROBE_R) {
        this.run_f()
      }
    }
  }

  private overwrite(data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      this.state[this.pos] = data[i]
      this.pos++
      if (this.pos === STROBE_R) {
        this.run_f()
      }
    }
  }

  private squeeze(data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      data[i] = this.state[this.pos]
      this.state[this.pos] = 0
      this.pos++
      if (this.pos === STROBE_R) {
        this.run_f()
      }
    }
  }

  private begin_op(flags: number, more: boolean): void {
    // Check if we're continuing an operation
    if (more) {
      if (this.cur_flags !== flags) {
        throw new Error(`You tried to continue op ${this.cur_flags.toString(2)} but changed flags to ${flags.toString(2)}`)
      }
      return
    }

    // Skip adjusting direction information (we just use AD, PRF)
    if ((flags & FLAG_T) !== 0) {
      throw new Error('You used the T flag, which this implementation doesn\'t support')
    }

    const old_begin = this.pos_begin
    this.pos_begin = this.pos + 1
    this.cur_flags = flags

    this.absorb(new Uint8Array([old_begin, flags]))

    // Force running F if C or K is set
    const force_f = (flags & (FLAG_C | FLAG_K)) !== 0
    if (force_f && this.pos !== 0) {
      this.run_f()
    }
  }
}
