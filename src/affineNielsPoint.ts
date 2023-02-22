import {FieldElement} from './fieldElement'

export class AffineNielsPoint {
  public Y_plus_X: FieldElement
  public Y_minus_X: FieldElement
  public XY2d: FieldElement

  constructor() {
    this.Y_plus_X = FieldElement.One()
    this.Y_minus_X = FieldElement.One()
    this.XY2d = FieldElement.Zero()
  }

  static FromElements(Y_plus_X: FieldElement, Y_minus_X: FieldElement, XY2d: FieldElement): AffineNielsPoint {
    const res = new AffineNielsPoint()
    res.Y_plus_X = Y_plus_X
    res.Y_minus_X = Y_minus_X
    res.XY2d = XY2d
    return res
  }

  static FromArray(array: bigint[]): AffineNielsPoint {
    if (array.length !== 15) {
      throw new Error('Array length must be 15')
    }
    return AffineNielsPoint.FromElements(
      new FieldElement(array.slice(0, 5)),
      new FieldElement(array.slice(5, 10)),
      new FieldElement(array.slice(10, 15)),
    )
  }

  static FromStringInRadix36Form(param: string): AffineNielsPoint {
    const array = param.split(',').map(x => BigInt(parseInt(x, 36)))
    if (array.length !== 15) {
      throw new Error('Array length must be 15')
    }
    return AffineNielsPoint.FromElements(
      new FieldElement(array.slice(0, 5)),
      new FieldElement(array.slice(5, 10)),
      new FieldElement(array.slice(10, 15)),
    )
  }

  ConditionalAssign(a: AffineNielsPoint, choice: boolean): void {
    this.Y_plus_X.ConditionalAssign(a.Y_plus_X, choice)
    this.Y_minus_X.ConditionalAssign(a.Y_minus_X, choice)
    this.XY2d.ConditionalAssign(a.XY2d, choice)
  }

  BitXor(a: AffineNielsPoint): AffineNielsPoint {
    const r = new AffineNielsPoint()
    r.Y_plus_X = this.Y_plus_X.BitXor(a.Y_plus_X)
    r.Y_minus_X = this.Y_minus_X.BitXor(a.Y_minus_X)
    r.XY2d = this.XY2d.BitXor(this.XY2d)
    return r
  }

  ConditionalNegate(choice: boolean): void {
    const nself = this.Negate()
    this.ConditionalAssign(nself, choice)
  }

  Negate(): AffineNielsPoint {
    const r = new AffineNielsPoint()
    r.Y_plus_X = this.Y_minus_X.Clone()
    r.Y_minus_X = this.Y_plus_X.Clone()
    r.XY2d = this.XY2d.Negate()
    return r
  }
}
