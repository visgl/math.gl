# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

`@math.gl/dggs-quadkey` is a JavaScript library providing math for the Quadkey DGGS (Discrete Global Grid System).

## Installation

```bash
npm install @math.gl/dggs-quadkey
```

## Usage

Get a polygon representing the outline of a specific

```js
import {getQuadkeyLngLat} from '@math.gl/dggs-quadkey';
const center = getQuadkeyLngLat(quadkey);
```

## Attribution
