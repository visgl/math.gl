# UTF-8 utilities

`@math.gl/core/utf8` provides byte-range comparisons and ASCII scalar parsing without
materializing JavaScript strings. It has no runtime dependencies and is available
as an optional subpath, independent of the core root entry.

```typescript
import {compareUTF8, parseUTF8Number} from '@math.gl/core/utf8';

const bytes = new TextEncoder().encode('price: 12.5');
parseUTF8Number(bytes, 7, bytes.length); // 12.5
compareUTF8(bytes, 0, 5, new TextEncoder().encode('price'), 0, 5); // 0
```

All offsets are byte offsets: the start is inclusive and the end is exclusive.
Invalid ranges (including fractional offsets) throw `RangeError`. Empty ranges
compare equal; scalar parsers return `undefined` for empty or invalid input.

| Function | Behavior |
| --- | --- |
| `compareUTF8(bytes1, firstByte1, endByte1, bytes2, firstByte2, endByte2)` | Returns `-1`, `0`, or `1` using unsigned byte order. Prefixes sort before longer matching ranges. No decoding, Unicode normalization, validation, or locale collation is performed. |
| `parseUTF8Number(bytes, firstByte, endByte)` | Parses decimal numbers with an optional sign, decimal point, and exponent. Rejects hexadecimal, `NaN`, and literal `Infinity`. Uses JavaScript number arithmetic; precision and overflow limits apply. |
| `parseUTF8BigInt(bytes, firstByte, endByte)` | Parses base-10 integers with an optional sign. Rejects decimal points and exponents. |
| `parseUTF8Boolean(bytes, firstByte, endByte)` | Parses case-insensitive `true` and `false`. Rejects numeric and other aliases. |

The parsers trim ASCII space, tab, line feed, vertical tab, form feed, and carriage
return. They do not trim Unicode whitespace. `UTF8Comparison` is the exported
`-1 | 0 | 1` result type.
