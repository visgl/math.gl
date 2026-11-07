# UTF-8 utilities

`@math.gl/core/utf8` compares UTF-8 byte ranges and parses ASCII scalar values without materializing JavaScript strings. Use it with typed arrays, Arrow string buffers, or other UTF-8 storage. The subpath has no runtime dependencies; Apache Arrow and loaders.gl are not required.

## Usage[​](#usage "Direct link to Usage")

```
import {

  compareUTF8,

  parseUTF8Number,

  parseUTF8BigInt,

  parseUTF8Boolean

} from '@math.gl/core/utf8';



const encoder = new TextEncoder();

const bytes = encoder.encode('price: 12.5');

const price = parseUTF8Number(bytes, 7, bytes.length); // 12.5



const integerBytes = encoder.encode('9007199254740993');

const integer = parseUTF8BigInt(integerBytes, 0, integerBytes.length); // 9007199254740993n



const booleanBytes = encoder.encode(' TRUE ');

const enabled = parseUTF8Boolean(booleanBytes, 0, booleanBytes.length); // true



const first = encoder.encode('apple');

const second = encoder.encode('banana');

const order = compareUTF8(first, 0, first.length, second, 0, second.length); // -1
```

Offsets are measured in **bytes**, relative to the supplied `Uint8Array`, including when that array is a subview of another buffer. Starts are inclusive and ends are exclusive. These functions do not mutate their inputs.

## `compareUTF8`[​](#compareutf8 "Direct link to compareutf8")

```
compareUTF8(bytes1, firstByte1, endByte1, bytes2, firstByte2, endByte2): UTF8Comparison
```

Compares the ranges lexicographically using unsigned byte order.

| Parameter                  | Type         | Meaning                                                    |
| -------------------------- | ------------ | ---------------------------------------------------------- |
| `bytes1`, `bytes2`         | `Uint8Array` | Buffers containing the ranges. They may be the same array. |
| `firstByte1`, `firstByte2` | `number`     | Inclusive start offsets in the corresponding arrays.       |
| `endByte1`, `endByte2`     | `number`     | Exclusive end offsets in the corresponding arrays.         |

Returns `-1` when the first range sorts before the second, `0` for identical bytes, and `1` when it sorts after the second. A prefix sorts before its longer match; empty ranges compare equal. `UTF8Comparison` is the exported `-1 | 0 | 1` type.

Comparison does not decode or validate UTF-8, normalize Unicode, or apply locale collation. Byte order for well-formed UTF-8 follows Unicode scalar-value order, which can differ from JavaScript UTF-16 string ordering.

## Scalar parser parameters[​](#scalar-parser-parameters "Direct link to Scalar parser parameters")

All three parsers accept the same parameters:

| Parameter   | Type         | Meaning                      |
| ----------- | ------------ | ---------------------------- |
| `bytes`     | `Uint8Array` | Buffer containing the value. |
| `firstByte` | `number`     | Inclusive start byte offset. |
| `endByte`   | `number`     | Exclusive end byte offset.   |

They trim surrounding ASCII space, tab, line feed, vertical tab, form feed, and carriage return. Unicode whitespace is not trimmed. Parsing consumes the entire trimmed range: empty ranges, trailing junk, and invalid syntax return `undefined`. Their accepted grammars are ASCII-only; they do not validate UTF-8 well-formedness.

## `parseUTF8Number`[​](#parseutf8number "Direct link to parseutf8number")

```
parseUTF8Number(bytes, firstByte, endByte): number | undefined
```

Parses decimal numbers with an optional `+` or `-` sign, an optional decimal point, and an optional `e` or `E` exponent with its own optional sign. At least one digit is required in the mantissa and, when present, in the exponent. For example, `-42`, `+.25`, `1.`, and `3.5e2` are accepted. Negative zero is preserved.

Rejects hexadecimal, literal `Infinity` and `NaN`, separators such as `1,000`, non-ASCII digits, and incomplete exponents such as `1e+`.

This parser accumulates the mantissa and applies a decimal scale using JavaScript number arithmetic. It is not a correctly rounded replacement for `Number()`: long mantissas can lose precision, and intermediate overflow or underflow can occur for extreme inputs even when the final mathematical value is representable. Use `parseUTF8BigInt` for exact base-10 integers.

## `parseUTF8BigInt`[​](#parseutf8bigint "Direct link to parseutf8bigint")

```
parseUTF8BigInt(bytes, firstByte, endByte): bigint | undefined
```

Parses base-10 integers with an optional `+` or `-` sign. Digits are accumulated as `bigint`, preserving integers beyond the safe JavaScript number range. Decimal points, exponents, hexadecimal prefixes, and separators are not accepted.

## `parseUTF8Boolean`[​](#parseutf8boolean "Direct link to parseutf8boolean")

```
parseUTF8Boolean(bytes, firstByte, endByte): boolean | undefined
```

Parses case-insensitive `true` and `false`. Other values, including `0`, `1`, `yes`, and prefixes such as `trues`, return `undefined`.

## Arrow string buffers[​](#arrow-string-buffers "Direct link to Arrow string buffers")

Arrow users can pass byte ranges from `Utf8` or `LargeUtf8` values buffers. Apache Arrow is needed only by the calling application:

```
import * as arrow from 'apache-arrow';

import {parseUTF8Number} from '@math.gl/core/utf8';



const column = arrow.vectorFromArray(['12.5'], new arrow.Utf8());

const data = column.data[0]!;

const rowIndex = 0; // Local to this data chunk; the example value is non-null.

const firstByte = data.valueOffsets[rowIndex]!;

const endByte = data.valueOffsets[rowIndex + 1]!;

const score = parseUTF8Number(data.values, firstByte, endByte); // 12.5
```

For chunked vectors, locate the chunk containing the row and use a row index local to that chunk. For sliced data, read offsets from the sliced `arrow.Data` object. Offsets must address the supplied values array, not its backing `ArrayBuffer`. Check Arrow validity before parsing nullable values; a null is not an empty string. For `LargeUtf8`, convert bigint offsets to numbers only when they are safely representable. These offset-based examples do not apply directly to `Utf8View` or dictionary-encoded strings.

## Errors[​](#errors "Direct link to Errors")

All helpers throw `RangeError` unless each range satisfies `0 <= firstByte <= endByte <= bytes.length` and both offsets are integers. `NaN`, infinite offsets, and fractional offsets are rejected. An invalid range throws; a valid range containing an invalid scalar returns `undefined`.
