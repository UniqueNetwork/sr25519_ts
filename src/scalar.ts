export const LFACTOR = 0x51da312547e1b
export const L = BigUint64Array.from([
  0x0002631a5cf5d3edn,
  0x000dea2f79cd6581n,
  0x000000000014def9n,
  0x0000000000000000n,
  0x0000100000000000n,
])
export const R = BigUint64Array.from([
  0x000f48bd6721e6edn,
  0x0003bab5ac67e45an,
  0x000fffffeb35e51bn,
  0x000fffffffffffffn,
  0x00000fffffffffffn,
])
export const RR = BigUint64Array.from([
  0x0009d265e952d13bn,
  0x000d63c715bea69fn,
  0x0005be65cb687604n,
  0x0003dceec73d217fn,
  0x000009411b7c309an,
])
export const U64size = BigInt(2 ** 64)

class Tuple2<T = any> {
  public i0: T
  public i1: T

  constructor(a: T, b: T) {
    this.i0 = a
    this.i1 = b
  }
}

export function AsU8(a: number) {
  return a % 256
}

export function AsU8bn(a: bigint): number {
  return Number(a % 256n)
}

export function AsU64Bn(val: any): number {
  return Number(BigInt(val) % BigInt(U64size))
}

export function ScalarBigintToBytesForm(scalar: BigUint64Array): Uint8Array {
  const s = new Uint8Array(32)

  s[0] = AsU8bn(scalar[0] >> 0n)
  s[1] = AsU8bn(scalar[0] >> 8n)
  s[2] = AsU8bn(scalar[0] >> 16n)
  s[3] = AsU8bn(scalar[0] >> 24n)
  s[4] = AsU8bn(scalar[0] >> 32n)
  s[5] = AsU8bn(scalar[0] >> 40n)
  s[6] = AsU8bn((scalar[0] >> 48n) | (scalar[1] << 4n))
  s[7] = AsU8bn(scalar[1] >> 4n)
  s[8] = AsU8bn(scalar[1] >> 12n)
  s[9] = AsU8bn(scalar[1] >> 20n)
  s[10] = AsU8bn(scalar[1] >> 28n)
  s[11] = AsU8bn(scalar[1] >> 36n)
  s[12] = AsU8bn(scalar[1] >> 44n)
  s[13] = AsU8bn(scalar[2] >> 0n)
  s[14] = AsU8bn(scalar[2] >> 8n)
  s[15] = AsU8bn(scalar[2] >> 16n)
  s[16] = AsU8bn(scalar[2] >> 24n)
  s[17] = AsU8bn(scalar[2] >> 32n)
  s[18] = AsU8bn(scalar[2] >> 40n)
  s[19] = AsU8bn((scalar[2] >> 48n) | (scalar[3] << 4n))
  s[20] = AsU8bn(scalar[3] >> 4n)
  s[21] = AsU8bn(scalar[3] >> 12n)
  s[22] = AsU8bn(scalar[3] >> 20n)
  s[23] = AsU8bn(scalar[3] >> 28n)
  s[24] = AsU8bn(scalar[3] >> 36n)
  s[25] = AsU8bn(scalar[3] >> 44n)
  s[26] = AsU8bn(scalar[4] >> 0n)
  s[27] = AsU8bn(scalar[4] >> 8n)
  s[28] = AsU8bn(scalar[4] >> 16n)
  s[29] = AsU8bn(scalar[4] >> 24n)
  s[30] = AsU8bn(scalar[4] >> 32n)
  s[31] = AsU8bn(scalar[4] >> 40n)

  return s
}

export function FloatArrayToBytes(scalar: Float64Array): Uint8Array {
  const s = new Uint8Array(32)

  s[0] = AsU8(scalar[0] >> 0)
  s[1] = AsU8(scalar[0] >> 8)
  s[2] = AsU8(scalar[0] >> 16)
  s[3] = AsU8(scalar[0] >> 24)
  s[4] = AsU8(scalar[0] >> 32)
  s[5] = AsU8(scalar[0] >> 40)
  s[6] = AsU8((scalar[0] >> 48) | (scalar[1] << 4))
  s[7] = AsU8(scalar[1] >> 4)
  s[8] = AsU8(scalar[1] >> 12)
  s[9] = AsU8(scalar[1] >> 20)
  s[10] = AsU8(scalar[1] >> 28)
  s[11] = AsU8(scalar[1] >> 36)
  s[12] = AsU8(scalar[1] >> 44)
  s[13] = AsU8(scalar[2] >> 0)
  s[14] = AsU8(scalar[2] >> 8)
  s[15] = AsU8(scalar[2] >> 16)
  s[16] = AsU8(scalar[2] >> 24)
  s[17] = AsU8(scalar[2] >> 32)
  s[18] = AsU8(scalar[2] >> 40)
  s[19] = AsU8((scalar[2] >> 48) | (scalar[3] << 4))
  s[20] = AsU8(scalar[3] >> 4)
  s[21] = AsU8(scalar[3] >> 12)
  s[22] = AsU8(scalar[3] >> 20)
  s[23] = AsU8(scalar[3] >> 28)
  s[24] = AsU8(scalar[3] >> 36)
  s[25] = AsU8(scalar[3] >> 44)
  s[26] = AsU8(scalar[4] >> 0)
  s[27] = AsU8(scalar[4] >> 8)
  s[28] = AsU8(scalar[4] >> 16)
  s[29] = AsU8(scalar[4] >> 24)
  s[30] = AsU8(scalar[4] >> 32)
  s[31] = AsU8(scalar[4] >> 40)

  return s
}

