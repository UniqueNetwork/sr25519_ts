export class Keccak
    {
        static Rc = BigUint64Array.from([
            0x0000000000000001n,
            0x0000000000008082n,
            0x800000000000808An,
            0x8000000080008000n,
            0x000000000000808Bn,
            0x0000000080000001n,
            0x8000000080008081n,
            0x8000000000008009n,
            0x000000000000008An,
            0x0000000000000088n,
            0x0000000080008009n,
            0x000000008000000An,
            0x000000008000808Bn,
            0x800000000000008Bn,
            0x8000000000008089n,
            0x8000000000008003n,
            0x8000000000008002n,
            0x8000000000000080n,
            0x000000000000800An,
            0x800000008000000An,
            0x8000000080008081n,
            0x8000000000008080n,
            0x0000000080000001n,
            0x8000000080008008n,
        ]);

        static U64size = BigInt(2**64);

        static  getUInt64Bytes(x: bigint): Uint8Array {
            return Uint8Array.from([
              Number((x >> 56n) % 256n),
              Number((x >> 48n) % 256n),
              Number((x >> 40n) % 256n),
              Number((x >> 32n) % 256n),
              Number((x >> 24n) % 256n),
              Number((x >> 16n) % 256n),
              Number((x >> 8n) % 256n),
              Number(x % 256n),
            ]);
        }
          
        static   getUInt64FromBytes(x: Uint8Array): BigInt {
            let r: bigint = BigInt(x[0]);
            r += BigInt(x[1]) << 8n;
            r += BigInt(x[2]) << 16n;
            r += BigInt(x[3]) << 24n;
            r += BigInt(x[4]) << 32n;
            r += BigInt(x[5]) << 40n;
            r += BigInt(x[6]) << 48n;
            r += BigInt(x[7]) << 56n;
            return r; 
        }

        static  TransformArray(input: Uint8Array): BigUint64Array
        {
            var result = new BigUint64Array(25);
            for(let s = 0; s < 25 ;s++)
            {
                result[s] = this.getUInt64FromBytes(input.slice(s*8, (s*8)+8));
            }
            return result;
        }

        static  TransformArrayBack(input: BigUint64Array): Uint8Array
        {
            var result = new Uint8Array(200);
            for(let s = 0; s < 25 ;s++)
            {
                let bts = this.getUInt64Bytes(input[s]);
                for(let i = 0; i < 8 ;i++)
                {
                    result[s*8+i] = bts[7-i];
                }
            }
            return result;
        }

        /// <summary>
        /// Perform KeccakF1600 permutation
        /// </summary>
        /// <param name="a">Input array</param>
        /// <param name="nr">Number of rounds</param>
        // KeccakF1600(ref byte[] a, int nr)
        static  KeccakF1600(a: Uint8Array, nr: number): Uint8Array
        {
            let transformed = this.TransformArray(a);
            this.KeccakF1600_64(transformed, nr);
            return this.TransformArrayBack(transformed);

        }

        /// <summary>
        /// Perform KeccakF1600 permutation
        /// </summary>
        /// <param name="a">Input array</param>
        /// <param name="nr">Number of rounds</param>
        // public static void KeccakF1600_32(ref ulong[] a, int nr)
        static  KeccakF1600_64(a: BigUint64Array, nr: number)
        {
            // Implementation translated from Keccak-inplace.c
            // in the keccak reference code.
            let t: bigint, bc0: bigint, bc1: bigint, bc2: bigint, bc3: bigint, bc4: bigint, d0: bigint, d1: bigint, d2: bigint, d3: bigint, d4: bigint;

            for (let i = 0; i < 24; i += 4) {
                if (i + nr >= 24) {
                    // Combines the 5 steps in each round into 2 steps.
                    // Unrolls 4 rounds per loop and spreads some steps across rounds.

                    // Round 1
                    bc0 = (a[0] ^ a[5] ^ a[10] ^ a[15] ^ a[20]) % Keccak.U64size;
                    bc1 = (a[1] ^ a[6] ^ a[11] ^ a[16] ^ a[21]) % Keccak.U64size;
                    bc2 = (a[2] ^ a[7] ^ a[12] ^ a[17] ^ a[22]) % Keccak.U64size;
                    bc3 = (a[3] ^ a[8] ^ a[13] ^ a[18] ^ a[23]) % Keccak.U64size;
                    bc4 = (a[4] ^ a[9] ^ a[14] ^ a[19] ^ a[24]) % Keccak.U64size;

                    d0 = (bc4 ^ (bc1 << 1n | bc1 >> 63n)) % Keccak.U64size;
                    d1 = (bc0 ^ (bc2 << 1n | bc2 >> 63n)) % Keccak.U64size;
                    d2 = (bc1 ^ (bc3 << 1n | bc3 >> 63n)) % Keccak.U64size;
                    d3 = (bc2 ^ (bc4 << 1n | bc4 >> 63n)) % Keccak.U64size;
                    d4 = (bc3 ^ (bc0 << 1n | bc0 >> 63n)) % Keccak.U64size;


                    bc0 = (a[0] ^ d0) % Keccak.U64size;
                    t = (a[6] ^ d1) % Keccak.U64size;
                    bc1 = ((t << 44n) | (t >> (64n - 44n))) % Keccak.U64size;
                    t = (a[12] ^ d2) % Keccak.U64size;
                    bc2 = (t << 43n | t >> (64n - 43n)) % Keccak.U64size;
                    t = (a[18] ^ d3) % Keccak.U64size;
                    bc3 = (t << 21n | t >> (64n - 21n)) % Keccak.U64size;
                    t = (a[24] ^ d4) % Keccak.U64size;
                    bc4 = (t << 14n | t >> (64n - 14n)) % Keccak.U64size;
                    a[0] = (bc0 ^ (bc2 &~ bc1) ^ this.Rc[i]) % Keccak.U64size;
                    a[6] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[12] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[18] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[24] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;


                    t = (a[10] ^ d0) % Keccak.U64size;
                    bc2 = (t << 3n | t >> (64n - 3n)) % Keccak.U64size;
                    t = (a[16] ^ d1) % Keccak.U64size;
                    bc3 = (t << 45n | t >> (64n - 45n)) % Keccak.U64size;
                    t = (a[22] ^ d2) % Keccak.U64size;
                    bc4 = (t << 61n | t >> (64n - 61n)) % Keccak.U64size;
                    t = (a[3] ^ d3) % Keccak.U64size;
                    bc0 = (t << 28n | t >> (64n - 28n)) % Keccak.U64size;
                    t = (a[9] ^ d4) % Keccak.U64size;
                    bc1 = (t << 20n | t >> (64n - 20n)) % Keccak.U64size;
                    a[10] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[16] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[22] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[3] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[9] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;


                    t = (a[20] ^ d0) % Keccak.U64size;
                    bc4 = (t << 18n | t >> (64n - 18n)) % Keccak.U64size;
                    t = (a[1] ^ d1) % Keccak.U64size;
                    bc0 = (t << 1n | t >> (64n - 1n)) % Keccak.U64size;
                    t = (a[7] ^ d2) % Keccak.U64size;
                    bc1 = (t << 6n | t >> (64n - 6n)) % Keccak.U64size;
                    t = (a[13] ^ d3) % Keccak.U64size;
                    bc2 = (t << 25n | t >> (64n - 25n)) % Keccak.U64size;
                    t = (a[19] ^ d4) % Keccak.U64size;
                    bc3 = (t << 8n | t >> (64n - 8n)) % Keccak.U64size;
                    a[20] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[1] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[7] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[13] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[19] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;


                    t = (a[5] ^ d0) % Keccak.U64size;
                    bc1 = (t << 36n | t >> (64n - 36n)) % Keccak.U64size;
                    t = (a[11] ^ d1) % Keccak.U64size;
                    bc2 = (t << 10n | t >> (64n - 10n)) % Keccak.U64size;
                    t = (a[17] ^ d2) % Keccak.U64size;
                    bc3 = (t << 15n | t >> (64n - 15n)) % Keccak.U64size;
                    t = (a[23] ^ d3) % Keccak.U64size;
                    bc4 = (t << 56n | t >> (64n - 56n)) % Keccak.U64size;
                    t = (a[4] ^ d4) % Keccak.U64size;
                    bc0 = (t << 27n | t >> (64n - 27n)) % Keccak.U64size;
                    a[5] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[11] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[17] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[23] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[4] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[15] ^ d0) % Keccak.U64size;
                    bc3 = (t << 41n | t >> (64n - 41n)) % Keccak.U64size;
                    t = (a[21] ^ d1) % Keccak.U64size;
                    bc4 = (t << 2n | t >> (64n - 2n)) % Keccak.U64size;
                    t = (a[2] ^ d2) % Keccak.U64size;
                    bc0 = (t << 62n | t >> (64n - 62n)) % Keccak.U64size;
                    t = (a[8] ^ d3) % Keccak.U64size;
                    bc1 = (t << 55n | t >> (64n - 55n)) % Keccak.U64size;
                    t = (a[14] ^ d4) % Keccak.U64size;
                    bc2 = (t << 39n | t >> (64n - 39n)) % Keccak.U64size;
                    a[15] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[21] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[2] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[8] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[14] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    // Round 2
                    bc0 = (a[0] ^ a[5] ^ a[10] ^ a[15] ^ a[20]) % Keccak.U64size;
                    bc1 = (a[1] ^ a[6] ^ a[11] ^ a[16] ^ a[21]) % Keccak.U64size;
                    bc2 = (a[2] ^ a[7] ^ a[12] ^ a[17] ^ a[22]) % Keccak.U64size;
                    bc3 = (a[3] ^ a[8] ^ a[13] ^ a[18] ^ a[23]) % Keccak.U64size;
                    bc4 = (a[4] ^ a[9] ^ a[14] ^ a[19] ^ a[24]) % Keccak.U64size;
                    d0 = (bc4 ^ (bc1 << 1n | bc1 >> 63n)) % Keccak.U64size;
                    d1 = (bc0 ^ (bc2 << 1n | bc2 >> 63n)) % Keccak.U64size;
                    d2 = (bc1 ^ (bc3 << 1n | bc3 >> 63n)) % Keccak.U64size;
                    d3 = (bc2 ^ (bc4 << 1n | bc4 >> 63n)) % Keccak.U64size;
                    d4 = (bc3 ^ (bc0 << 1n | bc0 >> 63n)) % Keccak.U64size;

                    bc0 = (a[0] ^ d0) % Keccak.U64size;
                    t = (a[16] ^ d1) % Keccak.U64size;
                    bc1 = (t << 44n | t >> (64n - 44n)) % Keccak.U64size;
                    t = (a[7] ^ d2) % Keccak.U64size;
                    bc2 = (t << 43n | t >> (64n - 43n)) % Keccak.U64size;
                    t = (a[23] ^ d3) % Keccak.U64size;
                    bc3 = (t << 21n | t >> (64n - 21n)) % Keccak.U64size;
                    t = (a[14] ^ d4) % Keccak.U64size;
                    bc4 = (t << 14n | t >> (64n - 14n)) % Keccak.U64size;
                    a[0] = (bc0 ^ (bc2 &~ bc1) ^ this.Rc[i + 1]) % Keccak.U64size;
                    a[16] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[7] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[23] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[14] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[20] ^ d0) % Keccak.U64size;
                    bc2 = (t << 3n | t >> (64n - 3n)) % Keccak.U64size;
                    t = (a[11] ^ d1) % Keccak.U64size;
                    bc3 = (t << 45n | t >> (64n - 45n)) % Keccak.U64size;
                    t = (a[2] ^ d2) % Keccak.U64size;
                    bc4 = (t << 61n | t >> (64n - 61n)) % Keccak.U64size;
                    t = (a[18] ^ d3) % Keccak.U64size;
                    bc0 = (t << 28n | t >> (64n - 28n)) % Keccak.U64size;
                    t = (a[9] ^ d4) % Keccak.U64size;
                    bc1 = (t << 20n | t >> (64n - 20n)) % Keccak.U64size;
                    a[20] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[11] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[2] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[18] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[9] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[15] ^ d0) % Keccak.U64size;
                    bc4 = (t << 18n | t >> (64n - 18n)) % Keccak.U64size;
                    t = (a[6] ^ d1) % Keccak.U64size;
                    bc0 = (t << 1n | t >> (64n - 1n)) % Keccak.U64size;
                    t = (a[22] ^ d2) % Keccak.U64size;
                    bc1 = (t << 6n | t >> (64n - 6n)) % Keccak.U64size;
                    t = (a[13] ^ d3) % Keccak.U64size;
                    bc2 = (t << 25n | t >> (64n - 25n)) % Keccak.U64size;
                    t = (a[4] ^ d4) % Keccak.U64size;
                    bc3 = (t << 8n | t >> (64n - 8n)) % Keccak.U64size;
                    a[15] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[6] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[22] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[13] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[4] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[10] ^ d0) % Keccak.U64size;
                    bc1 = (t << 36n | t >> (64n - 36n)) % Keccak.U64size;
                    t = (a[1] ^ d1) % Keccak.U64size;
                    bc2 = (t << 10n | t >> (64n - 10n)) % Keccak.U64size;
                    t = (a[17] ^ d2) % Keccak.U64size;
                    bc3 = (t << 15n | t >> (64n - 15n)) % Keccak.U64size;
                    t = (a[8] ^ d3) % Keccak.U64size;
                    bc4 = (t << 56n | t >> (64n - 56n)) % Keccak.U64size;
                    t = (a[24] ^ d4) % Keccak.U64size;
                    bc0 = (t << 27n | t >> (64n - 27n)) % Keccak.U64size;
                    a[10] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[1] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[17] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[8] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[24] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[5] ^ d0) % Keccak.U64size;
                    bc3 = (t << 41n | t >> (64n - 41n)) % Keccak.U64size;
                    t = (a[21] ^ d1) % Keccak.U64size;
                    bc4 = (t << 2n | t >> (64n - 2n)) % Keccak.U64size;
                    t = (a[12] ^ d2) % Keccak.U64size;
                    bc0 = (t << 62n | t >> (64n - 62n)) % Keccak.U64size;
                    t = (a[3] ^ d3) % Keccak.U64size;
                    bc1 = (t << 55n | t >> (64n - 55n)) % Keccak.U64size;
                    t = (a[19] ^ d4) % Keccak.U64size;
                    bc2 = (t << 39n | t >> (64n - 39n)) % Keccak.U64size;
                    a[5] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[21] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[12] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[3] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[19] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    // Round 3
                    bc0 = (a[0] ^ a[5] ^ a[10] ^ a[15] ^ a[20]) % Keccak.U64size;
                    bc1 = (a[1] ^ a[6] ^ a[11] ^ a[16] ^ a[21]) % Keccak.U64size;
                    bc2 = (a[2] ^ a[7] ^ a[12] ^ a[17] ^ a[22]) % Keccak.U64size;
                    bc3 = (a[3] ^ a[8] ^ a[13] ^ a[18] ^ a[23]) % Keccak.U64size;
                    bc4 = (a[4] ^ a[9] ^ a[14] ^ a[19] ^ a[24]) % Keccak.U64size;

                    d0 = (bc4 ^ (bc1 << 1n | bc1 >> 63n)) % Keccak.U64size;
                    d1 = (bc0 ^ (bc2 << 1n | bc2 >> 63n)) % Keccak.U64size;
                    d2 = (bc1 ^ (bc3 << 1n | bc3 >> 63n)) % Keccak.U64size;
                    d3 = (bc2 ^ (bc4 << 1n | bc4 >> 63n)) % Keccak.U64size;
                    d4 = (bc3 ^ (bc0 << 1n | bc0 >> 63n)) % Keccak.U64size;

                    bc0 = (a[0] ^ d0) % Keccak.U64size;
                    t = (a[11] ^ d1) % Keccak.U64size;
                    bc1 = (t << 44n | t >> (64n - 44n)) % Keccak.U64size;
                    t = (a[22] ^ d2) % Keccak.U64size;
                    bc2 = (t << 43n | t >> (64n - 43n)) % Keccak.U64size;
                    t = (a[8] ^ d3) % Keccak.U64size;
                    bc3 = (t << 21n | t >> (64n - 21n)) % Keccak.U64size;
                    t = (a[19] ^ d4) % Keccak.U64size;
                    bc4 = (t << 14n | t >> (64n - 14n)) % Keccak.U64size;
                    a[0] = (bc0 ^ (bc2 &~ bc1) ^ this.Rc[i + 2]) % Keccak.U64size;
                    a[11] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[22] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[8] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[19] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[15] ^ d0) % Keccak.U64size;
                    bc2 = (t << 3n | t >> (64n - 3n)) % Keccak.U64size;
                    t = (a[1] ^ d1) % Keccak.U64size;
                    bc3 = (t << 45n | t >> (64n - 45n)) % Keccak.U64size;
                    t = (a[12] ^ d2) % Keccak.U64size;
                    bc4 = (t << 61n | t >> (64n - 61n)) % Keccak.U64size;
                    t = (a[23] ^ d3) % Keccak.U64size;
                    bc0 = (t << 28n | t >> (64n - 28n)) % Keccak.U64size;
                    t = (a[9] ^ d4) % Keccak.U64size;
                    bc1 = (t << 20n | t >> (64n - 20n)) % Keccak.U64size;
                    a[15] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[1] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[12] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[23] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[9] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[5] ^ d0) % Keccak.U64size;
                    bc4 = (t << 18n | t >> (64n - 18n)) % Keccak.U64size;
                    t = (a[16] ^ d1) % Keccak.U64size;
                    bc0 = (t << 1n | t >> (64n - 1n)) % Keccak.U64size;
                    t = (a[2] ^ d2) % Keccak.U64size;
                    bc1 = (t << 6n | t >> (64n - 6n)) % Keccak.U64size;
                    t = (a[13] ^ d3) % Keccak.U64size;
                    bc2 = (t << 25n | t >> (64n - 25n)) % Keccak.U64size;
                    t = (a[24] ^ d4) % Keccak.U64size;
                    bc3 = (t << 8n | t >> (64n - 8n)) % Keccak.U64size;
                    a[5] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[16] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[2] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[13] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[24] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[20] ^ d0) % Keccak.U64size;
                    bc1 = (t << 36n | t >> (64n - 36n)) % Keccak.U64size;
                    t = (a[6] ^ d1) % Keccak.U64size;
                    bc2 = (t << 10n | t >> (64n - 10n)) % Keccak.U64size;
                    t = (a[17] ^ d2) % Keccak.U64size;
                    bc3 = (t << 15n | t >> (64n - 15n)) % Keccak.U64size;
                    t = (a[3] ^ d3) % Keccak.U64size;
                    bc4 = (t << 56n | t >> (64n - 56n)) % Keccak.U64size;
                    t = (a[14] ^ d4) % Keccak.U64size;
                    bc0 = (t << 27n | t >> (64n - 27n)) % Keccak.U64size;
                    a[20] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[6] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[17] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[3] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[14] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[10] ^ d0) % Keccak.U64size;
                    bc3 = (t << 41n | t >> (64n - 41n)) % Keccak.U64size;
                    t = (a[21] ^ d1) % Keccak.U64size;
                    bc4 = (t << 2n | t >> (64n - 2n)) % Keccak.U64size;
                    t = (a[7] ^ d2) % Keccak.U64size;
                    bc0 = (t << 62n | t >> (64n - 62n)) % Keccak.U64size;
                    t = (a[18] ^ d3) % Keccak.U64size;
                    bc1 = (t << 55n | t >> (64n - 55n)) % Keccak.U64size;
                    t = (a[4] ^ d4) % Keccak.U64size;
                    bc2 = (t << 39n | t >> (64n - 39n)) % Keccak.U64size;
                    a[10] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[21] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[7] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[18] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[4] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    // Round 4
                    bc0 = (a[0] ^ a[5] ^ a[10] ^ a[15] ^ a[20]) % Keccak.U64size;
                    bc1 = (a[1] ^ a[6] ^ a[11] ^ a[16] ^ a[21]) % Keccak.U64size;
                    bc2 = (a[2] ^ a[7] ^ a[12] ^ a[17] ^ a[22]) % Keccak.U64size;
                    bc3 = (a[3] ^ a[8] ^ a[13] ^ a[18] ^ a[23]) % Keccak.U64size;
                    bc4 = (a[4] ^ a[9] ^ a[14] ^ a[19] ^ a[24]) % Keccak.U64size;
                    d0 = (bc4 ^ (bc1 << 1n | bc1 >> 63n)) % Keccak.U64size;
                    d1 = (bc0 ^ (bc2 << 1n | bc2 >> 63n)) % Keccak.U64size;
                    d2 = (bc1 ^ (bc3 << 1n | bc3 >> 63n)) % Keccak.U64size;
                    d3 = (bc2 ^ (bc4 << 1n | bc4 >> 63n)) % Keccak.U64size;
                    d4 = (bc3 ^ (bc0 << 1n | bc0 >> 63n)) % Keccak.U64size;
                    
                    bc0 = (a[0] ^ d0) % Keccak.U64size;
                    t = (a[1] ^ d1) % Keccak.U64size;
                    bc1 = (t << 44n | t >> (64n - 44n)) % Keccak.U64size;
                    t = (a[2] ^ d2) % Keccak.U64size;
                    bc2 = (t << 43n | t >> (64n - 43n)) % Keccak.U64size;
                    t = (a[3] ^ d3) % Keccak.U64size;
                    bc3 = (t << 21n | t >> (64n - 21n)) % Keccak.U64size;
                    t = (a[4] ^ d4) % Keccak.U64size;
                    bc4 = (t << 14n | t >> (64n - 14n)) % Keccak.U64size;
                    a[0] = (bc0 ^ (bc2 &~ bc1) ^ this.Rc[i + 3]) % Keccak.U64size;
                    a[1] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[2] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[3] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[4] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[5] ^ d0) % Keccak.U64size;
                    bc2 = (t << 3n | t >> (64n - 3n)) % Keccak.U64size;
                    t = (a[6] ^ d1) % Keccak.U64size;
                    bc3 = (t << 45n | t >> (64n - 45n)) % Keccak.U64size;
                    t = (a[7] ^ d2) % Keccak.U64size;
                    bc4 = (t << 61n | t >> (64n - 61n)) % Keccak.U64size;
                    t = (a[8] ^ d3) % Keccak.U64size;
                    bc0 = (t << 28n | t >> (64n - 28n)) % Keccak.U64size;
                    t = (a[9] ^ d4) % Keccak.U64size;
                    bc1 = (t << 20n | t >> (64n - 20n)) % Keccak.U64size;
                    a[5] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[6] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[7] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[8] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[9] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[10] ^ d0) % Keccak.U64size;
                    bc4 = (t << 18n | t >> (64n - 18n)) % Keccak.U64size;
                    t = (a[11] ^ d1) % Keccak.U64size;
                    bc0 = (t << 1n | t >> (64n - 1n)) % Keccak.U64size;
                    t = (a[12] ^ d2) % Keccak.U64size;
                    bc1 = (t << 6n | t >> (64n - 6n)) % Keccak.U64size;
                    t = (a[13] ^ d3) % Keccak.U64size;
                    bc2 = (t << 25n | t >> (64n - 25n)) % Keccak.U64size;
                    t = (a[14] ^ d4) % Keccak.U64size;
                    bc3 = (t << 8n | t >> (64n - 8n)) % Keccak.U64size;
                    a[10] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[11] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[12] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[13] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[14] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[15] ^ d0) % Keccak.U64size;
                    bc1 = (t << 36n | t >> (64n - 36n)) % Keccak.U64size;
                    t = (a[16] ^ d1) % Keccak.U64size;
                    bc2 = (t << 10n | t >> (64n - 10n)) % Keccak.U64size;
                    t = (a[17] ^ d2) % Keccak.U64size;
                    bc3 = (t << 15n | t >> (64n - 15n)) % Keccak.U64size;
                    t = (a[18] ^ d3) % Keccak.U64size;
                    bc4 = (t << 56n | t >> (64n - 56n)) % Keccak.U64size;
                    t = (a[19] ^ d4) % Keccak.U64size;
                    bc0 = (t << 27n | t >> (64n - 27n)) % Keccak.U64size;
                    a[15] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[16] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[17] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[18] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[19] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;

                    t = (a[20] ^ d0) % Keccak.U64size;
                    bc3 = (t << 41n | t >> (64n - 41n)) % Keccak.U64size;
                    t = (a[21] ^ d1) % Keccak.U64size;
                    bc4 = (t << 2n | t >> (64n - 2n)) % Keccak.U64size;
                    t = (a[22] ^ d2) % Keccak.U64size;
                    bc0 = (t << 62n | t >> (64n - 62n)) % Keccak.U64size;
                    t = (a[23] ^ d3) % Keccak.U64size;
                    bc1 = (t << 55n | t >> (64n - 55n)) % Keccak.U64size;
                    t = (a[24] ^ d4) % Keccak.U64size;
                    bc2 = (t << 39n | t >> (64n - 39n)) % Keccak.U64size;
                    a[20] = (bc0 ^ (bc2 &~ bc1)) % Keccak.U64size;
                    a[21] = (bc1 ^ (bc3 &~ bc2)) % Keccak.U64size;
                    a[22] = (bc2 ^ (bc4 &~ bc3)) % Keccak.U64size;
                    a[23] = (bc3 ^ (bc0 &~ bc4)) % Keccak.U64size;
                    a[24] = (bc4 ^ (bc1 &~ bc0)) % Keccak.U64size;
                }
            }

            //return a;
        }
    }
