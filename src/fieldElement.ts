import {U64size, _m as m} from './scalar'

const LOW_51_BIT_MASK = (1n << 51n) - 1n

/**
  * Converts Uint8Array[8] to a BigInt in little endian
  * @param input Uint8Array[8]
  * @returns {bigint
 */
function uint8ArrayToBigIntLE(input: Uint8Array): bigint {
  return (
    BigInt(input[0]) |
    (BigInt(input[1]) << 8n) |
    (BigInt(input[2]) << 16n) |
    (BigInt(input[3]) << 24n) |
    (BigInt(input[4]) << 32n) |
    (BigInt(input[5]) << 40n) |
    (BigInt(input[6]) << 48n) |
    (BigInt(input[7]) << 56n)
  )
}

class WrappedRes {
  public i0: boolean
  public i1: FieldElement
}

function pow22501(fe: FieldElement): FieldElement[] {
  // Instead of managing which temporary letiables are used
  // for what, we define as many as we need and leave stack
  // allocation to the compiler
  //
  // Each temporary letiable t_i is of the form (self)^e_i.
  // Squaring t_i corresponds to multiplying e_i by 2,
  // so the pow2k function shifts e_i left by k places.
  // Multiplying t_i and t_j corresponds to adding e_i + e_j.
  //
  // Temporary t_i                      Nonzero bits of e_i
  //
  const t0 = fe.Square() // 1         e_0 = 2^1
  const t1 = t0.Square().Square() // 3         e_1 = 2^3
  const t2 = fe.Mul(t1) // 3,0       e_2 = 2^3 + 2^0
  const t3 = t0.Mul(t2) // 3,1,0
  const t4 = t3.Square() // 4,2,1
  const t5 = t2.Mul(t4) // 4,3,2,1,0
  const t6 = t5.Pow2k(5) // 9,8,7,6,5
  const t7 = t6.Mul(t5) // 9,8,7,6,5,4,3,2,1,0
  const t8 = t7.Pow2k(10) // 19..10
  const t9 = t8.Mul(t7) // 19..0
  const t10 = t9.Pow2k(20) // 39..20
  const t11 = t10.Mul(t9) // 39..0
  const t12 = t11.Pow2k(10) // 49..10
  const t13 = t12.Mul(t7) // 49..0
  const t14 = t13.Pow2k(50) // 99..50
  const t15 = t14.Mul(t13) // 99..0
  const t16 = t15.Pow2k(100) // 199..100
  const t17 = t16.Mul(t15) // 199..0
  const t18 = t17.Pow2k(50) // 249..50
  const t19 = t18.Mul(t13) // 249..0

  const pr: FieldElement[] = Array(2)
  pr[0] = t19
  pr[1] = t3

  return pr
}

function powP58(e: FieldElement): FieldElement {
  // The bits of (p-5)/8 are 101111.....11.
  //
  //                                 nonzero bits of exponen
  const t19 = pow22501(e)
  const t20 = t19[0].Pow2k(2)
  const t21 = e.Mul(t20)

  return t21
}

export class FieldElement {
  public data: bigint[] = Array(5)

  constructor(data: bigint[]) {
    this.data[0] = data[0]
    this.data[1] = data[1]
    this.data[2] = data[2]
    this.data[3] = data[3]
    this.data[4] = data[4]
  }

  static FromBytes(bytes: Uint8Array): FieldElement {
    const res = this.Zero()
    // load bits [  0, 64), no shift
    res.data[0] = uint8ArrayToBigIntLE(bytes.slice(0, 8)) & LOW_51_BIT_MASK
    // // load bits [ 48,112), shift to [ 51,112)
    res.data[1] = (uint8ArrayToBigIntLE(bytes.slice(6, 6 + 8)) >> 3n) & LOW_51_BIT_MASK
    // // load bits [ 96,160), shift to [102,160)
    res.data[2] = (uint8ArrayToBigIntLE(bytes.slice(12, 12 + 8)) >> 6n) & LOW_51_BIT_MASK
    // // load bits [152,216), shift to [153,216)
    res.data[3] = (uint8ArrayToBigIntLE(bytes.slice(19, 19 + 8)) >> 1n) & LOW_51_BIT_MASK
    // // load bits [192,256), shift to [204,112)
    res.data[4] = (uint8ArrayToBigIntLE(bytes.slice(24, 24 + 8)) >> 12n) & LOW_51_BIT_MASK
    return res
  }

