export const b = (tmpl: TemplateStringsArray, ...values: any[]): Uint8Array => {
  const str = String.raw(tmpl, ...values)

  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i)
  }
  return arr
}
