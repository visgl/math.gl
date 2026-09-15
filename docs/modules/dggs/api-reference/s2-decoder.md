# S2Decoder

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

## Overview

S2 is a discrete global grid system built on the Hilbert curve.
See [s2geometry.io](https://s2geometry.io/) for more information.

The S2 functions in math.gl focus on decoding cell geometry and navigating an existing hierarchy.
They do not provide coordinate-to-cell encoding, neighbors, coverings, or region operations.

## API Notes

The API provided by this module works with S2 token strings, as those are typically found in data files.

S2 cells have multiple representations, and can be represented as:

- S2 token strings (stringified versions of the indexes)
- S2 indexes which are 64 bit numbers represented by JavaScript `bigint`

The 64 bit index layout allocates 3 bits for the face id and 60 bits for
the Hilbert curve position. The least significant bit is always set and
trailing zero bits encode the level. When expressed as hexadecimal
strings these trailing zeros are omitted; such a string is known as the
S2 token. An empty cell is represented by the token `X`.

### `S2Decoder`

`S2Decoder` implements the [DGGSDecoder](./dggs-decoder) API:

- `cellColumnNames: ['s2', 's2Token', 's2_token', 's2Cell', 's2_cell', 's2CellId', 's2_cell_id']`
- `tokenToCell(token: string): bigint`
- `cellToToken(cell: string | bigint): string`
- `cellToLngLat(cell: string | bigint): [number, number]`
- `cellToBoundary(cell: string | bigint): [number, number][]`
- `cellToBoundaryFlat(cell: string | bigint): number[]`
- `cellToBounds(cell: string | bigint): Bounds2D`

`cellToBounds` returns conservative longitude/latitude bounds in degrees. Longitudes are unwrapped
so that east is greater than or equal to west; antimeridian bounds may therefore contain endpoints
outside `[-180, 180]`. Level-zero polar faces span the full longitude range.

### S2 hierarchy functions

The `@math.gl/dggs/s2` subpath also exports lightweight hierarchy helpers:

- `isS2TokenValid(token: unknown): boolean`
- `isS2IndexValid(index: unknown): boolean`
- `getS2IndexFromToken(token: string): bigint`
- `getS2TokenFromIndex(index: bigint): string`
- `getS2Level(index: bigint): number`
- `getS2ChildIndex(index: bigint, child: number): bigint`
- `getS2IndexFromCell(cell: S2Cell): bigint`
- `getS2DescendantIndex(root: bigint, relativeLevel: number, x: number, y: number): bigint`

`getS2ChildIndex` uses Hilbert child order. `getS2DescendantIndex` instead accepts spatial `(x, y)`
coordinates along the root cell's face-local axes and accounts for Hilbert orientation changes.
This makes it suitable for implicit quadtree addressing.
