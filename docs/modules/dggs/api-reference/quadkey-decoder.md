# QuadKey API

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

The quadkey library is currently focused on decoding quadkeys.

> The quadkey functions in math.gl are currently focused on **decoding** S2 encoded data, not encoding it.

## Functions

#### `getQuadkeyLngLat(quadkey: string): number[]`

Returns the center lng, lat of a quadkey cell.

#### `getQuadkeyBoundary(quadkey: string): number[][]`

Returns the center lng, lat of a quadkey cell.

#### `getQuadkeyBoundaryFlat(quadkey: string): number[]`

Returns the center lng, lat of a quadkey cell.