export function ScalarBytesToBigintForm(scalar: Uint8Array): BigUint64Array {
  // let dt = new Float64Array(5);
  const dt = new BigUint64Array(5)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 8; j++) {
      dt[i] |= (BigInt(scalar[i * 8 + j]) << BigInt(j * 8)) % U64size
    }
  }

  const mask = (1n << 52n) - 1n
  const topMask = (1n << 48n) - 1n
  const s = new BigUint64Array(5)

  s[0] = dt[0] & mask
  s[1] = ((dt[0] >> 52n) | (dt[1] << 12n)) & mask
  s[2] = ((dt[1] >> 40n) | (dt[2] << 24n)) & mask
  s[3] = ((dt[2] >> 28n) | (dt[3] << 36n)) & mask
  s[4] = (dt[3] >> 16n) & topMask

  return s
}

function WrappingSub(a: bigint, b: bigint): bigint {
  // convert from signed to unsigned 64 bits integer
  const r = (a - b) % U64size
  return r > 0 ? r : U64size + r
}

export function ScalarSub(
  a: BigUint64Array,
  b: BigUint64Array,
): BigUint64Array {
  const difference = new BigUint64Array(5)
  const mask: bigint = (1n << 52n) - 1n

  // a - b
  let borrow: bigint = 0n
  for (let i = 0; i < 5; i++) {
    borrow = WrappingSub(a[i], b[i] + (borrow >> 63n))
    difference[i] = (borrow & mask) % U64size
  }

  // conditionally add l if the difference is negative
  const underflowMask = WrappingSub((borrow >> 63n) ^ 1n, 1n)
  let carry: bigint = 0n
  for (let i = 0; i < 5; i++) {
    carry = BigInt((carry >> 52n) + difference[i] + (L[i] & underflowMask))
    difference[i] = carry & mask
  }

  return difference
}

export function ScalarAdd(
  a: BigUint64Array,
  b: BigUint64Array,
): BigUint64Array {
  const sum = new BigUint64Array(5)
  const mask: bigint = (1n << 52n) - 1n

  let carry: bigint = 0n
  for (let i = 0; i < 5; i++) {
    carry = BigInt(a[i]) + BigInt(b[i]) + (carry >> 52n)
    sum[i] = carry & mask
  }

  // subtract l if the sum is >= l
  return ScalarSub(sum, L)
}

export function ScalarMul(
  a: BigUint64Array,
  b: BigUint64Array,
): BigUint64Array {
  const ab = MontgomeryReduce(MulInternal(a, b))
  return MontgomeryReduce(MulInternal(ab, RR))
}

export function _m(x: bigint, y: bigint): bigint {
  return BigInt(x) * BigInt(y)
}

// function WrappingMul (a: number, b: number): bigint {
//   return (BigInt(a) * BigInt(b)) % U64size
// }

function _part1(sum: bigint): Tuple2<bigint> {
  const p = (sum * BigInt(LFACTOR)) & ((1n << 52n) - 1n)

  return new Tuple2(p, (sum + _m(p, BigInt(L[0]))) >> 52n)
}

function _part2(sum: bigint): Tuple2<bigint> {
  const w = sum % U64size & ((1n << 52n) - 1n)
  return new Tuple2(w, sum >> 52n)
}

