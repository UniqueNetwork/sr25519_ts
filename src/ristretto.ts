import { FieldElement, SQRT_M1 } from './fieldElement'
import { type Scalar } from './scalar'
import { type EdwardsBasepointTable } from './edwardsBasepointTable'
import { type EdwardsPoint } from './edwardsPoint'
import { ProjectivePoint } from './projectivePoint'
import { NafLookupTable } from './nafLookupTable'
import {
  AFFINE_ODD_MULTIPLES_OF_BASEPOINT,
  ED25519_BASEPOINT_TABLE_INNER
} from './tables'

export const INVSQRT_A_MINUS_D = new FieldElement([
  278908739862762n,
  821645201101625n,
  8113234426968n,
  1777959178193151n,
  2118520810568447n
])

export class CompressedRistretto {
  public compressedRistrettoBytes: Uint8Array

  CompressedRistretto (data: Uint8Array) {
    this.compressedRistrettoBytes = data
  }

  ToBytes (): Uint8Array {
    return this.compressedRistrettoBytes
  }

  GetBytes (): Uint8Array {
    return this.compressedRistrettoBytes
  }
}

export class RistrettoBasepointTable {
  public edwardsBasepointTable: EdwardsBasepointTable

  public constructor () {
    this.edwardsBasepointTable = ED25519_BASEPOINT_TABLE_INNER
  }

  Mul (s: Scalar): RistrettoPoint {
    const ep = this.edwardsBasepointTable.Mul(s)

    return new RistrettoPoint(ep)
  }
}

export class RistrettoPoint {
  public Ep: EdwardsPoint

  public constructor (ep: EdwardsPoint) {
    this.Ep = ep
  }

  /// Compute \\(aA + bB\\) in letiable time, where \\(B\\) is the
  /// Ristretto basepoint.
  static lettimeDoubleScalarMulBasepoint (
    a: Scalar,
    A: EdwardsPoint,
    b: Scalar
  ): EdwardsPoint {
    const aNaf = a.NonAdjacentForm(5)
    const bNaf = b.NonAdjacentForm(8)
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
  Compress (): CompressedRistretto {
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

    const res = new CompressedRistretto()
    res.compressedRistrettoBytes = s.ToBytes()

    return res
  }
}
