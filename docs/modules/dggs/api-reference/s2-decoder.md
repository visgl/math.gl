# S2 API

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

## Overview

S2 is a discrete global grid system built on the Hilbert curve.
See [s2geometry.io](https://s2geometry.io/) for more information.

> The S2 functions in math.gl are currently focused on **decoding** S2 encoded data, not encoding it.

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

Implements the functions in the [DGGSDecoder](/docs/modules/types/api-reference/dggs) type, e.g:

- `getCellIndexFromToken(token: string): bigint` - Decodes a token string into the 64 bit index.
- `getTokenFromCellIndex(index: bigint): string` - Encodes the 64 bit index into a token string.
- `getCellLngLat(token: string): number[]` - Returns the center `[lng, lat]` of the cell
- `getCellBoundaryPolygonFlat(token: string): Float64Array` - Returns the boundary as a flat array `[lng0, lat0, ...]` for the S2 cell
