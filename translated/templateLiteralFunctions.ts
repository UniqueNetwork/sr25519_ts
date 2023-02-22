/**
 Converts a string to a Uint8Array
 @example b`hello world` // Uint8Array(11) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]
 */
export const b = (tmpl: TemplateStringsArray, ...values: any[]): Uint8Array => {
  return new TextEncoder().encode(String.raw(tmpl, ...values))
}

/**
 * Converts a hex string to a Uint8Array
 * @example hex`0x01020304` // Uint8Array(4) [1, 2, 3, 4]
 * @example hex`01020304`   // Uint8Array(4) [1, 2, 3, 4]
 */
export const hex = (tmpl: TemplateStringsArray, ...values: any[]): Uint8Array => {
  let str = String.raw(tmpl, ...values)
  if (str.startsWith('0x')) {
    str = str.slice(2)
  }
  if (!str.match(/^[0-9a-fA-F]+$/)) {
    throw new Error(`Invalid hex string: ${str}`)
  }
  return new Uint8Array((str.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)))
}
