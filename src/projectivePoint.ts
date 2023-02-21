import {FieldElement} from './fieldElement'
import {CompletedPoint} from './completedPoint'
import {EdwardsPoint} from './edwardsPoint'

export class ProjectivePoint {
  public X: FieldElement
  public Y: FieldElement
  public Z: FieldElement

  Double(): CompletedPoint {
    const XX = this.X.Square()
    const YY = this.Y.Square()
    const ZZ2 = this.Z.Square2()
    const X_plus_Y = this.X.Add(this.Y)
    const X_plus_Y_sq = X_plus_Y.Square()
    const YY_plus_XX = YY.Add(XX)
    const YY_minus_XX = YY.Sub(XX)

    const r = new CompletedPoint()
    r.X = X_plus_Y_sq.Sub(YY_plus_XX)
    r.Y = YY_plus_XX
    r.Z = YY_minus_XX
    r.T = ZZ2.Sub(YY_minus_XX)

    return r
  }

  static Identity(): ProjectivePoint {
    const r = new ProjectivePoint()
    r.X = FieldElement.Zero()
    r.Y = FieldElement.One()
    r.Z = FieldElement.One()
    return r
  }

  ToExtended(): EdwardsPoint {
    return EdwardsPoint.EdwardsPointFromElems(
      this.X.Mul(this.Z),
      this.Y.Mul(this.Z),
      this.Z.Square(),
      this.X.Mul(this.Y),
    )
  }
}
