# Pure Javascript Implementation of sr25519

[![npm version](https://badge.fury.io/js/%40unique-nft%2Fsr25519.svg)](https://badge.fury.io/js/%40unique-nft%2Fsr25519)

This is a pure Javascript implementation of sr25519, which is a main key derivation and signature [algorithm on Polkadot](https://wiki.polkadot.network/docs/learn-cryptography). The sr25519 algorithm based on the Ristretto group and Schnorr signatures). This implementation is actually a partial port of [w3f/schnorrkel](https://github.com/w3f/schnorrkel) to Typescript, and it does not require any additional binaries, Rust libraries, or WASM.

This library provides functions for keypair generation, signature generation and verification, and address encoding and decoding in the Polkadot format. It also supports mnemonic parsing and Polkadot-style hard and soft key derivation.

This library can be used as a tool for generating keypairs and signing transactions for the Polkadot ecosystem and parachains. Additionally, it can serve as a lightweight substitute for the @polkadot-js/keyring and @polkadot-js/util-crypto packages, providing similar functionality without requiring the use of WASM or other heavy dependencies. These libraries provide a lot of useful functionality, but they are also quite large and require the use of WASM, which can be problematic in some environments. Also it requires to be warmed up every time which may bring some another difficulties.

This library is lightweight as possible and includes only some parts of the [@noble/hashes](https://github.com/paulmillr/noble-hashes) library for cryptographic hash functions and the [base-x](https://www.npmjs.com/package/base-x) library for base64.

No WASM, no rust, no any binaries - plain Javascript. With Typescript typings included.

## Features
Here are the main features of this implementation:

##### Key pair generation
The implementation includes functions to generate sr25519 key pairs, including mnemonic parsing and Polkadot-style [hard and soft key derivation](https://wiki.polkadot.network/docs/learn-account-advanced#derivation-paths).

##### Signature generation and verification
The implementation can generate and verify signatures for messages using the sr25519 scheme.

##### Polkadot-format address encoding and decoding
The implementation includes functions for encoding and decoding [Polkadot-format addresses](https://wiki.polkadot.network/docs/learn-account-advanced).

## Usage

```typescript
import {Sr25519Account} from '@unique-nft/sr25519'

const account = Sr25519Account.fromUri('//Alice')
console.log(account.address) // 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

// sign, parameter may be Uint8Array, hex string or a plain string
console.log(account.sign('hello world')) //Uint8Array(64) [142, 143, 161,  13,   5, 154, 144, 125, 160, 247, 255, 182, 128,  53, 182,  98, 190, 132, 167, 230,  68, 189, 88, 155, 206, 154, 192,  36, 242,  76, 152,  43, 112, 28,  57, 190,  89,  44,  80,  30,  55,  54,  18,  61, 132, 130,  35, 202,  86,  53, 153,  43,  13, 168, 237, 248, 104,  93,  95, 151,  98, 201, 146, 136] 

// account has verify method
console.log(account.verify('hello world', account.sign('hello world'))) // true

// also signature can be verified with static method without instantiating an account
console.log(Sr25519Account.verifySignature('hello world', account.sign('hello world'), account.address)) // true

// a new random mnemonic and a new Sr25519Account account can be generated like this
const mnemonic = Sr25519Account.generateMnemonic()
const account2 = Sr25519Account.fromUri(mnemonic)

// also package provides the account Typescript type
import type {ISr25519Account} from '@unique-nft/sr25519'
```

Also this lib provides a ready to use signer for the [Unique SDK](https://www.npmjs.com/package/@unique-nft/sdk):

```typescript
const account = Sr25519Account.fromUri('//Alice')
const sdk = new UniqueSdk.Sdk({
  baseUrl: 'https://rest.unique.network/opal/v1',
  account,
})
```

License: MIT
