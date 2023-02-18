import {describe, expect, test} from 'vitest'
import {expandEd25519} from './keys'


const miniSecret = Uint8Array.from([105, 235, 55, 249, 142, 185, 103, 97, 97, 104, 76, 250, 145, 84, 75, 168, 144, 128, 238, 87, 141, 15, 138, 11, 235, 152, 24, 104, 218, 160, 36, 213])


const bytesAfterExpansionEd25519 = Uint8Array.from([30, 120, 176, 79, 67, 254, 41, 88, 121, 198, 7, 156, 78, 186, 158, 13, 126, 139, 108, 58, 10, 172, 69, 14, 70, 220, 122, 164, 97, 221, 119, 10])
const nonceAfterExpansionEd25519 = Uint8Array.from([29, 191, 186, 31, 159, 142, 55, 180, 204, 87, 138, 111, 225, 163, 66, 24, 106, 80, 11, 149, 214, 75, 157, 103, 190, 40, 72, 79, 0, 63, 163, 0])
describe('keys', () => {
  test('should work', () => {
    const expanded = expandEd25519(miniSecret)
    expect(expanded.keyScalar.bytes).toEqual(bytesAfterExpansionEd25519)
    expect(expanded.nonce).toEqual(nonceAfterExpansionEd25519)

    console.log(expanded)
  })
})
