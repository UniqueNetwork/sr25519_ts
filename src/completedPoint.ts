import type {FieldElement} from './fieldElement'
import {EdwardsPoint} from './edwardsPoint'
import {ProjectivePoint} from './projectivePoint'

export class CompletedPoint {
  public X: FieldElement
  public Y: FieldElement
  public Z: FieldElement
  public T: FieldElement

  ToProjective(): ProjectivePoint {
    const r = new ProjectivePoint()
    r.X = this.X.Mul(this.T)
    r.Y = this.Y.Mul(this.Z)
    r.Z = this.Z.Mul(this.T)
    return r
  }

  ToExtended(): EdwardsPoint {
    return EdwardsPoint.EdwardsPointFromElems(
      this.X.Mul(this.T),
      this.Y.Mul(this.Z),
      this.Z.Mul(this.T),
      this.X.Mul(this.Y),
    )
  }
}