  Clone(): FieldElement {
    return new FieldElement(this.data.slice())
  }

  CtEq(a: FieldElement) {
    const b1 = this.ToBytes()
    const b2 = a.ToBytes()

    // Short-circuit on the *lengths* of the slices, not their
    // contents.
    if (b1.length !== b2.length) {
      return false
    }

    for (let i = 0; i < b1.length; i++) {
      if (b1[i] !== b2[i]) {
        return false
      }
    }

    return true
  }

  Negate(): FieldElement {
    return this.Reduce([
      36028797018963664n - this.data[0],
      36028797018963952n - this.data[1],
      36028797018963952n - this.data[2],
      36028797018963952n - this.data[3],
      36028797018963952n - this.data[4],
    ])
  }

  static SqrtRatioI(u: FieldElement, v: FieldElement): WrappedRes {
    // Using the same trick as in ed25519 decoding, we merge the
    // inversion, the square root, and the square test as follows.
    //
    // To compute sqrt(α), we can compute β = α^((p+3)/8).
    // Then β^2 = ±α, so multiplying β by sqrt(-1) if necessary
    // gives sqrt(α).
    //
    // To compute 1/sqrt(α), we observe that
    //    1/β = α^(p-1 - (p+3)/8) = α^((7p-11)/8)
    //                            = α^3 * (α^7)^((p-5)/8).
    //
    // We can therefore compute sqrt(u/v) = sqrt(u)/sqrt(v)
    // by first computing
    //    r = u^((p+3)/8) v^(p-1-(p+3)/8)
    //      = u u^((p-5)/8) v^3 (v^7)^((p-5)/8)
    //      = (uv^3) (uv^7)^((p-5)/8).
    //
    // If v is nonzero and u/v is square, then r^2 = ±u/v,
    //                                     so vr^2 = ±u.
    // If vr^2 =  u, then sqrt(u/v) = r.
    // If vr^2 = -u, then sqrt(u/v) = r*sqrt(-1).
    //
    // If v is zero, r is also zero.

    // const vsq = v.Square()

    const v3 = v.Square().Mul(v)
    const v7 = v3.Square().Mul(v)
    let r = u.Mul(v3).Mul(powP58(u.Mul(v7)))
    const check = v.Mul(r.Square())

    const i = SQRT_M1

    const correct_sign_sqrt = check.CtEq(u)
    const flipped_sign_sqrt = check.CtEq(u.Negate())
    const flipped_sign_sqrt_i = check.CtEq(u.Negate().Mul(i))

    const r_prime = r.Mul(SQRT_M1)
    r.ConditionalAssign(r_prime, flipped_sign_sqrt || flipped_sign_sqrt_i)

    // Choose the nonnegative square root.
    const r_is_negative = r.IsNegative()
    if (r_is_negative) {
      r = r.Negate()
    }
    const was_nonzero_square = correct_sign_sqrt || flipped_sign_sqrt

    const res = new WrappedRes()
    res.i0 = was_nonzero_square
    res.i1 = r

    return res
  }

  ConditionalNegate(choice: boolean): void {
    const nself = this.Negate()
    this.ConditionalAssign(nself, choice)
  }

  IsNegative(): boolean {
    const dt = this.data[0] % 256n
    const dti = Number(dt) & 1
    return dti > 0
  }

  ConditionalAssign(other: FieldElement, choice: boolean): void {
    this.data[0] = choice ? other.data[0] : this.data[0]
    this.data[1] = choice ? other.data[1] : this.data[1]
    this.data[2] = choice ? other.data[2] : this.data[2]
    this.data[3] = choice ? other.data[3] : this.data[3]
    this.data[4] = choice ? other.data[4] : this.data[4]
  }

