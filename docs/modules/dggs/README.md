# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

`@math.gl/dggs` is a JavaScript library which provides lightweight support for working with Discrete Global Grid System (DGGS) indices.

## Installation

```bash
npm install @math.gl/dggs
```

## Usage

```js
import {GeohashDecoder} from '@math.gl/dggs';
const polygon = GeohashDecoder.getCellBoundaryPolygon(geohashId);
```

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
