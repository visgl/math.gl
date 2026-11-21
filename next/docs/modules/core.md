# @math.gl/core

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

The core package provides vectors, matrices, and rotations for 3D math, plus utilities for colors, UTF-8 text, and Apache Arrow data.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core
```

## Entry points[​](#entry-points "Direct link to Entry points")

| Import                                                                                                  | Description                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`@math.gl/core/types`](https://visgl.github.io/math.gl/next/docs/modules/core/types.md)   | Numeric array and bounds types, runtime guards, and Float16 detection.                                           |
| [`@math.gl/core/matrix`](https://visgl.github.io/math.gl/next/docs/modules/core/matrix.md) | Vectors, matrices, coordinate conversions, and transforms.                                                       |
| [`@math.gl/core/color`](https://visgl.github.io/math.gl/next/docs/modules/core/color.md)   | Color scales, palettes, and lookup tables.                                                                       |
| [`@math.gl/core/utf8`](https://visgl.github.io/math.gl/next/docs/modules/core/utf8.md)     | Performant UTF-8 processing without JavaScript strings                                                           |
| [`@math.gl/core/arrow`](https://visgl.github.io/math.gl/next/docs/modules/core/arrow.md)   | Arrow tables and vectors, GeoArrow, and WKB. Install the `apache-arrow` peer dependency to use this entry point. |