  Pow2k(k: number): FieldElement {
    const a = this.Clone().data

    while (true) {
      // Precondition: assume input limbs a[i] are bounded as
      //
      // a[i] < 2^(51 + b)
      //
      // where b is a real parameter measuring the "bit excess" of the limbs.

      // Precomputation: 64-bit multiply by 19.
      //
      // This fits into a u64 whenever 51 + b + lg(19) < 64.
      //
      // Since 51 + b + lg(19) < 51 + 4.25 + b
      //                       = 55.25 + b,
      // this fits if b < 8.75.
      const a3_19 = 19n * a[3]
      const a4_19 = 19n * a[4]

      // Multiply to get 128-bit coefficients of output.
      //
      // The 128-bit multiplications by 2 turn into 1 slr + 1 slrd each,
      // which doesn't seem any better or worse than doing them as precomputations
      // on the 64-bit inputs.
      // const t1 = m(a[1], a4_19) + m(a[2], a3_19)
      // const t2 = 2n * t1
      // const t3 = m(a[0], a[0]) + t2
      const c0 = m(a[0], a[0]) + 2n * (m(a[1], a4_19) + m(a[2], a3_19))
      let c1 = m(a[3], a3_19) + 2n * (m(a[0], a[1]) + m(a[2], a4_19))
      let c2 = m(a[1], a[1]) + 2n * (m(a[0], a[2]) + m(a[4], a3_19))
      let c3 = m(a[4], a4_19) + 2n * (m(a[0], a[3]) + m(a[1], a[2]))
      let c4 = m(a[2], a[2]) + 2n * (m(a[0], a[4]) + m(a[1], a[3]))

      // Same bound as in multiply:
      //    c[i] < 2^(102 + 2*b) * (1+i + (4-i)*19)
      //         < 2^(102 + lg(1 + 4*19) + 2*b)
      //         < 2^(108.27 + 2*b)
      //
      // The carry (c[i] >> 51) fits into a u64 when
      //    108.27 + 2*b - 51 < 64
      //    2*b < 6.73
      //    b < 3.365.
      //
      // So we require b < 3 to ensure this fits.

      // Casting to u64 and back tells the compiler that the carry is bounded by 2^64, so
      // that the addition is a u128 + u64 rather than u128 + u128.
      c1 += c0 >> 51n
      a[0] = c0 % U64size & LOW_51_BIT_MASK

      c2 += c1 >> 51n
      a[1] = c1 % U64size & LOW_51_BIT_MASK

      c3 += c2 >> 51n
      a[2] = c2 % U64size & LOW_51_BIT_MASK

      c4 += c3 >> 51n
      a[3] = c3 % U64size & LOW_51_BIT_MASK

      const carry = c4 >> 51n
      a[4] = c4 % U64size & LOW_51_BIT_MASK

      // To see that this does not overflow, we need a[0] + carry * 19 < 2^64.
      //
      // c4 < a2^2 + 2*a0*a4 + 2*a1*a3 + (carry from c3)
      //    < 2^(102 + 2*b + lg(5)) + 2^64.
      //
      // When b < 3 we get
      //
      // c4 < 2^110.33  so that carry < 2^59.33
      //
      // so that
      //
      // a[0] + carry * 19 < 2^51 + 19 * 2^59.33 < 2^63.58
      //
      // and there is no overflow.
      a[0] = a[0] + ((carry * 19n) % U64size)

      // Now a[1] < 2^51 + 2^(64 -51) = 2^51 + 2^13 < 2^(51 + epsilon).
      a[1] += a[0] >> 51n
      a[0] &= LOW_51_BIT_MASK

      // Now all a[i] < 2^(51 + epsilon) and a = self^(2^k).
      k--
      if (k === 0) {
        break
      }
    }

    return new FieldElement(a)
  }

