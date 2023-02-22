import type {ProjectiveNielsPoint} from './projectiveNielsPoint'
import type {LookupTable} from './edwardsBasepointTable'
import type {AffineNielsPoint} from './affineNielsPoint'
import {EdwardsPoint} from './edwardsPoint'

export class NafLookupTable5PNP {
  public Pnp: ProjectiveNielsPoint[]

  Select(v: number): ProjectiveNielsPoint {
    return this.Pnp[v / 2]
  }
}

export class NafLookupTable {
  public lookupTable: LookupTable

  public NafLookupTable(lookupTable: LookupTable) {
    this.lookupTable = lookupTable
  }

  Select(v: number): AffineNielsPoint {
    return this.lookupTable.affineNielsPoints[v / 2]
  }

  static FromEdwardsPoint(points: EdwardsPoint): NafLookupTable5PNP {
    const Ai: ProjectiveNielsPoint[] = new Array(8)

    for (let i = 0; i < 8; i++) {
      Ai[i] = points.ToProjectiveNiels()
    }

    const A2 = EdwardsPoint.Double(points)

    for (let i = 0; i <= 6; i++) {
      Ai[i + 1] = A2.AddPnp(Ai[i]).ToExtended().ToProjectiveNiels()
    }

    /// Now Ai = [A, 3A, 5A, 7A, 9A, 11A, 13A, 15A]
    const nlt = new NafLookupTable5PNP()
    nlt.Pnp = Ai
    return nlt
  }
}
