import {FieldElement, SQRT_M1} from './fieldElement'
import type {Scalar} from './scalar'
import type {EdwardsBasepointTable} from './edwardsBasepointTable'
import {EdwardsPoint} from './edwardsPoint'
import {ProjectivePoint} from './projectivePoint'
import {NafLookupTable} from './nafLookupTable'
import {
  AFFINE_ODD_MULTIPLES_OF_BASEPOINT,
  ED25519_BASEPOINT_TABLE_INNER,
} from './tables'

export const INVSQRT_A_MINUS_D = new FieldElement([
  278908739862762n,
  821645201101625n,
  8113234426968n,
  1777959178193151n,
  2118520810568447n,
])

export class CompressedRistretto {
  public bytes: Uint8Array

  static FromBytes(data: Uint8Array): CompressedRistretto {
    const compressedRistretto = new CompressedRistretto()
    compressedRistretto.bytes = data
    return compressedRistretto
  }

  ToBytes(): Uint8Array {
    return this.bytes.slice()
  }
}

export class RistrettoBasepointTable {
  public edwardsBasepointTable: EdwardsBasepointTable

  public constructor() {
    this.edwardsBasepointTable = ED25519_BASEPOINT_TABLE_INNER
  }

  Mul(s: Scalar): RistrettoPoint {
    const ep = this.edwardsBasepointTable.Mul(s)

    return new RistrettoPoint(ep)
  }
}

export class RistrettoPoint {
  public Ep: EdwardsPoint

  public constructor(ep: EdwardsPoint) {
    this.Ep = ep
  }

  static FromCompressedPoint(compressed: CompressedRistretto): RistrettoPoint {
    const bytes = compressed.ToBytes()
    const ep = EdwardsPoint.FromCompressedPoint(bytes.slice())
    return new RistrettoPoint(ep)
  }

  static FromCompressedPointBytes(bytes: Uint8Array): RistrettoPoint {
    const ep = EdwardsPoint.FromCompressedPoint(bytes.slice())
    return new RistrettoPoint(ep)
  }

  Negate(): RistrettoPoint {
    const ep = this.Ep.Negate()
    return new RistrettoPoint(ep)
  }

