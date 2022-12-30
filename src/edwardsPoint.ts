import { FieldElement } from "./fieldElement"
import { CompletedPoint } from "./completedPoint";
import { ProjectivePoint } from "./projectivePoint";
import { AffineNielsPoint } from "./affineNielsPoint";
import { ProjectiveNielsPoint } from "./projectiveNielsPoint";

/// Edwards `2*d` value, equal to `2*(-121665/121666) mod p`.
var EDWARDS_D2 = new FieldElement([1859910466990425n, 932731440258426n, 1072319116312658n, 1815898335770999n, 633789495995903n]);
var EDWARDS_D = new FieldElement([929955233495203n, 466365720129213n, 1662059464998953n, 2033849074728123n, 1442794654840575n]);

export class EdwardsPoint
{
    public X: FieldElement;
    public Y: FieldElement;
    public Z: FieldElement;
    public T: FieldElement;

    // public constructor() {}

    FromElems(x: FieldElement, y: FieldElement, z: FieldElement, t: FieldElement)
    {
        this.X = x;
        this.Y = y;
        this.Z = z;
        this.T = t;
    }

    static EdwardsPointFromElems(x: FieldElement, y: FieldElement, z: FieldElement, t: FieldElement)
    {
        var ep = new EdwardsPoint();
        ep.X = x;
        ep.Y = y;
        ep.Z = z;
        ep.T = t;
        return ep;
    }

    public Equals(a: EdwardsPoint): boolean
    {
        var result = true;
        for (var i = 0; i < 5; i++)
        {
            result = result && this.X.data[i] == a.X.data[i]
                && this.Y.data[i] == a.Y.data[i]
                && this.Z.data[i] == a.Z.data[i]
                && this.T.data[i] == a.T.data[i];
        }

        return result;
    }

    Copy(): EdwardsPoint
    {
        var ep = new EdwardsPoint();
        ep.FromElems(this.X, this.Y, this.Z, this.T);
        return ep;
    }

    static Decompress(bytes: Uint8Array) : EdwardsPoint
    {
        // var invsqrt =
        // new Func<FieldElement51, (bool, FieldElement51)>((el) => {
        //     return FieldElement51.SqrtRatioI(FieldElement51.One(), el);
        // });

        var s = FieldElement.FromBytes(bytes);

        // Step 2.  Compute (X:Y:Z:T).
        var one = FieldElement.One();
        var ss = s.Square();
        var u1 = one.Sub(ss);      //  1 + as²
        var u2 = one.Add(ss);      //  1 - as²    where a=-1
        var u2_sqr = u2.Square(); // (1 - as²)²

        // v == ad(1+as²)² - (1-as²)²            where d=-121665/121666
        var nEdwardsD = EDWARDS_D.Negate();
        var v = nEdwardsD.Mul(u1.Square()).Sub(u2_sqr);

        //  invsqrt(v * u2_sqr);
        var I = FieldElement.SqrtRatioI(FieldElement.One(), v.Mul(u2_sqr)); // 1/sqrt(v*u_2²)

        var Dx = I.i1.Mul(u2);         // 1/sqrt(v)
        var Dy = I.i1.Mul(Dx).Mul(v); // 1/u2

        // x == | 2s/sqrt(v) | == + sqrt(4s²/(ad(1+as²)² - (1-as²)²))
        var x = (s.Add(s)).Mul(Dx);
        var x_neg = x.IsNegative();
        x.ConditionalNegate(x_neg);

        // y == (1-as²)/(1+as²)
        var y = u1.Mul(Dy);

        // t == ((1+as²) sqrt(4s²/(ad(1+as²)² - (1-as²)²)))/(1-as²)
        var t = x.Mul(y);

        return EdwardsPoint.EdwardsPointFromElems(x, y, one, t);
    }

    static Double(point: EdwardsPoint) : EdwardsPoint
    {
        return point.ToProjective().Double().ToExtended();
    }

    /// Compute \\([2\^k] P \\) by successive doublings. Requires \\( k > 0 \\).
    MulByPow2(k: number): EdwardsPoint
    {
        var r: CompletedPoint;
        var s = this.ToProjective();
        for (var i = 0; i < k - 1; i++)
        {
            r = s.Double();
            s = r.ToProjective();
        }

        // Unroll last iteration so we can go directly to_extended()
        return s.Double().ToExtended();
    }

    static Identity(): EdwardsPoint
    {
        return EdwardsPoint.EdwardsPointFromElems(
            FieldElement.Zero(), FieldElement.One(), FieldElement.One(), FieldElement.Zero());
    }

