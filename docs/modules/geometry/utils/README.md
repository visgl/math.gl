# @math.gl/geometry/utils

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

import Example from '@site/src/components/geometry-processing';

<Example inline interactive height={540} />

Utilities for processing renderer-independent geometry stored in typed arrays. The module is
designed for loaders and applications that need to inspect, normalize, or decode geometry without
depending on a WebGL or WebGPU runtime.

## Usage

```typescript
import {GL, computeVertexNormals, octDecode} from '@math.gl/geometry';
import {Vector3} from '@math.gl/core';

const normals = computeVertexNormals({
  mode: GL.TRIANGLES,
  attributes: {
    POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), size: 3}
  }
});

const decodedNormal = octDecode(128, 128, new Vector3());
```

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Attribute and primitive traversal | ✅ | [Geometry utilities](./api-reference/geometry-utils.md) inspect layouts and iterate attributes/primitives. |
| Vertex normals | ✅ | CPU normal generation for the documented primitive modes. |
| Transform, merge and weld meshes | ✅ | [Mesh processing](./api-reference/mesh-processing.md) preserves explicit attribute and index contracts. |
| Degenerate-triangle inspection | ✅ | Inspection reports degenerate triangles; callers choose how to handle the result. |
| Projected bounds | ✅ | [Sample nonlinear boxes](./api-reference/project-bounds.md); conservative inflation requires a qualified global Lipschitz contract. |
| Projected texture coordinates | ✅ | [Generate float64 UVs](./api-reference/project-texture-coordinates.md) with a prepared source-to-image transform and explicit image bounds. |
| Packed attribute interpolation | ✅ | [Mixed linear/flat interpolation policies](./api-reference/interpolate-packed-attributes.md) consume subdivision provenance without per-vertex object unpacking. |
| Compact attribute encodings | ✅ | RGB565, octahedral normals, texture-coordinate compression and ZigZag delta decoding. |
| Automatic topology repair or Boolean modeling | ❌ | Welding and degeneracy inspection do not provide a manifold-repair or solid Boolean engine. |
| General mesh simplification and UV unwrapping | ❌ | No public quadric-error simplifier, arbitrary UV atlas generator, or tangent-space generation pipeline. |

## Installation

```bash
npm install @math.gl/geometry
```

## Mesh processing

[Transform, merge, weld and inspect triangle meshes](./api-reference/mesh-processing.md).
The inline workshop combines these operations on two sphere meshes. Expand the infobox
to stretch or reflect a mesh, compare vertex counts, and inspect wireframe topology.

[Interpolate interleaved attributes](./api-reference/interpolate-packed-attributes.md) from
polygon subdivision provenance without unpacking every vertex into JavaScript objects.
Declare linear and flat policies explicitly, including mixed policies within one attribute.

## API

- Geometry inspection and traversal: `isGeometry`, `makeAttributeIterator`,
  `makePrimitiveIterator`, `computeVertexNormals`
- Typed arrays and component types: `GL`, `GL_TYPE`, `GLType`, `concatTypedArrays`
- Packed attributes: `interpolatePackedAttributes`, `encodeRGB565`, `decodeRGB565`, octahedral vector encoding, texture-coordinate
  compression, and ZigZag delta decoding
- Coordinate helpers: `emod`

The initial API is based on the geometry utilities previously maintained in `@loaders.gl/math`.
