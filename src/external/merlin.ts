import {Strobe, Operation, operationToFlagMap} from './strobe'
import {RandomGenerator} from '../signingContext'

const textEncoder = new TextEncoder()

export function getBytesU32(num: number): Uint8Array {
  const r = new Uint8Array(4)
  r[0] = num % 256
  r[1] = num << 8 % 256
  r[2] = num << 16 % 256
  r[3] = num << 24 % 256
  return r
}

class TranscriptRngBuilder {
  strobe: Transcript

  constructor(strobe: Transcript) {
    this.strobe = strobe
  }

  RekeyWithWitnessBytes(
    label: Uint8Array,
    witness: Uint8Array,
  ): TranscriptRngBuilder {
    this.strobe.MetaAd(label, false)
    this.strobe.MetaAd(getBytesU32(witness.length), true)
    this.strobe.Key(witness, false)

    return this
  }

  Finalize(rng: RandomGenerator): Transcript {
    // TranscriptRngBuilder
    const bytes = rng.GetRandomArrayU8_32()

    const newStrobe = this.strobe.Clone()
    newStrobe.MetaAd(textEncoder.encode('rng'), false)
    newStrobe.Key(bytes, false)

    return newStrobe
  }
}

export class Transcript {
  obj: Strobe
  MERLIN_PROTOCOL_LABEL = 'Merlin v1.0'

  Init(label: string) {
    // strobe_init();
    this.obj = new Strobe()
    this.obj.strobe_init(this.MERLIN_PROTOCOL_LABEL)

    this.AppendMessage(
      textEncoder.encode('dom-sep'),
      textEncoder.encode(label),
    )
  }

  GetStrobe(): Strobe {
    return this.obj.clone()
  }

  Clone(): Transcript {
    const c = new Transcript()
    c.obj = this.obj.clone()
    return c
  }

  AppendMessage(label: Uint8Array, message: Uint8Array) {
    this.MetaAd(label, false)
    this.MetaAd(getBytesU32(message.length), true)
    this.Ad(message, false)
  }

  MetaAd(data: Uint8Array, more: boolean) {
    const error = this.obj.operate(
      true,
      operationToFlagMap[Operation.Ad],
      data,
      0,
      data.length,
      0,
      more,
    )
    if (error !== null) {
      // throw new ApplicationException($"{error}");
    }
  }

  Ad(data: Uint8Array, more: boolean) {
    const error = this.obj.operate(
      false,
      operationToFlagMap[Operation.Ad],
      data,
      0,
      data.length,
      0,
      more,
    )
    if (error !== null) {
      // throw new ApplicationException($"{error}");
    }
  }

  Prf(expectedOutput: number, more: boolean): Uint8Array {
    const ed = new Uint8Array(0)
    const result = this.obj.operate(
      false,
      operationToFlagMap[Operation.Prf],
      ed,
      0,
      0,
      expectedOutput,
      more,
    )
    if (result === null) {
      throw new Error('Error in Prf: result is null')
    }

    return result
  }

  Key(data: Uint8Array, more: boolean) {
    const error = this.obj.operate(
      false,
      operationToFlagMap[Operation.Key],
      data,
      0,
      data.length,
      0,
      more,
    )
    if (error !== null) {
      // throw new Exception($"{error}");
    }
  }

  AppendU64(label: Uint8Array, message: Uint8Array) {
    this.AppendMessage(label, message)
  }

  ChallengeBytes(label: Uint8Array, size: number): Uint8Array {
    const sz = getBytesU32(size)
    this.MetaAd(label, false)
    this.MetaAd(sz, true)

    return this.Prf(size, false)
  }

  WitnessBytes(
    label: Uint8Array,
    nonceSeeds: Uint8Array,
    rng: RandomGenerator,
  ): Transcript {
    const ns = new Array<Uint8Array>(1)
    ns[0] = nonceSeeds
    return this.WitnessBytesRngL(label, ns, rng)
  }

  WitnessBytesRngL(
    label: Uint8Array,
    nonce_seeds: Uint8Array[],
    rng: RandomGenerator,
  ): Transcript {
    let br = this.BuildRng()
    nonce_seeds.forEach((ns) => {
      br = br.RekeyWithWitnessBytes(label, ns)
    })

    return br.Finalize(rng)
  }

  WitnessBytesHdkd(
    label: Uint8Array, dest_len: number, nonce_seeds: Uint8Array[],
  ): Uint8Array {
    const dest = new Uint8Array(dest_len)

    let br = this.BuildRng()
    for (const ns of nonce_seeds) {
      br = br.RekeyWithWitnessBytes(label, ns)
    }
    const r = br.Finalize(new RandomGenerator())
    r.FillBytes(dest)

    return dest
  }

  BuildRng(): TranscriptRngBuilder {
    return new TranscriptRngBuilder(this.Clone())
  }

  FillBytes(dest: Uint8Array) {
    const data_len = getBytesU32(dest.length)
    this.MetaAd(data_len, false)
    this.Prf(dest.length, false)
  }
}
