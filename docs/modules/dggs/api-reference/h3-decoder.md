# H3Decoder

`H3Decoder` is the lightweight H3 geometry adapter exported by `@math.gl/dggs/h3`. It accepts hexadecimal H3 strings and `bigint` indexes, and implements the common [`DGGSDecoder`](./dggs-decoder) center, boundary, bounds, and token/index conversion methods.

For traversal, neighborhood, fill, compaction, metrics, and other H3 operations, use the full [`h3-js`](https://github.com/uber/h3-js) API directly.
