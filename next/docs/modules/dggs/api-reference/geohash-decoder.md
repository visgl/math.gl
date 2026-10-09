# geohash-decoder

### `GeohashDecoder`[​](#geohashdecoder "Direct link to geohashdecoder")

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)

caution

This module is still experimental. It may have issues and functionality may change in minor releases.

> The GeoHash functions in math.gl are currently focused on **decoding** Geohash encoded data, not encoding it.

## Decoder[​](#decoder "Direct link to Decoder")

`GeohashDecoder` implements the [DGGSDecoder](https://visgl.github.io/math.gl/next/docs/modules/dggs/api-reference/dggs-decoder.md) API:

* `cellColumnNames: ['geohash', 'geohashId', 'geohash_id']`
* `cellToLngLat(cell: string): [number, number]`
* `cellToBoundary(cell: string): [number, number][]`
* `cellToBoundaryFlat(cell: string): number[]`
* `cellToBounds(cell: string): Bounds2D`
