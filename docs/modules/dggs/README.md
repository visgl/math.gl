# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

`@math.gl/dggs` provides a deliberately small JavaScript API for decoding cell geometry from GeoHash, Quadkey, and S2 identifiers. It also detects their conventional data-column names so visualization layers can select the appropriate decoder.

It is not a general abstraction over the full API surface of DGGS implementations. Applications that need parent/child traversal, neighbors, fills, compaction, metrics, or OGC API - DGGS support should use a full implementation or an abstraction such as [DGGAL](https://dggal.org/).

## Installation

```bash
npm install @math.gl/dggs
```

## Usage

```js
import {GeohashDecoder} from '@math.gl/dggs/geohash';
const polygon = GeohashDecoder.getCellBoundaryPolygon(geohashId);
```

```js
import {findDGGSCellColumn} from '@math.gl/dggs';

const match = findDGGSCellColumn(['name', 's2_token', 'value']);
// {columnName: 's2_token', decoder: S2Decoder}
```

The root export contains the shared types, bundled decoder registry, cell-column detection, and all three decoders. Decoder-specific subpaths are also available when an application only needs one grid:

- `@math.gl/dggs/geohash`
- `@math.gl/dggs/quadkey`
- `@math.gl/dggs/s2`

### S2 Cell Format

S2 cells are identified by a 64&nbsp;bit index. The three most significant bits
encode the cube face, followed by 60&nbsp;bits that encode the cell's position on
the Hilbert curve. The least significant bit is always set and trailing zero
bits indicate the level of the cell. When written in hexadecimal the trailing
zeros are stripped; this representation is commonly referred to as the **S2
token**.

## Attribution

The `S2Encoder` object is based on a subset of the s2-geometry module under ISC License (ISC)
Copyright (c) 2012-2016, Jon Atkins github@jonatkins.com
Copyright (c) 2016, AJ ONeal aj@daplie.com
