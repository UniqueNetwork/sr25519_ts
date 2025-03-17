export interface SignerPayloadJSON {
  address: string
  blockHash: string
  blockNumber: string
  era: string
  genesisHash: string
  method: string
  nonce: string
  specVersion: string
  tip: string
  transactionVersion: string
  signedExtensions: string[]
  version: number
}

export interface SignerPayloadRaw {
  data: string
  address: string
  type: 'bytes' | 'payload'
}

export type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum'

export interface UNIQUE_SDK_UnsignedTxPayloadBody {
  signerPayloadJSON: SignerPayloadJSON
  signerPayloadRaw: SignerPayloadRaw
  signerPayloadHex: string
}

export interface UNIQUE_SDK_SignTxResultResponse {
  signature: string
  signatureType: KeypairType
}

export interface IUniqueSdkSigner {
  address?: string
  sign: (unsignedTxPayload: UNIQUE_SDK_UnsignedTxPayloadBody) => Promise<UNIQUE_SDK_SignTxResultResponse>
}
