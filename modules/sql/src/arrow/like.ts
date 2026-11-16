// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Compiles SQL wildcards once and matches Arrow UTF-8 ranges without decoding rows. */
export function compileUTF8Like(pattern: string, insensitive: boolean, escape?: string) {
  if (escape !== undefined && [...escape].length !== 1) {
    throw new Error('LIKE ESCAPE requires one character');
  }
  const tokens: (string | number)[] = [];
  let escaped = false;
  for (const character of pattern) {
    if (!escaped && character === escape) {
      escaped = true;
      continue;
    }
    tokens.push(
      !escaped && character === '%'
        ? -1
        : !escaped && character === '_'
          ? -2
          : fold(character.codePointAt(0)!, insensitive)
    );
    escaped = false;
  }
  if (escaped) throw new Error('LIKE pattern ends with ESCAPE');

  return (bytes: Uint8Array, start: number, end: number): boolean => {
    let offset = start;
    let token = 0;
    let wildcard = -1;
    let retry = start;
    while (offset < end) {
      if (tokens[token] === -1) {
        wildcard = token++;
        retry = offset;
        continue;
      }
      const [point, next] = readCodePoint(bytes, offset);
      if (tokens[token] === -2 || tokens[token] === fold(point, insensitive)) {
        token++;
        offset = next;
      } else if (wildcard >= 0) {
        retry = readCodePoint(bytes, retry)[1];
        offset = retry;
        token = wildcard + 1;
      } else {
        return false;
      }
    }
    while (tokens[token] === -1) token++;
    return token === tokens.length;
  };
}

/** Folds ASCII directly, using locale-independent Unicode lowercase for other characters. */
function fold(point: number, insensitive: boolean): number | string {
  if (!insensitive) return point;
  if (point < 128) return point >= 65 && point <= 90 ? point + 32 : point;
  const folded = String.fromCodePoint(point).toLowerCase();
  return folded.length === 1 && folded.charCodeAt(0) < 128 ? folded.charCodeAt(0) : folded;
}

/** Reads one code point from valid Arrow UTF-8 and returns its next byte offset. */
function readCodePoint(bytes: Uint8Array, offset: number): [number, number] {
  const first = bytes[offset++]!;
  if (first < 128) return [first, offset];
  const count = first < 224 ? 1 : first < 240 ? 2 : 3;
  let point = first & (count === 1 ? 31 : count === 2 ? 15 : 7);
  for (let index = 0; index < count; index++) point = (point << 6) | (bytes[offset++]! & 63);
  return [point, offset];
}
