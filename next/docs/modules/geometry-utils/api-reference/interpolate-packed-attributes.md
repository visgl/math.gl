# interpolatePackedAttributes

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

Reconstruct attributes in interleaved vertex buffers from original-vertex provenance, such as the output of `subdivideTriangleMesh` or `subdivideGlobeMesh`. The helper does not depend on a renderer, GPU API, or polygon module at runtime. It returns a fresh `Uint8Array` with the same record stride and never modifies its input.

Use the dedicated `@math.gl/geometry-utils/interpolate-packed-attributes` subpath for a standalone import with no runtime dependencies. The root package also exports the helper and its types for convenience; its existing geometry-processing dependencies are unchanged.

## Example[​](#example "Direct link to Example")

```
import {interpolatePackedAttributes} from '@math.gl/geometry-utils/interpolate-packed-attributes';

import {subdivideTriangleMesh} from '@math.gl/polygon';



// Two Float32 UV components per source vertex, expressed as a byte view.

const sourceUVs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);

const refined = subdivideTriangleMesh({

  positions: Array.from(sourceUVs),

  indices: [0, 1, 2, 0, 2, 3]

}, {

  transform: ([x, y]) => [x, y, Math.sin(2 * x)],

  targetSize: 3,

  tolerance: 0.01

});

const packedUVs = interpolatePackedAttributes(new Uint8Array(sourceUVs.buffer), refined, {

  byteStride: 8,

  attributes: [{type: 'float32', size: 2, byteOffset: 0, interpolation: 'linear'}]

});

const refinedUVs = new Float32Array(packedUVs.buffer);
```

For mixed records, declare each field separately. A four-component position can interpolate XYZ while preserving a layer-order component; a selection color should remain flat:

```
const attributes = [

  {

    type: 'int16', size: 4, byteOffset: 0,

    interpolation: ['linear', 'linear', 'linear', 'flat']

  },

  {type: 'uint16', size: 2, byteOffset: 8, interpolation: 'linear'},

  {type: 'uint8', size: 4, byteOffset: 12, interpolation: 'flat'}

] satisfies import('@math.gl/geometry-utils/interpolate-packed-attributes').PackedAttribute[];
```

## API[​](#api "Direct link to API")

`interpolatePackedAttributes(source, provenance, options)` accepts:

* `source`: a `Uint8Array` view containing complete interleaved records. Its visible byte offset and length are respected; bytes outside the view are never read or copied.
* `provenance.sourceVertexIndices`: three original source-record indices per output vertex.
* `provenance.sourceVertexWeights`: three corresponding finite weights in `[0, 1]` summing to one within `1e-10`. Zero-weight indices are ignored. This structural shape accepts polygon subdivision output directly; it does not create a runtime dependency on polygon.

| Option           | Default  | Description                                                                                                             |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `byteStride`     | Required | Positive integer byte length of each source and output record.                                                          |
| `attributes`     | Required | Nonoverlapping attribute descriptors within the stride. An empty list copies opaque records from the first contributor. |
| `littleEndian`   | `true`   | Byte order for multibyte components.                                                                                    |
| `maxOutputBytes` | 64 MiB   | Nonnegative integer allocation limit. Zero permits empty output only.                                                   |

Each descriptor has `type`, `size`, `byteOffset`, and `interpolation`. Supported scalar formats are `int8`, `uint8`, `int16`, `uint16`, `int32`, `uint32`, `float32`, and `float64`. Sizes are positive integers; offsets are nonnegative integers. Unaligned component offsets are supported.

`interpolation` is either `'linear'`, `'flat'`, or an array with exactly one policy per component:

* **Linear:** weighted values in the original encoded domain. Integer results use `Math.round` once after summation, including its ties-toward-positive-infinity behavior.
* **Flat:** every positive-weight contributor must have the same finite numeric value. Differing IDs, categorical values or draw-order fields are rejected, not averaged.

Padding and unlisted bytes come from the first positive-weight contributor. Declare every varying field explicitly; copying opaque bytes does not infer interpolation semantics. Identity provenance (one contributor of weight one) preserves every encoded bit, including signed zero. Float values must be finite, and interpolated overflow is rejected.

## Quantization and renderer responsibilities[​](#quantization-and-renderer-responsibilities "Direct link to Quantization and renderer responsibilities")

This interpolates **original-vertex weights**, not a sequence of quantized midpoint records. These policies can produce different integer results. For source values `[0, 1, 0]` with weights `[1/4, 1/4, 1/2]`, final rounding yields `0`; rounding the first midpoint to `1`, then rounding its midpoint with the third value, yields `1`.

Consequently this helper is not a bit-exact replacement for renderers that depend on repeated midpoint quantization. Verify integer-position error and seam behavior before adopting it. The conformance tests include a Tangram-style mixed record and explicitly test this divergence; Tangram's production implementation is not changed.

Values are interpolated in storage units. GPU-normalized formats are not decoded, packed bitfields such as RGB565 are not unpacked, and normals/tangents are not renormalized. Choose the proper application policy or preprocess/recompute such fields. Source attribute seams must already have distinct records and indices; the helper does not weld or clip geometry.

Invalid layouts, overlapping fields, contributing indices, weights, nonfinite declared values, flat conflicts and exhausted allocation limits throw `RangeError`. No partial output is returned.