function MontgomeryReduce(limbs: bigint[]) {
  const l = L

  // the first half computes the Montgomery adjustment factor n, and begins adding n*l to make limbs divisible by R
  const n0 = _part1(limbs[0])
  const n1 = _part1(n0.i1 + limbs[1] + _m(n0.i0, BigInt(l[1])))
  const n2 = _part1(
    n1.i1 + limbs[2] + _m(n0.i0, BigInt(l[2])) + _m(n1.i0, BigInt(l[1])),
  )
  const n3 = _part1(
    n2.i1 + limbs[3] + _m(n1.i0, BigInt(l[2])) + _m(n2.i0, BigInt(l[1])),
  )
  const n4 = _part1(
    n3.i1 +
    limbs[4] +
    _m(n0.i0, BigInt(l[4])) +
    _m(n2.i0, BigInt(l[2])) +
    _m(n3.i0, BigInt(l[1])),
  )

  // limbs is divisible by R now, so we can divide by R by simply storing the upper half as the result
  const r0 = _part2(
    n4.i1 +
    limbs[5] +
    _m(n1.i0, BigInt(l[4])) +
    _m(n3.i0, BigInt(l[2])) +
    _m(n4.i0, BigInt(l[1])),
  )
  const r1 = _part2(
    r0.i1 + limbs[6] + _m(n2.i0, BigInt(l[4])) + _m(n4.i0, BigInt(l[2])),
  )
  const r2 = _part2(r1.i1 + limbs[7] + _m(n3.i0, BigInt(l[4])))
  const r3 = _part2(r2.i1 + limbs[8] + _m(n4.i0, BigInt(l[4])))
  const r4 = r3.i1

  return ScalarSub(BigUint64Array.from([r0.i0, r1.i0, r2.i0, r3.i0, r4]), l)
}

function MulInternal(a: BigUint64Array, b: BigUint64Array): bigint[] {
  const z = Array(9)

  z[0] = _m(a[0], b[0])
  z[1] = _m(a[0], b[1]) + _m(a[1], b[0])
  z[2] = _m(a[0], b[2]) + _m(a[1], b[1]) + _m(a[2], b[0])
  z[3] = _m(a[0], b[3]) + _m(a[1], b[2]) + _m(a[2], b[1]) + _m(a[3], b[0])
  z[4] =
    _m(a[0], b[4]) +
    _m(a[1], b[3]) +
    _m(a[2], b[2]) +
    _m(a[3], b[1]) +
    _m(a[4], b[0])
  z[5] = _m(a[1], b[4]) + _m(a[2], b[3]) + _m(a[3], b[2]) + _m(a[4], b[1])
  z[6] = _m(a[2], b[4]) + _m(a[3], b[3]) + _m(a[4], b[2])
  z[7] = _m(a[3], b[4]) + _m(a[4], b[3])
  z[8] = _m(a[4], b[4])

  return z
}

function MontgomeryMul(a: BigUint64Array, b: BigUint64Array): BigUint64Array {
  return MontgomeryReduce(MulInternal(a, b))
}

// function ToBigIntArray (a: Float64Array): BigUint64Array {
//   const r = new BigUint64Array(a.length)
//   for (let i = 0; i < a.length; i++) {
//     r[i] = BigInt(a[i])
//   }
//
//   return r
// }

// function ToU64Array (a: BigUint64Array): Float64Array {
//   const r = new Float64Array(a.length)
//   for (let i = 0; i < a.length; i++) {
//     r[i] = Number(a[i])
//   }
//
//   return r
// }

export function FromBytesWide(data: Uint8Array): BigUint64Array {
  const words = new BigUint64Array(8)

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // const s1 = BigInt(data[i * 8 + j])
      // const s2 = BigInt(j * 8)
      // const s3 = s1 << s2
      // const s4 = AsU64Bn(s3)
      words[i] |= (BigInt(data[i * 8 + j]) << BigInt(j * 8)) % U64size
    }
  }

  const mask = (1n << 52n) - 1n
  let lo = new BigUint64Array(5)
  let hi = new BigUint64Array(5)

  lo[0] = words[0] & mask
  lo[1] = ((words[0] >> 52n) | (words[1] << 12n)) & mask
  lo[2] = ((words[1] >> 40n) | (words[2] << 24n)) & mask
  lo[3] = ((words[2] >> 28n) | (words[3] << 36n)) & mask
  lo[4] = ((words[3] >> 16n) | (words[4] << 48n)) & mask
  hi[0] = (words[4] >> 4n) & mask
  hi[1] = ((words[4] >> 56n) | (words[5] << 8n)) & mask
  hi[2] = ((words[5] >> 44n) | (words[6] << 20n)) & mask
  hi[3] = ((words[6] >> 32n) | (words[7] << 32n)) & mask
  hi[4] = words[7] >> 20n

  lo = MontgomeryMul(lo, R) // (lo * R) / R = lo
  hi = MontgomeryMul(hi, RR) // (hi * R^2) / R = hi * R

  return ScalarAdd(hi, lo)
}

export function readUint8ArrayIntoBigIntArray(bytes: Uint8Array): bigint[] {
  const bigInts: bigint[] = []
  for (let i = 0; i < bytes.length; i += 8) {
    let num: bigint = 0n
    for (let j = i + 7; j >= i; j--) {
      num = (num << 8n) | BigInt(bytes[j])
    }
    bigInts.push(num)
  }
  return bigInts
}

