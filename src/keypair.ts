import {PublicKey, SecretKey} from './signingContext'
import {Scalar} from './scalar'
import {parseUriAndDerive, parseUriAndDeriveAsync} from '../translated/mnemonic/uri'

export class Keypair {
  publicKey: PublicKey
  secretKey: SecretKey

  constructor(publicKey: PublicKey, secretKey: SecretKey) {
    this.publicKey = publicKey
    this.secretKey = secretKey
  }

  static FromBytes(bytes: Uint8Array): Keypair {
    const secretKey = SecretKey.FromBytes(bytes.slice(0, 64))
    const publicKey = PublicKey.FromBytes(bytes.slice(64))
    return new Keypair(publicKey, secretKey)
  }

  static FromSecretKeyBytes(secretKeyBytes: Uint8Array): Keypair {
    if (secretKeyBytes.length !== 64) {
      throw new Error(`Expected secret key with ${64} bytes, found ${secretKeyBytes.length}`)
    }
    const secretKey = SecretKey.FromBytes(secretKeyBytes)
    const publicKey = secretKey.ToPublicKey()
    return new Keypair(publicKey, secretKey)
  }

  static FromUri(uri: string): Keypair {
    return parseUriAndDerive(uri)
  }

  static async FromUriAsync(uri: string): Promise<Keypair> {
    return await parseUriAndDeriveAsync(uri)
  }

  static FromMiniSecret(miniSecret: Uint8Array): Keypair {
    const secretKey = SecretKey.FromMiniSecret(miniSecret)
    const publicKey = secretKey.ToPublicKey()
    return new Keypair(publicKey, secretKey)
  }

  ToBytes(): Uint8Array {
    const bytes = new Uint8Array(96)
    bytes.set(this.secretKey.ToBytes())
    bytes.set(this.publicKey.key, 64)
    return bytes
  }
}
