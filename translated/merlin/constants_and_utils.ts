export const stringToUint8Array = (str: string): Uint8Array => {
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i)
  }
  return arr
}

export const MERLIN_PROTOCOL_LABEL = stringToUint8Array('Merlin v1.0')
