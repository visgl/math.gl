# @math.gl/geometry

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->Geometry processing workshop<!-- -->…

⛶

Utilities for processing renderer-independent geometry stored in typed arrays. The module is designed for loaders and applications that need to inspect, normalize, or decode geometry without depending on a WebGL or WebGPU runtime.

## Feature support[​](#feature-support "Direct link to Feature support")

Mesh and packed-attribute processing capabilities for renderer-independent buffers.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                       | math.gl support    | Notes                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Attribute and primitive traversal             | ✅ Implemented     | [Geometry utilities](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/geometry-utils.md) inspect layouts and iterate attributes/primitives.                                                       |
| Vertex normals                                | ✅ Implemented     | CPU normal generation for the documented primitive modes.                                                                                                                                                                                    |
| Transform, merge and weld meshes              | ✅ Implemented     | [Mesh processing](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/mesh-processing.md) preserves explicit attribute and index contracts.                                                          |
| Degenerate-triangle inspection                | ✅ Implemented     | Inspection reports degenerate triangles; callers choose how to handle the result.                                                                                                                                                            |
| Packed attribute interpolation                | ✅ Implemented     | [Mixed linear/flat interpolation policies](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/interpolate-packed-attributes.md) consume subdivision provenance without per-vertex object unpacking. |
| Compact attribute encodings                   | ✅ Implemented     | RGB565, octahedral normals, texture-coordinate compression and ZigZag delta decoding.                                                                                                                                                        |
| Automatic topology repair or Boolean modeling | ❌ Not implemented | Welding and degeneracy inspection do not provide a manifold-repair or solid Boolean engine.                                                                                                                                                  |
| General mesh simplification and UV unwrapping | ❌ Not implemented | No public quadric-error simplifier, arbitrary UV atlas generator, or tangent-space generation pipeline.                                                                                                                                      |

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/geometry
```

## Usage[​](#usage "Direct link to Usage")

```
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

## Mesh processing[​](#mesh-processing "Direct link to Mesh processing")

[Transform, merge, weld and inspect triangle meshes](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/mesh-processing.md). The inline workshop combines these operations on two sphere meshes. Expand the infobox to stretch or reflect a mesh, compare vertex counts, and inspect wireframe topology.

[Interpolate interleaved attributes](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/interpolate-packed-attributes.md) from polygon subdivision provenance without unpacking every vertex into JavaScript objects. Declare linear and flat policies explicitly, including mixed policies within one attribute.

## API[​](#api "Direct link to API")

* Geometry inspection and traversal: `isGeometry`, `makeAttributeIterator`, `makePrimitiveIterator`, `computeVertexNormals`
* Typed arrays and component types: `GL`, `GL_TYPE`, `GLType`, `concatTypedArrays`
* Packed attributes: `interpolatePackedAttributes`, `encodeRGB565`, `decodeRGB565`, octahedral vector encoding, texture-coordinate compression, and ZigZag delta decoding
* Coordinate helpers: `emod`

The initial API is based on the geometry utilities previously maintained in `@loaders.gl/math`.
