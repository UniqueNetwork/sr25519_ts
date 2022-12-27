import * as strobe from "./strobe"
import * as sc from "./signingcontext"

export interface Keypair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export const Sr25519 = {
  sign(message: Uint8Array, keypair: Keypair): Uint8Array {

    // var st = new strobe.Strobe();
    // st.strobe_init("substrate");
    //  var strobe = new Strobe("substrate", 128);

  // var label = Uint8Array.from([112, 114, 111, 116, 111, 45, 110, 97, 109, 101 ]);
  // st.operate(true, strobe.operationMap.get(strobe.Operation.Ad) as strobe.Flag, label, label.length, 0, 0, false);


  //   let message2 = Buffer.from("aaa", 'ascii');
    // // MetaAd(BitConverter.GetBytes(message.Length), true);
    // strobe.Operate(true, StrobeNet.Enums.Operation.Ad, message, 0, false);
    // st.operate(true, strobe.operationMap.get(strobe.Operation.Ad) as strobe.Flag, message2, 0, 0,message2.length, false);


    // var error = st.operate(false, strobe.operationMap.get(strobe.Operation.Ad) as strobe.Flag, message2, 0, 0, message2.length, false);

    // //Ad(message, false);
    // var error = strobe.Operate(false, StrobeNet.Enums.Operation.Ad, message, 0, false);

    // var data = new byte[] { 112, 114, 111, 116, 111, 45, 110, 97, 109, 101 };
    // strobe.Operate(true, StrobeNet.Enums.Operation.Ad, data, 0, false);




    let sk = sc.SecretKey.FromBytes(keypair.secretKey);
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
    return false
  },
}
