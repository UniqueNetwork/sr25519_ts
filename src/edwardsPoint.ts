import {FieldElement} from './fieldElement'
import {CompletedPoint} from './completedPoint'
import {ProjectivePoint} from './projectivePoint'
import {AffineNielsPoint} from './affineNielsPoint'
import {ProjectiveNielsPoint} from './projectiveNielsPoint'

/// Edwards `2*d` value, equal to `2*(-121665/121666) mod p`.
const EDWARDS_D2 = new FieldElement([
  1859910466990425n,
  932731440258426n,
  1072319116312658n,
  1815898335770999n,
  633789495995903n,
])
const EDWARDS_D = new FieldElement([
  929955233495203n,
  466365720129213n,
  1662059464998953n,
  2033849074728123n,
  1442794654840575n,
])

export class EdwardsPoint {
  public X: FieldElement
  public Y: FieldElement
  public Z: FieldElement
  public T: FieldElement

  FromElems(
    x: FieldElement,
    y: FieldElement,
    z: FieldElement,
    t: FieldElement,
  ) {
    this.X = x
    this.Y = y
    this.Z = z
    this.T = t
  }

  static EdwardsPointFromElems(
    x: FieldElement,
    y: FieldElement,
    z: FieldElement,
    t: FieldElement,
  ) {
    const ep = new EdwardsPoint()
    ep.X = x
    ep.Y = y
    ep.Z = z
    ep.T = t
    return ep
  }

  public Equals(a: EdwardsPoint): boolean {
    let result = true
    for (let i = 0; i < 5; i++) {
      result =
        result &&
        this.X.data[i] === a.X.data[i] &&
        this.Y.data[i] === a.Y.data[i] &&
        this.Z.data[i] === a.Z.data[i] &&
        this.T.data[i] === a.T.data[i]
    }

    return result
  }

  Copy(): EdwardsPoint {
    const ep = new EdwardsPoint()
    ep.FromElems(this.X, this.Y, this.Z, this.T)
    return ep
  }

  static FromCompressedPoint(bytes: Uint8Array): EdwardsPoint {
    const s = FieldElement.FromBytes(bytes)

    if (s.IsNegative()) {
      throw new Error('Compressed point decompression error: s is negative')
    }

    // Step 2.  Compute (X:Y:Z:T).
    const one = FieldElement.One()
    const ss = s.Square()
    const u1 = one.Sub(ss) //  1 + as²
    const u2 = one.Add(ss) //  1 - as²    where a=-1
    const u2_sqr = u2.Square() // (1 - as²)²

    // v === ad(1+as²)² - (1-as²)²            where d=-121665/121666
    const nEdwardsD = EDWARDS_D.Negate()
    const v = nEdwardsD.Mul(u1.Square()).Sub(u2_sqr)

    //  invsqrt(v * u2_sqr);
    const I = FieldElement.SqrtRatioI(FieldElement.One(), v.Mul(u2_sqr)) // 1/sqrt(v*u_2²)

    const Dx = I.i1.Mul(u2) // 1/sqrt(v)
    const Dy = I.i1.Mul(Dx).Mul(v) // 1/u2

    // x === | 2s/sqrt(v) | === + sqrt(4s²/(ad(1+as²)² - (1-as²)²))
    const x = s.Add(s).Mul(Dx)
    const x_neg = x.IsNegative()
    x.ConditionalNegate(x_neg)
    // y === (1-as²)/(1+as²)
    const y = u1.Mul(Dy)

    // t === ((1+as²) sqrt(4s²/(ad(1+as²)² - (1-as²)²)))/(1-as²)
    const t = x.Mul(y)

    return EdwardsPoint.EdwardsPointFromElems(x, y, one, t)
  }

  static Double(point: EdwardsPoint): EdwardsPoint {
    return point.ToProjective().Double().ToExtended()
  }

  /// Compute \\([2\^k] P \\) by successive doublings. Requires \\( k > 0 \\).
  MulByPow2(k: number): EdwardsPoint {
    let r: CompletedPoint
    let s = this.ToProjective()
    for (let i = 0; i < k - 1; i++) {
      r = s.Double()
      s = r.ToProjective()
    }

    // Unroll last iteration so we can go directly to_extended()
    return s.Double().ToExtended()
  }

  static Identity(): EdwardsPoint {
    return EdwardsPoint.EdwardsPointFromElems(
      FieldElement.Zero(),
      FieldElement.One(),
      FieldElement.One(),
      FieldElement.Zero(),
    )
  }