  /// Compute \\(aA + bB\\) in letiable time, where \\(B\\) is the
  /// Ristretto basepoint.
  static vartimeDoubleScalarMulBasepoint(
    a: Scalar,
    A: EdwardsPoint,
    b: Scalar,
  ): EdwardsPoint {
    // console.log('a is ok', a.bytes.toString() === `47,22,65,197,127,131,55,10,206,175,12,199,162,219,233,169,198,195,156,216,106,174,24,128,229,162,23,37,178,131,78,5`)
    // console.log('b is ok', b.bytes.toString() === `73,169,253,171,114,135,149,240,248,209,238,64,225,244,19,87,70,53,221,245,134,0,153,2,119,98,93,49,221,3,16,3`)

    const aNaf = a.NonAdjacentForm(5)
    // console.log('a naf is ok', aNaf.toString() === '15,0,0,0,0,-15,0,0,0,0,0,3,0,0,0,0,1,0,0,0,0,0,-11,0,0,0,0,-7,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,15,0,0,0,0,3,0,0,0,0,5,0,0,0,0,0,0,0,7,0,0,0,0,-1,0,0,0,0,0,11,0,0,0,0,0,3,0,0,0,0,0,7,0,0,0,0,0,11,0,0,0,0,0,0,-3,0,0,0,0,-9,0,0,0,0,0,0,-11,0,0,0,0,0,0,0,-11,0,0,0,0,-5,0,0,0,0,-7,0,0,0,0,0,0,-15,0,0,0,0,0,-3,0,0,0,0,5,0,0,0,0,0,-5,0,0,0,0,11,0,0,0,0,-13,0,0,0,0,0,0,11,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,-9,0,0,0,0,9,0,0,0,0,15,0,0,0,0,-15,0,0,0,0,-13,0,0,0,0,9,0,0,0,0,0,-5,0,0,0,0,0,1,0,0,0,0,-3,0,0,0,0,-11,0,0,0,0,3,0,0,0,0,0,0')

    const bNaf = b.NonAdjacentForm(8)
    // console.log('b naf is ok', bNaf.toString() === '73,0,0,0,0,0,0,0,-87,0,0,0,0,0,0,0,0,-1,0,0,0,0,0,0,0,0,-85,0,0,0,0,0,0,0,-35,0,0,0,0,0,0,0,0,-79,0,0,0,0,0,0,0,19,0,0,0,0,0,0,0,0,-113,0,0,0,0,0,0,0,0,0,0,0,0,105,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,0,0,0,0,0,-123,0,0,0,0,0,0,0,0,0,-11,0,0,0,0,0,0,0,0,0,-59,0,0,0,0,0,0,0,0,-53,0,0,0,0,0,0,0,-87,0,0,0,0,0,0,0,-89,0,0,0,0,0,0,0,0,0,-81,0,0,0,0,0,0,0,0,0,0,-121,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,-103,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,119,0,0,0,0,0,0,0,0,-79,0,0,0,0,0,0,0,-81,0,0,0,0,0,0,0,-103,0,0,0,0,0,0,0,-17,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0')

    let i = 0

    /// Find starting index
    for (let ind = 255; ind >= 0; ind--) {
      i = ind
      if (aNaf[i] !== 0 || bNaf[i] !== 0) {
        break
      }
    }

    const tableA = NafLookupTable.FromEdwardsPoint(A)
    const tableB = AFFINE_ODD_MULTIPLES_OF_BASEPOINT

    let r = ProjectivePoint.Identity()

    while (i >= 0) {
      let t = r.Double()

      if (aNaf[i] > 0) {
        const t1 = t.ToExtended()
        const i1 = Math.floor(Math.abs((-1 * aNaf[i]) / 2))
        const t2 = tableA.Pnp[i1]
        t = t1.AddPnp(t2)
      } else if (aNaf[i] < 0) {
        const t1 = t.ToExtended()
        const i1 = Math.floor(Math.abs((-1 * aNaf[i]) / 2))
        const t2 = tableA.Pnp[i1]
        t = t1.SubPnp(t2)
      }

      if (bNaf[i] > 0) {
        const t1 = t.ToExtended()
        const i1 = Math.floor(Math.abs((-1 * bNaf[i]) / 2))
        const t2 = tableB.affineNielsPoints[i1]
        t = t1.AddAnp(t2)
      } else if (bNaf[i] < 0) {
        const t1 = t.ToExtended()
        const i1 = Math.floor(Math.abs((-1 * bNaf[i]) / 2))
        const t2 = tableB.affineNielsPoints[i1]
        t = t1.SubAnp(t2)
      }

      r = t.ToProjective()

      i--
    }

    return r.ToExtended()
  }

  /// Compress this point using the Ristretto encoding.
  Compress(): CompressedRistretto {
    const X = this.Ep.X
    const Y = this.Ep.Y
    const Z = this.Ep.Z
    const T = this.Ep.T

    const u1 = Z.Add(Y).Mul(Z.Sub(Y))
    const u2 = X.Mul(Y)

    // Ignore return value since this is always square
    const inv = FieldElement.SqrtRatioI(FieldElement.One(), u1.Mul(u2.Square()))
    // let inv = invsqrt(u1.Mul(u2.Square()));
    const i1 = inv.i1.Mul(u1)
    const i2 = inv.i1.Mul(u2)
    const zInv = i1.Mul(i2.Mul(T))
    const denInv = i2

    const iX = X.Mul(SQRT_M1)
    const iY = Y.Mul(SQRT_M1)
    const ristretto_magic = INVSQRT_A_MINUS_D
    const enchanted_denominator = i1.Mul(ristretto_magic)
    const rotate = T.Mul(zInv).IsNegative()

    X.ConditionalAssign(iY, rotate)
    Y.ConditionalAssign(iX, rotate)
    denInv.ConditionalAssign(enchanted_denominator, rotate)

    Y.ConditionalNegate(X.Mul(zInv).IsNegative())

    const s = denInv.Mul(Z.Sub(Y))
    const s_is_negative = s.IsNegative()
    s.ConditionalNegate(s_is_negative)

    const res = CompressedRistretto.FromBytes(s.ToBytes())

    return res
  }
}
