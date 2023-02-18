/*
rust code:
 fn expand_ed25519(&self) -> SecretKey {
        use sha2::{Sha512, digest::{Input,FixedOutput}};

        let mut h = Sha512::default();
        h.input(self.as_bytes());
        let r = h.fixed_result();

        // We need not clamp in a Schnorr group like Ristretto, but here
        // we do so to improve Ed25519 comparability.
        let mut key = [0u8; 32];
        key.copy_from_slice(&r.as_slice()[0..32]);
        key[0]  &= 248;
        key[31] &=  63;
        key[31] |=  64;
        // We then devide by the cofactor to internally keep a clean
        // representation mod l.
        scalars::divide_scalar_bytes_by_cofactor(&mut key);
        let key = Scalar::from_bits(key);

        let mut nonce = [0u8; 32];
        nonce.copy_from_slice(&r.as_slice()[32..64]);

        SecretKey{ key, nonce }
    }
 */

import {divideScalarBytesByCofactor} from './utils'
import {sha512} from '@noble/hashes/sha512'

const fromBits = (bytes: Uint8Array) => {
  const s = {bytes}
  s.bytes[31] &= 0b0111_1111
  return s
}

export const expandEd25519 = (bytes: Uint8Array) => {
  const r = sha512(bytes)

  const key = r.slice(0, 32)
  key[0] &= 248
  key[31] &= 63
  key[31] |= 64
  divideScalarBytesByCofactor(key)
  const keyScalar = fromBits(key)

  const nonce = r.slice(32, 64)

  return {keyScalar, nonce}
}
