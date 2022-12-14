import { Transcript } from "./merlin";

interface ISigningContext
{
    Bytes(data: Uint8Array): Transcript;
    GetTranscript(): Transcript;
}

class SecretKey{}
class PublicKey{}
export class RandomGenerator{}
class Signature{}
class CompressedRistretto{

    ToBytes(): Uint8Array {
        return new Uint8Array(2);
    }
}
class Scalar {
    static FromBytesModOrderWide(data: Uint8Array): Scalar {
        return new Scalar();
    }
}

class SigningTranscript {

    context: ISigningContext;

    constructor( context: ISigningContext)
    {
        //_operations = new SigningTranscriptOperation();
        this.context = context;
    }

    SetProtocolName(label: Uint8Array)
    {
        this.CommitBytesB(this.context.GetTranscript(), Buffer.from("proto-name", 'ascii') , label);
    }

    CommitPoint(label: Uint8Array, compressed: CompressedRistretto)
    {
        this.CommitBytesB(this.context.GetTranscript(), label, compressed.ToBytes());
    }

    CommitPointBytes(label: Uint8Array, bytes: Uint8Array)
    {
        this.CommitBytesB(this.context.GetTranscript(), label, bytes);
    }

    WitnessScalarLabel(label: Uint8Array, bytes: Uint8Array, rng: RandomGenerator): Scalar
    {
        return this.WitnessScalarFR(this.context.GetTranscript(), label, bytes, rng);
    }

    WitnessScalar(bytes: Uint8Array, rng: RandomGenerator): Scalar
    {
        return this.WitnessScalarSR(this.context.GetTranscript(), bytes, rng);
    }

    ChallengeScalar(label: Uint8Array): Scalar
    {
        var data = this.ChallengeBytes(label);
        return Scalar.FromBytesModOrderWide(data);
    }

    ChallengeBytes(label: Uint8Array): Uint8Array
    {
        var result = this.ChallengeBytesTL(this.context.GetTranscript(), label);
        return result;
    }

    ChallengeBytesTL(ts: Transcript, label: Uint8Array): Uint8Array
    {
        return ts.ChallengeBytes(label, 64);
    }

    CommitBytesB(ts: Transcript, label: Uint8Array, bytes: Uint8Array)
    {
        ts.AppendMessage(label, bytes);
    }

    CommitBytesS(ts: Transcript, label: string, bytes: Uint8Array)
    {
        ts.AppendMessage(Buffer.from(label, 'ascii'), bytes);
    }

    CommitPointF(ts: Transcript, label: Uint8Array, compressedRistretto: Uint8Array)
    {
        this.CommitBytesB(ts, label, compressedRistretto);
    }

    WitnessScalarSR(ts: Transcript, nonce: Uint8Array, rng: RandomGenerator): Scalar
    {
        byte[] bt = new byte[64];
        bt.Initialize();
        ts.WitnessBytes(ref bt, nonce, rng);

        return Scalar.FromBytesModOrderWide(bt);
    }

    WitnessScalarFR(ts: Transcript, label: Uint8Array, nonce: Uint8Array, rng: RandomGenerator): Scalar
    {
        byte[] bt = new byte[64];
        bt.Initialize();
        ts.WitnessBytes(label, ref bt, nonce, rng);

        return Scalar.FromBytesModOrderWide(bt);
    }

}


export class SigningContext085 implements ISigningContext
{ 
    ts: Transcript;

    SigningContext085(context: Uint8Array)
    {
        this.ts = new Transcript();
        this.ts.Init("SigningContext");
        this.ts.AppendMessage(new Uint8Array(), context);
    }

    Bytes(data: Uint8Array): Transcript
    {
        var clone = this.ts.Clone();
        // Buffer.from(description, 'ascii')
        clone.AppendMessage(Buffer.from("sign-bytes", 'ascii'), data);
        return clone;
    }

    GetTranscript(): Transcript
    {
        return this.ts;
    }

    // public static Signature 
    sign(st: SigningTranscript, secretKey: SecretKey, publicKey: PublicKey, rng: RandomGenerator) : Signature
    {
        st.SetProtocolName(GetStrBytes("Schnorr-sig"));
        st.CommitPoint(GetStrBytes("sign:pk"), publicKey.Key);

        var r = st.WitnessScalar(GetStrBytes("signing"), secretKey.nonce, rng);

        var tbl = new RistrettoBasepointTable();
        var R = tbl.Mul(r).Compress();

        st.CommitPoint(GetStrBytes("sign:R"), R);

        Scalar k = st.ChallengeScalar(GetStrBytes("sign:c"));  // context, message, A/public_key, R=rG
        k.Recalc();
        secretKey.key.Recalc();
        r.Recalc();

        var scalar = k.ScalarInner * secretKey.key.ScalarInner + r.ScalarInner;

        var s = new Scalar { ScalarBytes = scalar.ToBytes() };
        s.Recalc();

        return new Signature { R = R, S = s };
    }
}