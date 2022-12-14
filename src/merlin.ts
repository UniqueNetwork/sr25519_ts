import { Strobe, operationMap, Flag, Operation } from "./strobe";
import { RandomGenerator } from "./signingcontext";

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
        this.MetaAd(Uint8Array.from([message.length]), true);
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
        var result = this.obj.operate(false, operationMap.get(Operation.Prf) as Flag, ed, expectedOutput, 0, 0, more);
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
        // AppendMessage(label, EncodeU64(message));
    }

    ChallengeBytes(label: Uint8Array, size: number): Uint8Array
    {
        let sz = Uint8Array.from([size]);
        this.MetaAd(label, false);
        this.MetaAd(sz, true);

        return this.Prf(size, false) as Uint8Array;
    }

    WitnessBytes(label: Uint8Array, nonceSeeds: Uint8Array, rng: RandomGenerator): Uint8Array
    {
        byte[][] ns = new byte[][] { nonceSeeds };
        return WitnessBytesRng(label, ns, rng);
    }
}