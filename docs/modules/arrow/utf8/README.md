# UTF-8 utilities

`@math.gl/arrow/utf8` helps applications work efficiently with binary UTF-8 strings
without materializing JavaScript strings.

- **String comparison:** Compares UTF-8 strings as byte ranges.
- **Scalar parsing:** Parses UTF-8 strings into scalar values such as integers, floating-point numbers, big integers, and booleans.

Use it with typed arrays, Arrow `Utf8` and `Dictionary<Utf8>` buffers, or other UTF-8 storage.

The `@math.gl/arrow/utf8` subpath has no runtime dependencies; Apache Arrow is not required.

## Usage

```typescript
import {parseUTF8Number} from '@math.gl/arrow/utf8';

const bytes = new TextEncoder().encode('12.5');
parseUTF8Number(bytes, 0, bytes.length); // 12.5
```

<details>
<summary>Dictionary&lt;Utf8&gt;: parse a dictionary value without decoding it</summary>

```typescript
import * as arrow from 'apache-arrow';
import {parseUTF8Number} from '@math.gl/arrow/utf8';

const column = arrow.vectorFromArray(
  ['12.5', '7', '12.5'],
  new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8())
);
const indices = column.data[0]!;
const dictionary = indices.dictionary!.data[0]!;
const dictionaryIndex = indices.values[0]!;
const firstByte = dictionary.valueOffsets[dictionaryIndex]!;
const endByte = dictionary.valueOffsets[dictionaryIndex + 1]!;
parseUTF8Number(dictionary.values, firstByte, endByte); // 12.5
```

This small fixture has one index chunk and one dictionary chunk. Dictionary indices
are lookup keys, not lexical order; compare the resolved byte ranges with `compareUTF8`.
For nulls or multiple chunks, apply the validity and chunk-selection rules below to
both the index vector and its dictionary.

</details>

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| UTF-8 string comparison | ✅ | Compare byte ranges without creating JavaScript strings. |
| Scalar parsing | ✅ | Integers, floats, big integers, and booleans using documented ASCII syntax. |
| Typed-array subviews | ✅ | Byte offsets are relative to the supplied view; inputs are unchanged. |
| Arrow `Utf8` and `Dictionary<Utf8>` buffers | ✅ | Read resolved byte ranges directly; the UTF-8 helpers do not require Apache Arrow. |
| Locale-aware collation and Unicode normalization | ❌ | Comparison uses unsigned byte order. |

## Functions

### compareUTF8

```typescript
compareUTF8(bytes1, firstByte1, endByte1, bytes2, firstByte2, endByte2): -1 | 0 | 1
```

Compares the ranges lexicographically using unsigned byte order.

| Parameter | Type | Description |
| --- | --- | --- |
| `bytes1`, `bytes2` | `Uint8Array` | Buffers containing the ranges. They may be the same array. |
| `firstByte1`, `firstByte2` | `number` | Inclusive start offsets in the corresponding arrays. |
| `endByte1`, `endByte2` | `number` | Exclusive end offsets in the corresponding arrays. |

Returns:

- `-1` when the first range sorts before the second.
- `0` for identical bytes.
- `1` when it sorts after the second.

A prefix sorts before its longer match; empty ranges compare equal.

Comparison does not decode or validate UTF-8, normalize Unicode, or apply locale
collation. Byte order for well-formed UTF-8 follows Unicode scalar-value order,
which can differ from JavaScript UTF-16 string ordering.

**Scalar parser parameters**

All three parsers accept the same parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `bytes` | `Uint8Array` | Buffer containing the value. |
| `firstByte` | `number` | Inclusive start byte offset. |
| `endByte` | `number` | Exclusive end byte offset. |

They trim surrounding ASCII space, tab, line feed, vertical tab, form feed, and
carriage return. Unicode whitespace is not trimmed. Parsing consumes the entire
trimmed range: empty ranges, trailing junk, and invalid syntax return `undefined`.
Their accepted grammars are ASCII-only; they do not validate UTF-8 well-formedness.

### parseUTF8Number

```typescript
parseUTF8Number(bytes, firstByte, endByte): number | undefined
```

Parses decimal numbers with an optional `+` or `-` sign, an optional decimal point,
and an optional `e` or `E` exponent with its own optional sign. At least one digit
is required in the mantissa and, when present, in the exponent. For example,
`-42`, `+.25`, `1.`, and `3.5e2` are accepted. Negative zero is preserved.

