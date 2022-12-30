import * as strobe from "./strobe"
import * as sc from "./signingcontext"

export interface Keypair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export const Sr25519 = {
  sign(message: Uint8Array, keypair: Keypair): Uint8Array {

    let sk = sc.SecretKey.FromBytes095(keypair.secretKey);
    let pk = sc.PublicKey.FromBytes(keypair.publicKey);
    let sigcont = new sc.SigningContext085(Buffer.from("substrate", 'ascii'));
    let st = new sc.SigningTranscript(sigcont);
    sigcont.Bytes(message);
    // signingContext.ts = signingContext.Bytes(message);

    var s = sigcont.sign(st, sk, pk, new sc.RandomGenerator());


    //signature should be 64 bytes length
    return s.ToBytes();
  },
  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    return false;

    // let pk = sc.PublicKey.FromBytes(publicKey);
    // let sigcont = new sc.SigningContext085(Buffer.from("substrate", 'ascii'));
    // let st = new sc.SigningTranscript(sigcont);
    // sigcont.Bytes(message);

    // return sigcont.verify(st, signature, pk);
  },
}
