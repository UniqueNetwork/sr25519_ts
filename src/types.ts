export type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum'

export interface UNIQUE_SDK_UnsignedTxPayloadBody {
  signerPayloadJSON?: any
  signerPayloadRaw?: any
  signerPayloadHex: string
}

export interface UNIQUE_SDK_SignTxResultResponse {
  signature: string
  signatureType: KeypairType
}

export interface IUniqueSdkSigner {
  sign: (unsignedTxPayload: UNIQUE_SDK_UnsignedTxPayloadBody) => Promise<UNIQUE_SDK_SignTxResultResponse>
}