Rejects hexadecimal, literal `Infinity` and `NaN`, separators such as `1,000`,
non-ASCII digits, and incomplete exponents such as `1e+`.

This parser accumulates the mantissa and applies a decimal scale using JavaScript
number arithmetic. It is not a correctly rounded replacement for `Number()`:
long mantissas can lose precision, and intermediate overflow or underflow can
occur for extreme inputs even when the final mathematical value is representable.
Use `parseUTF8BigInt` for exact base-10 integers.

### parseUTF8BigInt

```typescript
parseUTF8BigInt(bytes, firstByte, endByte): bigint | undefined
```

Parses base-10 integers with an optional `+` or `-` sign. Digits are accumulated as
`bigint`, preserving integers beyond the safe JavaScript number range. Decimal
points, exponents, hexadecimal prefixes, and separators are not accepted.

### parseUTF8Boolean

```typescript
parseUTF8Boolean(bytes, firstByte, endByte): boolean | undefined
```

Parses case-insensitive `true` and `false`. Other values, including `0`, `1`,
`yes`, and prefixes such as `trues`, return `undefined`.

## Arrow string buffers

The helpers accept UTF-8 byte ranges from Arrow storage. Apache Arrow is needed
only by the calling application. A small application helper can handle nullable
`Utf8` and `LargeUtf8` chunks:

```typescript
import * as arrow from 'apache-arrow';
import {parseUTF8Number} from '@math.gl/arrow/utf8';

/** Reads one local row without decoding its UTF-8 bytes. */
function parseRow(data: arrow.Data<arrow.Utf8 | arrow.LargeUtf8>, rowIndex: number) {
  if (!data.getValid(rowIndex)) return null;
  const firstByte = Number(data.valueOffsets[rowIndex]!);
  const endByte = Number(data.valueOffsets[rowIndex + 1]!);
  if (!Number.isSafeInteger(firstByte) || !Number.isSafeInteger(endByte)) {
    throw new RangeError('UTF-8 offsets exceed the safe integer range.');
  }
  return parseUTF8Number(data.values, firstByte, endByte);
}
```

The examples below use `parseRow` with an Arrow string `vector` and a valid logical
`rowIndex`. Byte offsets always address the supplied values array, not its backing
`ArrayBuffer`.

<details>
<summary>Chunked vectors</summary>

Locate the containing chunk, then use its local row index:

```typescript
let localIndex = rowIndex;
for (const chunk of vector.data) {
  if (localIndex < chunk.length) {
    const value = parseRow(chunk, localIndex);
    break;
  }
  localIndex -= chunk.length;
}
```

</details>

<details>
<summary>Sliced data</summary>

Arrow adjusts physical offset views when slicing; do not add the slice offset again:

```typescript
const sliced = vector.slice(1, 3);
const value = parseRow(sliced.data[0]!, 0); // First row of the slice's first chunk.
```

</details>

<details>
<summary>Nullable values</summary>

Check validity before reading bytes. A null is distinct from an empty string or invalid number:

```typescript
const value = parseRow(vector.data[0]!, 0);
// null for an Arrow null; undefined for an empty string or invalid numeric syntax.
```

</details>

<details>
<summary>LargeUtf8 offsets</summary>

`LargeUtf8` uses bigint offsets. The helper converts them only when safely representable:

```typescript
const large = arrow.vectorFromArray(['12.5'], new arrow.LargeUtf8());
const value = parseRow(large.data[0]!, 0); // 12.5
```

</details>

<details>
<summary>Utf8View storage</summary>

`Utf8View` uses view records rather than ordinary string offsets, so `parseRow`
does not accept it. One explicit compatibility option is to normalize storage first;
this materializes JavaScript strings and copies data:

```typescript
const normalized = arrow.vectorFromArray(Array.from(viewVector), new arrow.Utf8());
const value = parseRow(normalized.data[0]!, 0);
```

For hot paths, retain Utf8/LargeUtf8 storage or process the view records directly.
`Utf8View` availability depends on the installed Arrow version.

</details>

## Errors

All helpers throw `RangeError` unless each range satisfies
`0 <= firstByte <= endByte <= bytes.length` and both offsets are integers.
`NaN`, infinite offsets, and fractional offsets are rejected. An invalid range
throws; a valid range containing an invalid scalar returns `undefined`.
