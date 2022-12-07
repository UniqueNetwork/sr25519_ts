export interface Keypair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export const Sr25519 = {
  sign(message: Uint8Array, keypair: Keypair): Uint8Array {
    //signature should be 64 bytes length
    return Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  },
  verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    return false
  },
}
