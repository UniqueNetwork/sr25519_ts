export const b = (tmpl: TemplateStringsArray, ...values: any[]): Uint8Array => {
  return new TextEncoder().encode(String.raw(tmpl, ...values))
}
