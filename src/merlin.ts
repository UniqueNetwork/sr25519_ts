import { Strobe, operationMap, Flag, Operation } from "./strobe";
import { RandomGenerator } from "./signingcontext";

export function getBytesU32(num: number): Uint8Array{
    let r = new Uint8Array(4);
    r[0] = num % 256;
    r[1] = num << 8 % 256;
    r[2] = num << 16 % 256;
    r[3] = num << 24 % 256;
    return r;
}

class TranscriptRngBuilder {

    strobe: Transcript;

    constructor(strobe: Transcript){
        this.strobe = strobe;
    }

    RekeyWithWitnessBytes(label: Uint8Array, witness: Uint8Array): TranscriptRngBuilder
    {
        this.strobe.MetaAd(label, false);
        this.strobe.MetaAd(getBytesU32(witness.length), true);
        this.strobe.Key(witness, false);

        return this;
    }

    Finalize(rng: RandomGenerator): Transcript  //TranscriptRngBuilder
    {
        var bytes = rng.GetRandomArrayU8_32();

        var newStrobe = this.strobe.Clone();
        newStrobe.MetaAd(Buffer.from("rng", 'ascii'), false);
        newStrobe.Key(bytes, false);

        return newStrobe;
    }
}

export class Transcript{
    obj: Strobe;
    MERLIN_PROTOCOL_LABEL = "Merlin v1.0";

    constructor()
    {}

    Init(label: string)
    {
        // strobe_init();
        this.obj = new Strobe();
        this.obj.strobe_init(this.MERLIN_PROTOCOL_LABEL);

        this.AppendMessage(Buffer.from("dom-sep", 'ascii'), Buffer.from(label, 'ascii'));
    }

    Clone(): Transcript
    {
        let c = new Transcript();
        c.obj = this.obj.clone();
        return c;
    }

    AppendMessage(label: Uint8Array, message: Uint8Array)
    {
        this.MetaAd(label, false);
        this.MetaAd(getBytesU32(message.length), true);
        this.Ad(message, false);
    }

    MetaAd(data: Uint8Array, more: boolean)
    {
        var error = this.obj.operate(true, operationMap.get(Operation.Ad) as Flag, data, 0, data.length, 0, more);
        if (error != null)
        {
           // throw new ApplicationException($"{error}");
        }
    }

    Ad(data: Uint8Array, more: boolean)
    {
        var error = this.obj.operate(false, operationMap.get(Operation.Ad) as Flag, data, 0, data.length, 0, more);
        if (error != null)
        {
            // throw new ApplicationException($"{error}");
        }
    }

    Prf(expectedOutput: number, more: boolean): Uint8Array | null
    {
        let ed = new Uint8Array(0);
        var result = this.obj.operate(false, operationMap.get(Operation.Prf) as Flag, ed, 0, 0, expectedOutput, more);
        if (result == null)
        {
           // throw new ApplicationException($"{result}");
        }

        return result;
    }

    Key(data: Uint8Array, more: boolean)
    {
        var error = this.obj.operate(false, operationMap.get(Operation.Key) as Flag, data, 0, data.length, 0, more);
        if (error != null)
        {
           // throw new Exception($"{error}");
        }
    }

    AppendU64(label: Uint8Array, message: Uint8Array)
    {
        this.AppendMessage(label, message);
    }

    ChallengeBytes(label: Uint8Array, size: number): Uint8Array
    {
        let sz = getBytesU32(size);
        this.MetaAd(label, false);
        this.MetaAd(sz, true);

        return this.Prf(size, false) as Uint8Array;
    }

    WitnessBytes(label: Uint8Array, nonceSeeds: Uint8Array, rng: RandomGenerator): Transcript
    {
        let ns: Array<Uint8Array> = new Array(1);
        ns[0] = nonceSeeds;
        return this.WitnessBytesRngL(label, ns, rng);
    }

    WitnessBytesRngL(label: Uint8Array,nonce_seeds: Array<Uint8Array>, rng: RandomGenerator): Transcript
    {
        var br = this.BuildRng();
        nonce_seeds.forEach(ns => {
            br = br.RekeyWithWitnessBytes(label, ns);

        });

        return br.Finalize(rng);
    }

    BuildRng(): TranscriptRngBuilder
    {
        return new TranscriptRngBuilder(this.Clone());
    }

}