export class Scalar {
  public bytes: Uint8Array

  static FromBytes(data: Uint8Array): Scalar {
    if (data.length !== 32) {
      throw new Error(`Invalid size of data: should be 32, got ${data.length}`)
    }
    const s = new Scalar()
    s.bytes = data
    return s
  }

  static FromBits(bytes: Uint8Array): Scalar {
    if (bytes.length !== 32) {
      throw new Error(`Invalid size of data: should be 32, got ${bytes.length}`)
    }
    const s = new Scalar()
    s.bytes = bytes
    s.bytes[31] &= 0b0111_1111
    return s
  }

  ToBytes(): Uint8Array {
    return this.bytes.slice()
  }

  static FromBytesModOrderWide(data: Uint8Array): Uint8Array {
    const tt1 = FromBytesWide(data)
    // todo: replace return type with Scalar
    return ScalarBigintToBytesForm(tt1)
  }

  static ToRadix16(bytes: Uint8Array): number[] {
    const output: number[] = []

    // Step 1: change radix.
    // Convert from radix 256 (bytes) to radix 16 (nibbles)
    for (let i = 0; i < 32; i++) {
      output[2 * i] = bytes[i] & 15            // bottom 4 bits
      output[2 * i + 1] = (bytes[i] >> 4) & 15 // top 4 bits
    }

    // Step 2: recenter coefficients from [0,16) to [-8,8)
    for (let i = 0; i < 63; i++) {
      const carry = (output[i] + 8) >> 4  // if output[i] >= 8, carry = 1, else carry = 0
      output[i] -= carry << 4             // if output[i] >= 8, output[i] -= 16
      output[i + 1] += carry              // if output[i] >= 8, output[i + 1] += 1
    }
    // Precondition note:
    // since self[31] <= 127 (01111111), output[63] <= 7 (0111)
    // output[63] is not recentered
    // It increases by carry <= 1. Thus output[63] <= 8

    return output
  }

  static DivideScalarBytesByCofactor(bytes: Uint8Array): Uint8Array {
    const res = new Uint8Array(bytes.length)
    let low = 0

    for (let i = bytes.length - 1; i >= 0; i--) {
      const r = bytes[i] & 0b00000111 // save remainder
      bytes[i] >>= 3 // divide by 8
      bytes[i] += low
      res[i] = bytes[i]
      low = (r << 5) % 256
    }

    return res
  }

  static MultiplyScalarBytesByCofactor(bytes: Uint8Array): Uint8Array {
    const res = new Uint8Array(bytes.length)
    let high = 0

    for (let i = 0; i < bytes.length; i++) {
      const r = bytes[i] & 0b11100000 // carry bits
      bytes[i] = bytes[i] << 3 // multiply by 8
      bytes[i] += high
      res[i] = bytes[i]
      high = r >> 5
    }

    return res
  }

  // sbyte[]
  NonAdjacentForm(size: number): number[] {
    // sbyte[] naf = new sbyte[256];
    const naf: number[] = new Array(256).fill(0)

    const decoded_xU64 = readUint8ArrayIntoBigIntArray(this.ToBytes())
    const xU64: bigint[] = [...decoded_xU64, ...new Array(5 - decoded_xU64.length).fill(0n)]

    const width = 1n << BigInt(size)
    const windowMask = width - 1n

    let pos = 0
    let carry = 0n
    while (pos < 256) {
      // Construct a buffer of bits of the scalar, starting at bit `pos`
      const u64_idx = Math.floor(pos / 64)
      const bit_idx = pos % 64
      let bit_buf: bigint
      if (bit_idx < 64 - size) {
        // This window's bits are contained in a single u64
        bit_buf = xU64[Number(u64_idx)] >> BigInt(bit_idx)
      } else {
        // Combine the current u64's bits with the bits from the next u64
        bit_buf = (xU64[u64_idx] >> BigInt(bit_idx)) | (xU64[u64_idx + 1] << BigInt(64 - bit_idx))
      }

      // Add the carry into the current window
      const window: bigint = carry + (bit_buf & windowMask)

      if ((window & 1n) === 0n) {
        // If the window value is even, preserve the carry and continue.
        // Why is the carry preserved?
        // If carry === 0 and window & 1 === 0, then the next carry should be 0
        // If carry === 1 and window & 1 === 0, then bit_buf & 1 === 1 so the next carry should be 1
        pos += 1
        continue
      }

      if (window < width / 2n) {
        carry = 0n
        naf[pos] = Number(window)
      } else {
        carry = 1n
        // naf[pos] = (window as i8).wrapping_sub(width as i8);
        naf[pos] = Number(window - width)
      }

      pos += size
    }

    return naf
  }
}
