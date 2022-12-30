import { FieldElement, SQRT_M1 } from "./fieldElement";
import { Scalar } from "./scalar";
import { EdwardsBasepointTable } from "./edwardsBasepointTable";
import { EdwardsPoint } from "./edwardsPoint";
import { ProjectivePoint } from "./projectivePoint";
import { NafLookupTable } from "./nafLookupTable";
import { AFFINE_ODD_MULTIPLES_OF_BASEPOINT, ED25519_BASEPOINT_TABLE_INNER } from "./tables";

export var INVSQRT_A_MINUS_D = new FieldElement([ 278908739862762n, 821645201101625n, 8113234426968n, 1777959178193151n, 2118520810568447n]);

export class CompressedRistretto
{
    public compressedRistrettoBytes: Uint8Array;

    CompressedRistretto(data: Uint8Array)
    {
        this.compressedRistrettoBytes = data;
    }

    ToBytes(): Uint8Array
    {
        return this.compressedRistrettoBytes;
    }

    GetBytes(): Uint8Array
    {
        return this.compressedRistrettoBytes;
    }
}

export class RistrettoBasepointTable
{
    public edwardsBasepointTable: EdwardsBasepointTable;

    public constructor()
    {
        this.edwardsBasepointTable = ED25519_BASEPOINT_TABLE_INNER;
    }

    Mul(s: Scalar): RistrettoPoint
    {
        var ep = this.edwardsBasepointTable.Mul(s);

        return new RistrettoPoint(ep);
    }
}

export class RistrettoPoint
{
    public Ep: EdwardsPoint;

    public constructor(ep: EdwardsPoint)
    {
        this.Ep = ep;
    }

    /// Compute \\(aA + bB\\) in variable time, where \\(B\\) is the
    /// Ristretto basepoint.
    static VartimeDoubleScalarMulBasepoint(a: Scalar, A: EdwardsPoint, b: Scalar): EdwardsPoint
    {
        var aNaf = a.NonAdjacentForm(5);
        var bNaf = b.NonAdjacentForm(8);
        var i = 0;

        /// Find starting index
        for (var ind = 255; ind >= 0; ind--)
        {
            i = ind;
            if (aNaf[i] != 0 || bNaf[i] != 0)
            {
                break;
            }
        }

        var tableA = NafLookupTable.FromEdwardsPoint(A);
        var tableB = AFFINE_ODD_MULTIPLES_OF_BASEPOINT;

        var r = ProjectivePoint.Identity();

        while(i >= 0)
        {
            let t = r.Double();

            if (aNaf[i] > 0)
            {
                let t1 = t.ToExtended();
                let i1 = Math.floor( Math.abs((-1 * aNaf[i]) / 2));
                let t2 = tableA.Pnp[i1];
                t = t1.AddPnp(t2);
            }
            else if (aNaf[i] < 0)
            {
                let t1 = t.ToExtended();
                let i1 = Math.floor(Math.abs((-1 * aNaf[i]) / 2));
                let t2 = tableA.Pnp[i1];
                t = t1.SubPnp(t2);
            }

            if (bNaf[i] > 0)
            {
                let t1 = t.ToExtended();
                let i1 = Math.floor(Math.abs((-1 * bNaf[i]) / 2));
                let t2 = tableB.affineNielsPoints[i1];
                t = t1.AddAnp(t2);
            }
            else if (bNaf[i] < 0)
            {
                let t1 = t.ToExtended();
                let i1 =  Math.floor(Math.abs((-1 * bNaf[i]) / 2));
                let t2 = tableB.affineNielsPoints[i1];
                t = t1.SubAnp(t2);
            }

            r = t.ToProjective();

            i--;
        }

        return r.ToExtended();
    }

    /// Compress this point using the Ristretto encoding.
    Compress(): CompressedRistretto
    {
        var X = this.Ep.X;
        var Y = this.Ep.Y;
        var Z = this.Ep.Z;
        var T = this.Ep.T;

        var u1 = Z.Add(Y).Mul(Z.Sub(Y));
        var u2 = X.Mul(Y);

        // Ignore return value since this is always square
        var inv = FieldElement.SqrtRatioI(FieldElement.One(), u1.Mul(u2.Square()));
       // var inv = invsqrt(u1.Mul(u2.Square()));
        var i1 = inv.i1.Mul(u1);
        var i2 = inv.i1.Mul(u2);
        var z_inv = i1.Mul(i2.Mul(T));
        var den_inv = i2;

        var iX = X.Mul(SQRT_M1);
        var iY = Y.Mul(SQRT_M1);
        var ristretto_magic = (INVSQRT_A_MINUS_D);
        var enchanted_denominator = i1.Mul(ristretto_magic);
        var rotate = T.Mul(z_inv).IsNegative();

        X.ConditionalAssign(iY, rotate);
        Y.ConditionalAssign(iX, rotate);
        den_inv.ConditionalAssign(enchanted_denominator, rotate);

        Y.ConditionalNegate(X.Mul(z_inv).IsNegative());

        var s = den_inv.Mul(Z.Sub(Y));
        var s_is_negative = s.IsNegative();
        s.ConditionalNegate(s_is_negative);

        var res = new CompressedRistretto();
        res.compressedRistrettoBytes = s.ToBytes();

        return res;
    }
}