import { FieldElement } from "./fieldElement"
import { CompletedPoint } from "./completedPoint"
import { EdwardsPoint } from "./edwardsPoint"

export class ProjectivePoint
{
    public X: FieldElement;
    public Y: FieldElement;
    public Z: FieldElement;

    Double() : CompletedPoint
    {
        var XX = this.X.Square();
        var YY = this.Y.Square();
        var ZZ2 = this.Z.Square2();
        var X_plus_Y = this.X.Add(this.Y);
        var X_plus_Y_sq = X_plus_Y.Square();
        var YY_plus_XX = YY.Add(XX);
        var YY_minus_XX = YY.Sub(XX);

        var r = new CompletedPoint();
        r.X = X_plus_Y_sq.Sub(YY_plus_XX);
        r.Y = YY_plus_XX;
        r.Z = YY_minus_XX;
        r.T = ZZ2.Sub(YY_minus_XX);

        return r;
    }

    static Identity() : ProjectivePoint
    {
        var r = new ProjectivePoint();
        r.X = FieldElement.Zero();
        r.Y = FieldElement.One();
        r.Z = FieldElement.One();
        return r;
    }

    ToExtended() : EdwardsPoint
    {
        return EdwardsPoint.EdwardsPointFromElems(
            this.X.Mul(this.Z),
            this.Y.Mul(this.Z),
            this.Z.Square(),
            this.X.Mul(this.Y),
        );
    }
}