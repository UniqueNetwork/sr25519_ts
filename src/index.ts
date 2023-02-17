import * as sc from "./signingContext"

export interface Keypair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export const Sr25519 = {
  sign(message: Uint8Array, keypair: Keypair): Uint8Array {
    const secretKey = sc.SecretKey.FromBytes095(keypair.secretKey)
    const publicKey = sc.PublicKey.FromBytes(keypair.publicKey)

    const signingContext = new sc.SigningContext085(
      Buffer.from("substrate", "ascii")
    )

    const signingTranscript = new sc.SigningTranscript(signingContext)

    signingContext.Bytes(message)

    const signature = signingContext.sign(
      signingTranscript,
      secretKey,
      publicKey,
      new sc.RandomGenerator()
    )

    // signature should be 64 bytes length
    return signature.ToBytes()
  },
  verify(
    message: Uint8Array,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): boolean {
    // return false

    let contextPublicKey = sc.PublicKey.FromBytes(publicKey)

    let signingContext = new sc.SigningContext085(
      Buffer.from("substrate", "ascii")
    )

    let signingTranscript = new sc.SigningTranscript(signingContext)

    signingContext.Bytes(message)

    return signingContext.verify(signingTranscript, signature, contextPublicKey)
  },
}
