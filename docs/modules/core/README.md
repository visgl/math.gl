# @math.gl/core

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

The core package provides vectors, matrices, and rotations for 3D math, plus utilities for colors, UTF-8 text, and Apache Arrow data.

## Installation

```bash
npm install @math.gl/core
```

## Entry points

| Import | Description |
| --- | --- |
| [`@math.gl/core/types`](./types/README.md) | Numeric array and bounds types, runtime guards, and Float16 detection. |
| [`@math.gl/core/matrix`](./matrix.md) | Vectors, matrices, coordinate conversions, and transforms. |
| [`@math.gl/core/color`](./color.md) | Color scales, palettes, and lookup tables. |
| [`@math.gl/core/utf8`](./arrow/utf8/README.md) | Performant UTF-8 processing without JavaScript strings |
| [`@math.gl/core/arrow`](./arrow/README.md) | Arrow tables and vectors, GeoArrow, and WKB. Install the `apache-arrow` peer dependency to use this entry point. |