  static One(): FieldElement {
    return new FieldElement([1n, 0n, 0n, 0n, 0n])
  }

  static Zero(): FieldElement {
    return new FieldElement([0n, 0n, 0n, 0n, 0n])
  }

  Mul(second: FieldElement): FieldElement {
    // Alias self, _rhs for more readable formulas
    const a = this.data
    const b = second

    // Precondition: assume input limbs a[i], b[i] are bounded as
    //
    // a[i], b[i] < 2^(51 + b)
    //
    // where b is a real parameter measuring the "bit excess" of the limbs.

    // 64-bit precomputations to avoid 128-bit multiplications.
    //
    // This fits into a u64 whenever 51 + b + lg(19) < 64.
    //
    // Since 51 + b + lg(19) < 51 + 4.25 + b
    //                       = 55.25 + b,
    // this fits if b < 8.75.
    const b1_19 = b.data[1] * 19n
    const b2_19 = b.data[2] * 19n
    const b3_19 = b.data[3] * 19n
    const b4_19 = b.data[4] * 19n

    // Multiply to get 128-bit coefficients of output
    const c0 =
      m(a[0], b.data[0]) +
      m(a[4], b1_19) +
      m(a[3], b2_19) +
      m(a[2], b3_19) +
      m(a[1], b4_19)
    let c1 =
      m(a[1], b.data[0]) +
      m(a[0], b.data[1]) +
      m(a[4], b2_19) +
      m(a[3], b3_19) +
      m(a[2], b4_19)
    let c2 =
      m(a[2], b.data[0]) +
      m(a[1], b.data[1]) +
      m(a[0], b.data[2]) +
      m(a[4], b3_19) +
      m(a[3], b4_19)
    let c3 =
      m(a[3], b.data[0]) +
      m(a[2], b.data[1]) +
      m(a[1], b.data[2]) +
      m(a[0], b.data[3]) +
      m(a[4], b4_19)
    let c4 =
      m(a[4], b.data[0]) +
      m(a[3], b.data[1]) +
      m(a[2], b.data[2]) +
      m(a[1], b.data[3]) +
      m(a[0], b.data[4])

    // Casting to u64 and back tells the compiler that the carry is
    // bounded by 2^64, so that the addition is a u128 + u64 rather
    // than u128 + u128.

    const output: bigint[] = Array(5)

    c1 += c0 >> 51n
    output[0] = (c0 & LOW_51_BIT_MASK) % U64size

    c2 += c1 >> 51n
    output[1] = (c1 & LOW_51_BIT_MASK) % U64size

    c3 += c2 >> 51n
    output[2] = (c2 & LOW_51_BIT_MASK) % U64size

    c4 += c3 >> 51n
    output[3] = (c3 & LOW_51_BIT_MASK) % U64size

    const carry = (c4 >> 51n) % U64size
    output[4] = (c4 & LOW_51_BIT_MASK) % U64size

    // To see that this does not overflow, we need out[0] + carry * 19 < 2^64.
    //
    // c4 < a0*b4 + a1*b3 + a2*b2 + a3*b1 + a4*b0 + (carry from c3)
    //    < 5*(2^(51 + b) * 2^(51 + b)) + (carry from c3)
    //    < 2^(102 + 2*b + lg(5)) + 2^64.
    //
    // When b < 3 we get
    //
    // c4 < 2^110.33  so that carry < 2^59.33
    //
    // so that
    //
    // out[0] + carry * 19 < 2^51 + 19 * 2^59.33 < 2^63.58
    //
    // and there is no overflow.
    output[0] = output[0] + carry * 19n

    // Now out[1] < 2^51 + 2^(64 -51) = 2^51 + 2^13 < 2^(51 + epsilon).
    output[1] += output[0] >> 51n
    output[0] &= LOW_51_BIT_MASK

    // Now out[i] < 2^(51 + epsilon) for all i.
    return new FieldElement(output)
  }

