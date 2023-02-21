export type FieldElement = bigint[] // [u64; 5];

export interface AffineNielsPoint {
  y_plus_x: FieldElement
  y_minus_x: FieldElement
  xy2d: FieldElement
}

type Scalar52 = bigint[]

export interface EdwardsPoint {
  X: FieldElement
  Y: FieldElement
  Z: FieldElement
  T: FieldElement
}

export type EdwardsBasepointTable = AffineNielsPoint[][] // [LookupTable; 32];

// The value of minus one, equal to `-&FieldElement::one()`
export const MINUS_ONE: FieldElement = [2251799813685228n, 2251799813685247n, 2251799813685247n, 2251799813685247n, 2251799813685247n]

// Edwards `d` value, equal to `-121665/121666 mod p`.
export const EDWARDS_D: FieldElement = [929955233495203n, 466365720129213n, 1662059464998953n, 2033849074728123n, 1442794654840575n]

// Edwards `2*d` value, equal to `2*(-121665/121666) mod p`.
export const EDWARDS_D2: FieldElement = [1859910466990425n, 932731440258426n, 1072319116312658n, 1815898335770999n, 633789495995903n]

/// One minus edwards `d` value squared, equal to `(1 - (-121665/121666) mod p) pow 2`
export const ONE_MINUS_EDWARDS_D_SQUARED: FieldElement = [1136626929484150n, 1998550399581263n, 496427632559748n, 118527312129759n, 45110755273534n]

// Edwards `d` value minus one squared, equal to `(((-121665/121666) mod p) - 1) pow 2`
export const EDWARDS_D_MINUS_ONE_SQUARED: FieldElement = [1507062230895904n, 1572317787530805n, 683053064812840n, 317374165784489n, 1572899562415810n]

// `= sqrt(a*d - 1)`, where `a = -1 (mod p)`, `d` are the Edwards curve parameters.
export const SQRT_AD_MINUS_ONE: FieldElement = [2241493124984347n, 425987919032274n, 2207028919301688n, 1220490630685848n, 974799131293748n]

// `= 1/sqrt(a-d)`, where `a = -1 (mod p)`, `d` are the Edwards curve parameters.
export const INVSQRT_A_MINUS_D: FieldElement = [278908739862762n, 821645201101625n, 8113234426968n, 1777959178193151n, 2118520810568447n]

// Precomputed value of one of the square roots of -1 (mod p)
export const SQRT_M1: FieldElement = [1718705420411056n, 234908883556509n, 2233514472574048n, 2117202627021982n, 765476049583133n]

// `APLUS2_OVER_FOUR` is (A+2)/4. (This is used internally within the Montgomery ladder.)
export const APLUS2_OVER_FOUR: FieldElement = [121666n, 0n, 0n, 0n, 0n]

// `L` is the order of base point, i.e. 2^252 + 27742317777372353535851937790883648493
export const L: Scalar52 = [0x0002631a5cf5d3edn, 0x000dea2f79cd6581n, 0x000000000014def9n, 0x0000000000000000n, 0x0000100000000000n]

// `L` * `LFACTOR` = -1 (mod 2^52)
// const LFACTOR: bigint = 0x51da312547e1bn

// `R` = R % L where R = 2^260
export const R: Scalar52 = [0x000f48bd6721e6edn, 0x0003bab5ac67e45an, 0x000fffffeb35e51bn, 0x000fffffffffffffn, 0x00000fffffffffffn]

// `RR` = (R^2) % L where R = 2^260
export const RR: Scalar52 = [0x0009d265e952d13bn, 0x000d63c715bea69fn, 0x0005be65cb687604n, 0x0003dceec73d217fn, 0x000009411b7c309an]

/// The Ed25519 basepoint, as an `EdwardsPoint`.
///
/// This is called `_POINT` to distinguish it from
/// `ED25519_BASEPOINT_TABLE`, which should be used for scalar
/// multiplication (it's much faster).
export const ED25519_BASEPOINT_POINT: EdwardsPoint = {
  X: [1738742601995546n, 1146398526822698n, 2070867633025821n, 562264141797630n, 587772402128613n],
  Y: [1801439850948184n, 1351079888211148n, 450359962737049n, 900719925474099n, 1801439850948198n],
  Z: [1n, 0n, 0n, 0n, 0n],
  T: [1841354044333475n, 16398895984059n, 755974180946558n, 900171276175154n, 1821297809914039n],
}