    Negate() : EdwardsPoint
    {
        return EdwardsPoint.EdwardsPointFromElems(
            this.X.Negate(), this.Y, this.Z, this.T.Negate());
    }

    ToExtended() : EdwardsPoint
    {
        return EdwardsPoint.EdwardsPointFromElems(
            this.X.Mul(this.T),
            this.Y.Mul(this.Z),
            this.Z.Mul(this.T),
            this.X.Mul(this.Y));
    }

    AddPnp(other: ProjectiveNielsPoint) : CompletedPoint
    {
        var Y_plus_X = this.Y.Add(this.X);
        var Y_minus_X = this.Y.Sub(this.X);
        var PP = Y_plus_X.Mul(other.Y_plus_X);
        var MM = Y_minus_X.Mul(other.Y_minus_X);
        var TT2d = this.T.Mul(other.T2d);
        var ZZ = this.Z.Mul(other.Z);
        var ZZ2 = ZZ.Add(ZZ);

        var cp = new CompletedPoint();
        cp.X = PP.Sub(MM);
        cp.Y = PP.Add(MM);
        cp.Z = ZZ2.Add(TT2d);
        cp.T = ZZ2.Sub(TT2d);
        return cp;
    }

    AddAnp(other: AffineNielsPoint) : CompletedPoint
    {
        var Y_plus_X = this.Y.Add(this.X);
        var Y_minus_X = this.Y.Sub(this.X);
        var PP = Y_plus_X.Mul(other.Y_plus_X);
        var MM = Y_minus_X.Mul(other.Y_minus_X);
        var Txy2d = this.T.Mul(other.XY2d);
        var Z2 = this.Z.Add(this.Z);

        var cp = new CompletedPoint();
        cp.X = PP.Sub(MM);
        cp.Y = PP.Add(MM);
        cp.Z = Z2.Add(Txy2d);
        cp.T = Z2.Sub(Txy2d);
        return cp;
    }

    AddEp(other: EdwardsPoint) : EdwardsPoint
    {
        return this.AddPnp(other.ToProjectiveNiels()).ToExtended();
    }

    SubAnp(other: AffineNielsPoint): CompletedPoint
    {
        var Y_plus_X = this.Y.Add(this.X);
        var Y_minus_X = this.Y.Sub(this.X);
        var PM = Y_plus_X.Mul(other.Y_minus_X);
        var MP = Y_minus_X.Mul(other.Y_plus_X);
        var Txy2d = this.T.Mul(other.XY2d);
        var Z2 = this.Z.Add(this.Z);

        var cp = new CompletedPoint();
        cp.X = PM.Sub(MP);
        cp.Y = PM.Add(MP);
        cp.Z = Z2.Sub(Txy2d);
        cp.T = Z2.Add(Txy2d);
        return cp;
    }

    SubPnp(other: ProjectiveNielsPoint) : CompletedPoint
    {
        var Y_plus_X = this.Y.Add(this.X);
        var Y_minus_X = this.Y.Sub(this.X);
        var PM = Y_plus_X.Mul(other.Y_minus_X);
        var MP = Y_minus_X.Mul(other.Y_plus_X);
        var TT2d = this.T.Mul(other.T2d);
        var ZZ = this.Z.Mul(other.Z);
        var ZZ2 = ZZ.Add(ZZ);

        var cp = new CompletedPoint();
        cp.X = PM.Sub(MP);
        cp.Y = PM.Add(MP);
        cp.Z = ZZ2.Sub(TT2d);
        cp.T = ZZ2.Add(TT2d);
        return cp;
    }

    ToProjectiveNiels() : ProjectiveNielsPoint
    {
        var cp = new ProjectiveNielsPoint();
        cp.Y_plus_X = this.Y.Add(this.X);
        cp.Y_minus_X = this.Y.Sub(this.X);
        cp.Z = this.Z;
        cp.T2d = this.T.Mul(EDWARDS_D2);
        return cp;
    }

    ToProjective() : ProjectivePoint
    {
        var cp = new ProjectivePoint();
        cp.X = this.X;
        cp.Y = this.Y;
        cp.Z = this.Z;
        return cp;
    }

    ToAffineNiels() : AffineNielsPoint
    {
        var recip = this.Z.Invert();
        var x = this.X.Mul(recip);
        var y = this.Y.Mul(recip);
        var xy2d = this.X.Mul(this.Y).Mul(EDWARDS_D2);

        var cp = new AffineNielsPoint();
        cp.Y_plus_X = this.Y.Add(this.X);
        cp.Y_minus_X = this.Y.Sub(this.X);
        cp.XY2d = xy2d;
        return cp;
    }
}