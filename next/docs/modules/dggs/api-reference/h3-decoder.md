# H3Decoder

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`H3Decoder` is the lightweight H3 geometry adapter exported by `@math.gl/dggs/h3`. It accepts hexadecimal H3 strings and `bigint` indexes, and implements the common [`DGGSDecoder`](https://visgl.github.io/math.gl/next/docs/modules/dggs/api-reference/dggs-decoder.md) center, boundary, bounds, and token/index conversion methods.

For traversal, neighborhood, fill, compaction, metrics, and other H3 operations, use the full [`h3-js`](https://github.com/uber/h3-js) API directly.