  Reduce(limbs: bigint[]): FieldElement {
    // Since the input limbs are bounded by 2^64, the biggest
    // carry-out is bounded by 2^13.
    //
    // The biggest carry-in is c4 * 19, resulting in
    //
    // 2^51 + 19*2^13 < 2^51.0000000001
    //
    // Because we don't need to canonicalize, only to reduce the
    // limb sizes, it's OK to do a "weak reduction", where we
    // compute the carry-outs in parallel.

    const c0 = limbs[0] >> 51n
    const c1 = limbs[1] >> 51n
    const c2 = limbs[2] >> 51n
    const c3 = limbs[3] >> 51n
    const c4 = limbs[4] >> 51n

    limbs[0] &= LOW_51_BIT_MASK
    limbs[1] &= LOW_51_BIT_MASK
    limbs[2] &= LOW_51_BIT_MASK
    limbs[3] &= LOW_51_BIT_MASK
    limbs[4] &= LOW_51_BIT_MASK

    limbs[0] += c4 * 19n
    limbs[1] += c0
    limbs[2] += c1
    limbs[3] += c2
    limbs[4] += c3

    return new FieldElement(limbs)
  }

  Add(element: FieldElement): FieldElement {
    const f = new FieldElement(this.data)
    for (let i = 0; i < 5; i++) {
      f.data[i] += element.data[i]
    }
    return f
  }

  Sub(x: FieldElement): FieldElement {
    // To avoid underflow, first add a multiple of p.
    // Choose 16*p = p << 4 to be larger than 54-bit _rhs.
    //
    // If we could statically track the bitlengths of the limbs
    // of every FieldElement51, we could choose a multiple of p
    // just bigger than _rhs and avoid having to do a reduction.
    //
    // Since we don't yet have type-level integers to do this, we
    // have to add an explicit reduction call here.

    return this.Reduce([
      this.data[0] + 36028797018963664n - x.data[0],
      this.data[1] + 36028797018963952n - x.data[1],
      this.data[2] + 36028797018963952n - x.data[2],
      this.data[3] + 36028797018963952n - x.data[3],
      this.data[4] + 36028797018963952n - x.data[4],
    ])
  }

  Square(): FieldElement {
    return this.Pow2k(1)
  }

  Square2(): FieldElement {
    const square = this.Pow2k(1)
    for (let i = 0; i < 5; i++) {
      square.data[i] *= 2n
    }

    return square
  }

  BitXor(a: FieldElement): FieldElement {
    const res = new FieldElement(this.data)
    res.data[0] ^= a.data[0]
    res.data[1] ^= a.data[1]
    res.data[2] ^= a.data[2]
    res.data[3] ^= a.data[3]
    res.data[4] ^= a.data[4]
    return res
  }

  BitAnd(a: bigint): FieldElement {
    const res = new FieldElement(this.data)
    res.data[0] &= a
    res.data[1] &= a
    res.data[2] &= a
    res.data[3] &= a
    res.data[4] &= a
    return res
  }

