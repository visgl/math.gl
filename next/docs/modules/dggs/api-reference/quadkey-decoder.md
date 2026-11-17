# QuadkeyDecoder 🧪

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`QuadkeyDecoder` is focused on decoding quadkeys.

## Decoder[​](#decoder "Direct link to Decoder")

`QuadkeyDecoder` implements the [DGGSDecoder](https://visgl.github.io/math.gl/next/docs/modules/dggs/api-reference/dggs-decoder.md) API:

* `cellColumnNames: ['quadkey', 'quadkeyId', 'quadkey_id']`
* `cellToLngLat(cell: string): [number, number]`
* `cellToBoundary(cell: string): [number, number][]`
* `cellToBoundaryFlat(cell: string): number[]`
* `cellToBounds(cell: string): Bounds2D`
