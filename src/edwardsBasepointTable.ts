import {Scalar} from './scalar'
import {EdwardsPoint} from './edwardsPoint'
import {AffineNielsPoint} from './affineNielsPoint'

export class EdwardsBasepointTable {
  public lt: LookupTable[]

  constructor(lt: LookupTable[] = []) {
    this.lt = lt
  }

  Mul(sclr: Scalar): EdwardsPoint {
    const a = Scalar.ToRadix16(sclr.bytes)
    let P = EdwardsPoint.Identity()

    for (let i = 0; i < 64; i++) {
      if (i % 2 === 1) {
        const s1 = this.lt[Math.floor(i / 2)].Select(a[i])
        const s2 = P.AddAnp(s1)
        const s3 = s2.ToExtended()

        P = s3
      }
    }

    P = P.MulByPow2(4)

    for (let i = 0; i < 64; i++) {
      if (i % 2 === 0) {
        P = P.AddAnp(this.lt[Math.floor(i / 2)].Select(a[i])).ToExtended()
      }
    }

    return P
  }
}

export class LookupTable {
  public ep: EdwardsPoint
  public affineNielsPoints: AffineNielsPoint[]

  static FromEdward(ep: EdwardsPoint): LookupTable {
    const res = new LookupTable()
    res.ep = ep
    res.affineNielsPoints = new AffineNielsPoint[8]()
    res.affineNielsPoints[0] = ep.ToAffineNiels()
    for (let j = 0; j < 7; j++) {
      res.affineNielsPoints[j + 1] = ep.AddAnp(res.affineNielsPoints[j]).ToExtended().ToAffineNiels()
    }
    return res
  }

  static FromANPArray(p: AffineNielsPoint[]): LookupTable {
    const res = new LookupTable()
    res.affineNielsPoints = p
    return res
  }

  static FromBigintMatrix = (table: bigint[][]): LookupTable => {
    return LookupTable.FromANPArray(table.map(AffineNielsPoint.FromArray))
  }

  static FromArrayOfStringsInRadix36Form(table: string[]): LookupTable {
    return LookupTable.FromANPArray(table.map(AffineNielsPoint.FromStringInRadix36Form))
  }

  // x - sbyte
  Select(x: number): AffineNielsPoint {
    // Compute xabs = |x|
    const xmask = x >> 7
    const xabs = ((x + xmask) ^ xmask)

    // Set t = 0 * P = identity
    const t = new AffineNielsPoint()
    for (let i = 1; i < 9; i++) {
      // Copy `points[j-1] === j*P` onto `t` in constant time if `|x| === j`.
      t.ConditionalAssign(this.affineNielsPoints[i - 1], xabs === i)
    }

    // Now t === |x| * P.
    const neg_mask = (xmask & 1)
    t.ConditionalNegate(neg_mask === 1)
    // Now t === x * P.

    return t
  }

  static From(ep: EdwardsPoint): LookupTable {
    return LookupTable.FromEdward(ep)
  }
}
