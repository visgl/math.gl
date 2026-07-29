# QuadkeyDecoder

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

`QuadkeyDecoder` is focused on decoding quadkeys.

## Decoder

`QuadkeyDecoder` implements the [DGGSDecoder](./dggs-decoder) API:

- `getCellLngLat(token: string): number[]`
- `getCellBoundaryPolygon(token: string): [number, number][]`
- `getCellBoundaryPolygonFlat(token: string): number[]`
- `getCellBounds(token: string): Bounds2D`