  Negate(): EdwardsPoint {
    return EdwardsPoint.EdwardsPointFromElems(
      this.X.Negate(),
      this.Y,
      this.Z,
      this.T.Negate(),
    )
  }

  ToExtended(): EdwardsPoint {
    return EdwardsPoint.EdwardsPointFromElems(
      this.X.Mul(this.T),
      this.Y.Mul(this.Z),
      this.Z.Mul(this.T),
      this.X.Mul(this.Y),
    )
  }

  AddPnp(other: ProjectiveNielsPoint): CompletedPoint {
    const Y_plus_X = this.Y.Add(this.X)
    const Y_minus_X = this.Y.Sub(this.X)
    const PP = Y_plus_X.Mul(other.Y_plus_X)
    const MM = Y_minus_X.Mul(other.Y_minus_X)
    const TT2d = this.T.Mul(other.T2d)
    const ZZ = this.Z.Mul(other.Z)
    const ZZ2 = ZZ.Add(ZZ)

    const cp = new CompletedPoint()
    cp.X = PP.Sub(MM)
    cp.Y = PP.Add(MM)
    cp.Z = ZZ2.Add(TT2d)
    cp.T = ZZ2.Sub(TT2d)
    return cp
  }

  AddAnp(other: AffineNielsPoint): CompletedPoint {
    const Y_plus_X = this.Y.Add(this.X)
    const Y_minus_X = this.Y.Sub(this.X)
    const PP = Y_plus_X.Mul(other.Y_plus_X)
    const MM = Y_minus_X.Mul(other.Y_minus_X)
    const Txy2d = this.T.Mul(other.XY2d)
    const Z2 = this.Z.Add(this.Z)

    const cp = new CompletedPoint()
    cp.X = PP.Sub(MM)
    cp.Y = PP.Add(MM)
    cp.Z = Z2.Add(Txy2d)
    cp.T = Z2.Sub(Txy2d)
    return cp
  }

  AddEp(other: EdwardsPoint): EdwardsPoint {
    return this.AddPnp(other.ToProjectiveNiels()).ToExtended()
  }

  SubAnp(other: AffineNielsPoint): CompletedPoint {
    const Y_plus_X = this.Y.Add(this.X)
    const Y_minus_X = this.Y.Sub(this.X)
    const PM = Y_plus_X.Mul(other.Y_minus_X)
    const MP = Y_minus_X.Mul(other.Y_plus_X)
    const Txy2d = this.T.Mul(other.XY2d)
    const Z2 = this.Z.Add(this.Z)

    const cp = new CompletedPoint()
    cp.X = PM.Sub(MP)
    cp.Y = PM.Add(MP)
    cp.Z = Z2.Sub(Txy2d)
    cp.T = Z2.Add(Txy2d)
    return cp
  }

  SubPnp(other: ProjectiveNielsPoint): CompletedPoint {
    const Y_plus_X = this.Y.Add(this.X)
    const Y_minus_X = this.Y.Sub(this.X)
    const PM = Y_plus_X.Mul(other.Y_minus_X)
    const MP = Y_minus_X.Mul(other.Y_plus_X)
    const TT2d = this.T.Mul(other.T2d)
    const ZZ = this.Z.Mul(other.Z)
    const ZZ2 = ZZ.Add(ZZ)

    const cp = new CompletedPoint()
    cp.X = PM.Sub(MP)
    cp.Y = PM.Add(MP)
    cp.Z = ZZ2.Sub(TT2d)
    cp.T = ZZ2.Add(TT2d)
    return cp
  }

  ToProjectiveNiels(): ProjectiveNielsPoint {
    const cp = new ProjectiveNielsPoint()
    cp.Y_plus_X = this.Y.Add(this.X)
    cp.Y_minus_X = this.Y.Sub(this.X)
    cp.Z = this.Z
    cp.T2d = this.T.Mul(EDWARDS_D2)
    return cp
  }

  ToProjective(): ProjectivePoint {
    const cp = new ProjectivePoint()
    cp.X = this.X
    cp.Y = this.Y
    cp.Z = this.Z
    return cp
  }

  ToAffineNiels(): AffineNielsPoint {
    // const recip = this.Z.Invert()
    // const x = this.X.Mul(recip)
    // const y = this.Y.Mul(recip)
    const xy2d = this.X.Mul(this.Y).Mul(EDWARDS_D2)

    const cp = new AffineNielsPoint()
    cp.Y_plus_X = this.Y.Add(this.X)
    cp.Y_minus_X = this.Y.Sub(this.X)
    cp.XY2d = xy2d
    return cp
  }
}
