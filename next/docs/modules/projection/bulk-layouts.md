# ProjectionBuffer

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

Use `ProjectionBuffer` when coordinates live in separate input/output arrays, interleaved records with padding, or separate X/Y/Z/M columns. Capture the layout once and reuse the transform and storage across batches or chunks.

For contiguous coordinates that can be overwritten, the existing [`projectFlat`](https://visgl.github.io/math.gl/next/docs/modules/projection/api-reference/projection-transform.md#flat-typed-arrays-in-place) remains the shortest path and can use whole-buffer projection kernels.

```
import { ProjectionTransform } from "@math.gl/projection/core";

import { mercator } from "@math.gl/projection/projections/merc";

import { ProjectionBuffer } from "@math.gl/projection/bulk";



const projection = new ProjectionTransform({

  to: "EPSG:3857",

  projections: [mercator],

});

const transform = new ProjectionBuffer({

  projection,

  dimension: 4,

  inputStride: 6,

  outputStride: 5,

});



// Each input record is [longitude, latitude, height, M, padding, padding].

const input = new Float64Array([12, 40, 100, 7, 0, 0, 13, 41, 200, 8, 0, 0]);

// Each output record is [x, y, height, M, padding].

const output = new Float32Array(10);

transform.projectFlatTo(input, output, 2);
```

`ProjectionTransform`, `ProjectionPipeline` and prepared factory transforms provide the synchronous output methods this adapter uses. A lazy projection must have completed `preload()` before a nonempty batch; these methods neither start imports nor return promises. CRS units, axes, datum and height operations are those of the supplied projection.

## Layout and methods[​](#layout-and-methods "Direct link to Layout and methods")

The optional `/bulk` subpath exports `ProjectionBuffer` and the types `ProjectionBufferOptions` and `BulkProjection`. It has no runtime dependencies and is absent from root/core/pipeline bundles unless explicitly imported. The measured adapter alone is approximately 5.3 KiB minified / 1.7 KiB gzip; the projection algorithms and optional readers you select have their own costs.

| Constructor option            | Meaning                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `projection`                  | Transform providing `projectToSync` and `unprojectToSync`; each writes the complete coordinate into the supplied result |
| `dimension`                   | Integer at least 2; default 2. XY, XYZ and XYZM use 2, 3 and 4                                                          |
| `inputOffset`, `outputOffset` | Element offsets in each supplied typed-array view; default 0                                                            |
| `inputStride`, `outputStride` | Element distance between records; defaults to `dimension` for interleaved arrays and 1 for columns                      |

All four methods return their supplied output storage:

```
transform.projectFlatTo(input, output, count?, start?, epochs?);

transform.unprojectFlatTo(input, output, count?, start?, epochs?);

transform.projectColumnsTo(inputColumns, outputColumns, count?, start?, epochs?);

transform.unprojectColumnsTo(inputColumns, outputColumns, count?, start?, epochs?);
```

Interleaved buffers and each column must be `Float32Array` or `Float64Array`. Different input/output types are allowed. Columns require exactly `dimension` arrays, and may use different types for individual ordinates. Interleaved strides must contain all ordinates; column strides may be any positive integer. Only the addressed ordinates are written; padding, other records and storage outside a view remain untouched. Any incomplete final record is excluded from capacity.

`start` is a record index, default 0. It applies to both input and output layouts. `count` defaults to the remaining complete input records after `start`; output must have capacity for that range. Pass a count when capacity includes spare records. Counts and indices must be nonnegative safe integers. Offsets/strides are in elements, not bytes, and are relative to the supplied view.

## Separate columns[​](#separate-columns "Direct link to Separate columns")

```
const columns = new ProjectionBuffer({ projection, dimension: 4 });

const longitude = new Float64Array([12, 13]);

const latitude = new Float64Array([40, 41]);

const height = new Float64Array([100, 200]);

const measure = new Float64Array([7, 8]);

const inputColumns = [longitude, latitude, height, measure];

const outputColumns = [

  new Float32Array(2),

  new Float32Array(2),

  new Float64Array(2),

  new Float64Array(2),

];

columns.projectColumnsTo(inputColumns, outputColumns);
```

Retain the column lists as well as their arrays when repeatedly transforming batches. Height is preserved or transformed according to the supplied operation. M and later ordinates are copied as payload, including nonfinite payloads and signed zero. Finite payload values that exceed Float32 range are rejected before committing the record; output conversion may round or underflow representable values.

## Chunking and coordinate epochs[​](#chunking-and-coordinate-epochs "Direct link to Chunking and coordinate epochs")

```
const contiguous = new ProjectionBuffer({ projection, dimension: 4 });

const positions = new Float64Array(4000);

const projected = new Float64Array(4000);

const records = positions.length / 4;

for (let start = 0; start < records; start += 256) {

  contiguous.projectFlatTo(

    positions,

    projected,

    Math.min(256, records - start),

    start,

  );

}
```

Use the same views for each chunk; no `slice()` or `subarray()` is needed. With a time-dependent `ProjectionPipeline`, the final argument accepts a constant finite decimal-year epoch or a Float32/Float64 epoch array indexed by the original record index. Epoch arrays are read-only and must cover `start + count`. Epochs have the pipeline's existing meaning; the adapter does not infer them from M or change the operation's source/target epoch semantics.

## Ownership and failures[​](#ownership-and-failures "Direct link to Ownership and failures")

Inputs and outputs must have disjoint addressed byte ranges or exactly matching in-place mappings. Matching means the same backing buffer, element type, addressed starting byte and stride. Column swaps are allowed when each mapping is exact: all input ordinates are captured before any output ordinate is written. Output columns must be disjoint from one another. Epochs and outputs must be disjoint. Range checks conservatively include stride gaps, and shared-backed views with uncertain backing identity are conservatively treated as potentially aliased. Use separate storage for such layouts.

Invalid layouts, capacities, overlaps and epoch storage shapes fail before any coordinate is written. A coordinate, epoch or Float32 range failure commits earlier records and preserves the failing record and later records. Empty ranges perform storage validation but do not invoke the supplied projection.

The adapter owns one input/output scratch pair per observed synchronous call depth, reusing them across batches, chunks and recursive hooks. Projection scratch points and pipeline ordinate stacks follow the same bounded-by-observed-depth policy. Independent instances retain separate scratch; caller-owned outputs are never used as working points. Setup and first-time recursive depth growth allocate storage. The successful record loops create no coordinate objects, arrays or subviews. JavaScript runtime boxing and sampling overhead can still appear in heap profiles.

These layouts provide reusable storage contracts rather than a universal throughput advantage. Optimized contiguous in-place paths, and gather/flat/scatter using a reusable compact buffer, can be faster. See the [performance guidance](https://visgl.github.io/math.gl/next/docs/modules/projection/benchmarks.md#choose-a-coordinate-api).
