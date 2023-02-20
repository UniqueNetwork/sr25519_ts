// default substrate dev phrase
import {mnemonic} from "./mnemonic";

const RE_CAPTURE = /^(\w+( \w+)*)((\/\/?[^/]+)*)(\/\/\/(.*))?$/;

const RE_JUNCTION = /\/(\/?)([^/]+)/g;

type DeriveJunction = {
  isSoft: boolean
  key: string
  chainCode: Uint8Array
}

export interface KeyExtractResult {
  parts: null | string[];
  junctions: DeriveJunction[];
}

export interface ExtractResult {
  derivePath: string
  password?: string
  junctions: DeriveJunction[]
  phrase: string
}

type Keypair = {
  secret: Uint8Array
  public: Uint8Array
}

export const REGEX_HEX_PREFIXED = /^0x[\da-fA-F]+$/;

export const REGEX_HEX_NOPREFIX = /^[\da-fA-F]+$/;

/**
 * @name isHex
 * @summary Tests for a hex string.
 * @description
 * Checks to see if the input value is a `0x` prefixed hex string. Optionally (`bitLength` !== -1) checks to see if the bitLength is correct.
 * @example
 * <BR>
 *
 * ```javascript
 * import { isHex } from '@polkadot/util';
 *
 * isHex('0x1234'); // => true
 * isHex('0x1234', 8); // => false
 * ```
 */
export function isHex (value: unknown, bitLength = -1, ignoreLength?: boolean): value is string {
  return (
    typeof value === 'string' && (
      value === '0x' ||
      REGEX_HEX_PREFIXED.test(value)
    )
  ) && (
    bitLength === -1
      ? (ignoreLength || (value.length % 2 === 0))
      : (value.length === (2 + Math.ceil(bitLength / 4)))
  );
}


/**
 * @description Extract derivation junctions from the supplied path
 */
export function keyExtractPath (derivePath: string): KeyExtractResult {
  const parts = derivePath.match(RE_JUNCTION);
  const junctions: DeriveJunction[] = [];
  let constructed = '';

  if (parts) {
    constructed = parts.join('');

    for (const p of parts) {
      console.log(parts, p)
      // path.push(DeriveJunction.from(p.substring(1)));
    }
  }

  if (constructed !== derivePath) {
    throw new Error(`Re-constructed path "${constructed}" does not match input`);
  }

  return {
    parts,
    junctions,
  };
}

/**
 * @description Extracts the phrase, path and password from a SURI format for specifying secret keys `<secret>/<soft-key>//<hard-key>///<password>` (the `///password` may be omitted, and `/<soft-key>` and `//<hard-key>` maybe repeated and mixed).
 */
export function keyExtractSuri (suri: string): ExtractResult {
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const matches = suri.match(RE_CAPTURE);

  if (matches === null) {
    throw new Error('Unable to match provided value to a secret URI');
  }

  const [, phrase, , derivePath, , , password] = matches as string[];
  const { junctions } = keyExtractPath(derivePath);

  return {
    derivePath,
    password,
    junctions,
    phrase
  };
}

/*

const createFromUri = async (_suri: string) => {
  // here we only aut-add the dev phrase if we have a hard-derived path
  const suri = _suri.startsWith('//')
    ? `${DEV_PHRASE}${_suri}`
    : _suri;
  const { derivePath, password, path, phrase } = keyExtractSuri(suri);
  let seed: Uint8Array;
  const isPhraseHex = isHex(phrase, 256);

  if (isPhraseHex) {
    seed = StringUtils.HexString.toU8a(phrase)
  } else {
    const parts = phrase.split(' ')

    if ([12, 15, 18, 21, 24].includes(parts.length)) {
      seed = await mnemonic(phrase, password);
    } else {
      throw new Error('specified phrase is not a valid mnemonic and is invalid as a raw seed at > 32 bytes');
    }
  }

  const keypair: Keypair = sr25519PairFromSeed(seed), path, type);

  for (const junction of path) {
    result = await keyHdkdSr25519(result, junction);
  }

  // return createPair({ toSS58: this.encodeAddress, type }, derived, meta, null);
}

export async function keyHdkdSr25519 (keypair: Keypair, { chainCode, isSoft }: DeriveJunction): Keypair {
  return isSoft
    ? sr25519DeriveSoft(keypair, chainCode)
    : sr25519DeriveHard(keypair, chainCode);
}
*/
