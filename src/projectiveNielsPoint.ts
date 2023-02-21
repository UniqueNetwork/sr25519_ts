import {FieldElement} from './fieldElement'

export class ProjectiveNielsPoint {
  public Y_plus_X: FieldElement
  public Y_minus_X: FieldElement
  public Z: FieldElement
  public T2d: FieldElement

  public constructor() {
    this.Y_plus_X = FieldElement.Zero()
    this.Y_minus_X = FieldElement.Zero()
    this.Z = FieldElement.Zero()
    this.T2d = FieldElement.Zero()
  }

  BitXor(a: ProjectiveNielsPoint): ProjectiveNielsPoint {
    const r = new ProjectiveNielsPoint()
    r.Y_plus_X = this.Y_plus_X.BitXor(a.Y_plus_X)
    r.Y_minus_X = this.Y_minus_X.BitXor(a.Y_minus_X)
    r.Z = this.Z.BitXor(a.Z)
    r.T2d = this.T2d.BitXor(a.T2d)
    return r
  }

  BitAnd(a: number): ProjectiveNielsPoint {
    const aa = BigInt(a)
    const r = new ProjectiveNielsPoint()
    r.Y_plus_X = this.Y_plus_X.BitAnd(aa)
    r.Y_minus_X = this.Y_minus_X.BitAnd(aa)
    r.Z = this.Z.BitAnd(aa)
    r.T2d = this.T2d.BitAnd(aa)
    return r
  }

  Negate(): ProjectiveNielsPoint {
    const r = new ProjectiveNielsPoint()
    r.Y_plus_X = this.Y_plus_X.Negate()
    r.Y_minus_X = this.Y_minus_X.Negate()
    r.Z = this.Z.Negate()
    r.T2d = this.T2d.Negate()
    return r
  }

  Copy(): ProjectiveNielsPoint {
    const r = new ProjectiveNielsPoint()
    r.Y_plus_X = this.Y_plus_X.Clone()
    r.Y_minus_X = this.Y_minus_X.Clone()
    r.Z = this.Z.Clone()
    r.T2d = this.T2d.Clone()
    return r
  }

  GetPoint(): ProjectiveNielsPoint {
    return this
  }

  FromPoint(a: ProjectiveNielsPoint): void {
    this.Y_plus_X = a.Y_plus_X
    this.Y_minus_X = a.Y_minus_X
    this.Z = a.Z
    this.T2d = a.T2d
  }

  ConditionalAssign(a: ProjectiveNielsPoint, choice: boolean): void {
    // if choice = 0, mask = (-0) = 0000...0000
    // if choice = 1, mask = (-1) = 1111...1111
    const mask = choice ? 0b1111_1111_1111_1111 : 0b0000_0000_0000_0000

    //    *self ^= mask & (*self ^ *other);
    this.FromPoint(this.GetPoint().BitXor(this.BitXor(a).BitAnd(mask)))
  }

  ConditionalNegate(choice: boolean): void {
    const p = this.GetPoint()
    this.ConditionalAssign(p, choice)
  }
}