  ToBytes(): Uint8Array {
    // Let h = limbs[0] + limbs[1]*2^51 + ... + limbs[4]*2^204.
    //
    // Write h = pq + r with 0 <= r < p.
    //
    // We want to compute r = h mod p.
    //
    // If h < 2*p = 2^256 - 38,
    // then q = 0 or 1,
    //
    // with q = 0 when h < p
    //  and q = 1 when h >= p.
    //
    // Notice that h >= p <===> h + 19 >= p + 19 <===> h + 19 >= 2^255.
    // Therefore q can be computed as the carry bit of h + 19.

    // First, reduce the limbs to ensure h < 2*p.
    const cp = this.Clone()

    const limbs = cp.Reduce(this.Clone().data).data

    let q = (limbs[0] + 19n) >> 51n
    q = (limbs[1] + q) >> 51n
    q = (limbs[2] + q) >> 51n
    q = (limbs[3] + q) >> 51n
    q = (limbs[4] + q) >> 51n

    // Now we can compute r as r = h - pq = r - (2^255-19)q = r + 19q - 2^255q

    limbs[0] += 19n * q

    // Now carry the result to compute r + 19q ...
    const low_51_bit_mask = (1n << 51n) - 1n
    limbs[1] += limbs[0] >> 51n
    limbs[0] = limbs[0] & low_51_bit_mask
    limbs[2] += limbs[1] >> 51n
    limbs[1] = limbs[1] & low_51_bit_mask
    limbs[3] += limbs[2] >> 51n
    limbs[2] = limbs[2] & low_51_bit_mask
    limbs[4] += limbs[3] >> 51n
    limbs[3] = limbs[3] & low_51_bit_mask
    // ... but instead of carrying (limbs[4] >> 51) = 2^255q
    // into another limb, discard it, subtracting the value
    limbs[4] = limbs[4] & low_51_bit_mask

    // Now arrange the bits of the limbs.
    const s = new Uint8Array(32)
    s[0] = Number(limbs[0] % 256n)
    s[1] = Number((limbs[0] >> 8n) % 256n)
    s[2] = Number((limbs[0] >> 16n) % 256n)
    s[3] = Number((limbs[0] >> 24n) % 256n)
    s[4] = Number((limbs[0] >> 32n) % 256n)
    s[5] = Number((limbs[0] >> 40n) % 256n)
    s[6] = Number((limbs[0] >> 48n) % 256n | (limbs[1] << 3n) % 256n)
    s[7] = Number((limbs[1] >> 5n) % 256n)
    s[8] = Number((limbs[1] >> 13n) % 256n)
    s[9] = Number((limbs[1] >> 21n) % 256n)
    s[10] = Number((limbs[1] >> 29n) % 256n)
    s[11] = Number((limbs[1] >> 37n) % 256n)
    s[12] = Number(((limbs[1] >> 45n) | (limbs[2] << 6n)) % 256n)
    s[13] = Number((limbs[2] >> 2n) % 256n)
    s[14] = Number((limbs[2] >> 10n) % 256n)
    s[15] = Number((limbs[2] >> 18n) % 256n)
    s[16] = Number((limbs[2] >> 26n) % 256n)
    s[17] = Number((limbs[2] >> 34n) % 256n)
    s[18] = Number((limbs[2] >> 42n) % 256n)
    s[19] = Number(((limbs[2] >> 50n) | (limbs[3] << 1n)) % 256n)
    s[20] = Number((limbs[3] >> 7n) % 256n)
    s[21] = Number((limbs[3] >> 15n) % 256n)
    s[22] = Number((limbs[3] >> 23n) % 256n)
    s[23] = Number((limbs[3] >> 31n) % 256n)
    s[24] = Number((limbs[3] >> 39n) % 256n)
    s[25] = Number(((limbs[3] >> 47n) | (limbs[4] << 4n)) % 256n)
    s[26] = Number((limbs[4] >> 4n) % 256n)
    s[27] = Number((limbs[4] >> 12n) % 256n)
    s[28] = Number((limbs[4] >> 20n) % 256n)
    s[29] = Number((limbs[4] >> 28n) % 256n)
    s[30] = Number((limbs[4] >> 36n) % 256n)
    s[31] = Number((limbs[4] >> 44n) % 256n)

    // High bit should be zero.
    // debug_assert!((s[31] & 0b1000_0000u8) === 0u8);

    return s
  }

  Invert(): FieldElement {
    // The bits of p-2 = 2^255 -19 -2 are 11010111111...11.
    //
    //                                 nonzero bits of exponent
    const r = pow22501(this) // t19: 249..0 ; t3: 3,1,0
    const t20 = r[0].Pow2k(5) // 254..5
    const t21 = t20.Mul(r[1]) // 254..5,3,1,0

    return t21
  }
}

/// Precomputed value of one of the square roots of -1 (mod p)
export const SQRT_M1 = new FieldElement([
  1718705420411056n,
  234908883556509n,
  2233514472574048n,
  2117202627021982n,
  765476049583133n,
])
