# QuadkeyDecoder 🧪

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`QuadkeyDecoder` is focused on decoding quadkeys.

## Decoder

`QuadkeyDecoder` implements the [DGGSDecoder](./dggs-decoder) API:

- `cellColumnNames: ['quadkey', 'quadkeyId', 'quadkey_id']`
- `cellToLngLat(cell: string): [number, number]`
- `cellToBoundary(cell: string): [number, number][]`
- `cellToBoundaryFlat(cell: string): number[]`
- `cellToBounds(cell: string): Bounds2D`
