# @math.gl/geometry-utils

Utilities for processing renderer-independent geometry stored in typed arrays. The module is
designed for loaders and applications that need to inspect, normalize, or decode geometry without
depending on a WebGL or WebGPU runtime.

## Installation

```bash
npm install @math.gl/geometry-utils
```

## Usage

```typescript
import {GL, computeVertexNormals, octDecode} from '@math.gl/geometry-utils';
import {Vector3} from '@math.gl/core';

const normals = computeVertexNormals({
  mode: GL.TRIANGLES,
  attributes: {
    POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}
  }
});

const decodedNormal = octDecode(128, 128, new Vector3());
```

## API

- Geometry inspection and traversal: `isGeometry`, `makeAttributeIterator`,
  `makePrimitiveIterator`, `computeVertexNormals`
- Typed arrays and component types: `GL`, `GL_TYPE`, `GLType`, `concatTypedArrays`
- Packed attributes: `encodeRGB565`, `decodeRGB565`, octahedral vector encoding, texture-coordinate
  compression, and ZigZag delta decoding
- Coordinate helpers: `emod`

The initial API is based on the geometry utilities previously maintained in `@loaders.gl/math`.
