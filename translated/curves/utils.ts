export const divideScalarBytesByCofactor = (scalar: Uint8Array): Uint8Array => {
  let low = 0
  for (let i = 31; i >= 0; i--) {
    const r = scalar[i] & 0b00000111 // save remainder
    scalar[i] = scalar[i] >> 3 // divide by 8
    scalar[i] += low
    low = r << 5
  }
  return scalar
}

export const multiplyScalarBytesByCofactor = (scalar: Uint8Array): Uint8Array => {
  let high = 0
  for (let i = 0; i < 32; i++) {
    const r = scalar[i] & 0b11100000 // carry bits
    scalar[i] = scalar[i] << 3 // multiply by 8
    scalar[i] += high
    high = r >> 5
  }
  return scalar
}
