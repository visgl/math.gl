# @math.gl/geospatial/terrain

Experimental CPU terrain data and algorithms, usable in Node.js, browser workers,
and rendering applications. The initial implementation provides affine height
fields and regular meshes in local Cartesian coordinates. Coordinates and heights
use meters; the surface is Z-up.

Terrain is an opt-in subpath of the consolidated geospatial package. Its sampling
entry has no runtime package imports; geographic adapters can compose it with
CRS, projection, ellipsoid, and geoid utilities. The separate
`@math.gl/geospatial/terrain/geometry` entry imports `@math.gl/geometry`.

## HeightField

```ts
import {HeightField, TerrainSampleStatus} from '@math.gl/geospatial/terrain';

const terrain = new HeightField({
  width: 2,
  height: 2,
  heights: new Float32Array([0, 2, 1, 4]),
  origin: [100, 200],
  columnStep: [10, 0],
  rowStep: [0, 10],
  registration: 'vertex'
});

const result = terrain.sample(105, 205);
if (result.status === TerrainSampleStatus.VALID) {
  console.log(result.height); // 1.75
}
// Reuse the result object to avoid a per-query allocation.
terrain.sample(108, 202, {interpolation: 'triangle'}, result);
```

### Construction and ownership

| Property | Meaning | Default |
| --- | --- | --- |
| `width`, `height` | Integer sample counts, each at least 2 | Required |
| `heights` | `Float32Array` or `Float64Array` | Required |
| `validity` | Optional `Uint8Array`; zero is missing, any nonzero byte is valid | Finite heights are valid |
| `offset`, `stride` | Input element offset and row stride, shared by heights and validity | `0`, `width` |
| `origin` | XY metric origin | `[0, 0]` |
| `columnStep`, `rowStep` | XY displacement per column and row; rotation, shear, and negative directions are supported | `[1, 0]`, `[0, 1]` |
| `registration` | `'vertex'` or `'cell'` | `'vertex'` |
| `diagonal` | Grid-index endpoints `'00-11'` or `'10-01'` for triangle sampling and meshing | `'00-11'` |
| `heightReference` | Opaque provenance string, without coordinate conversion | `'unknown'` |

The constructor copies heights and validity into tightly packed arrays. Mutating
the input arrays afterward has no effect. Nonfinite input heights are missing
even when their mask is nonzero; their stored height becomes zero. Negative and
zero elevations remain valid. Transform vectors are copied and frozen.
Singular or numerically near-singular transforms are rejected.

For grid indices `(column, row)`, sample positions are:

```text
XY = origin + (column + shift) * columnStep + (row + shift) * rowStep
shift = 0 for vertex registration; 0.5 for cell registration
```

The query domain is the parallelogram between the outermost **sample positions**.
For cell registration it does not extend to the outer pixel edges. No extrapolation
is performed. `origin` and step vectors must describe local metric coordinates;
passing geographic degrees or assuming projected map units are ground distances
does not provide correct physical gradients. Height-reference labels do not
perform datum conversion or certify source accuracy.

`heightRange` is the frozen `[minimum, maximum]` of valid samples, or `undefined`
for an empty field. `validCount` counts valid samples. `getHeight(column, row)`
reads a grid sample directly and returns `undefined` for a missing or invalid
index. `copyData()` returns independent contiguous `heights` and `validity` arrays
for transfer or GPU preparation. Transform/registration metadata remains available
on the field and must accompany those arrays.

### Sampling contract

`sample(x, y, options?, result?)` returns a `TerrainSample` with height, XY
gradient, upward normal, height `status`, and independent `gradientStatus`.
Gradients are transformed into the world XY frame using the inverse affine
Jacobian. Normals are `normalize([-gradientX, -gradientY, 1])`.

| Interpolation | Height surface | Missing-data rule | Derivatives |
| --- | --- | --- | --- |
| `'nearest'` | Closest grid node; half-way ties select the larger grid index | Selected node must be valid | `UNAVAILABLE` |
| `'bilinear'` | Bilinear patch through four cell samples | All four must be valid, even at an edge/node | Analytic patch derivatives |
| `'triangle'` | Two planar triangles using the field's diagonal | All three selected triangle vertices must be valid | Selected triangle/contact normal |

Bilinear and triangle interpolation generally describe different surfaces. Use
triangle interpolation when comparing against the regular mesh. At interior
integer grid coordinates, the cell starting at that index is selected; the outer
maximum uses the last cell. On the `00-11` diagonal, the triangle containing `10`
is selected on ties. On the `10-01` diagonal, the triangle containing `00` wins.
These deterministic rules also apply when a neighboring triangle is missing.
Derivatives at discontinuities are the selected cell/triangle's one-sided value.

Outer endpoint excursions are clamped within a roundoff bound: a base
`8 * Number.EPSILON * max(width, height)` in grid coordinates plus world-coordinate
rounding propagated through the inverse frame (four epsilon times the absolute
query and origin magnitudes per axis). This does not recover
precision already lost in large absolute query coordinates; use local frames
when fine spatial resolution is required.

| Status | Value | Meaning |
| --- | --- | --- |
| `VALID` | 0 | Associated numeric values are available |
| `OUTSIDE_DOMAIN` | 1 | Beyond the sample domain |
| `NO_DATA` | 2 | Required sample footprint includes missing data |
| `INVALID_INPUT` | 3 | Nonfinite query coordinate |
| `NUMERIC_ERROR` | 4 | Transform, arithmetic, or output conversion overflow |
| `UNAVAILABLE` | 5 | Requested derivative is undefined for the chosen mode |
| `NOT_RESIDENT` | 6 | A required tiled sample has no resident source tile |

Numeric fields with a non-valid associated status are zero, including reused
outputs. Check `gradientStatus` before using gradients or normals. All statuses
and API names are experimental; these values are not yet a stable GPU ABI.

### Batch queries

`sampleBatch(positions, output, options?)` takes interleaved XY `Float32Array` or
`Float64Array` positions and writes caller-owned buffers, returning `output`.
No result object is allocated per sample.

```ts
const positions = new Float64Array([105, 205, 108, 202]);
const output = {
  heights: new Float64Array(2),
  statuses: new Uint8Array(2),
  gradients: new Float64Array(4),
  normals: new Float32Array(6),
  gradientStatuses: new Uint8Array(2)
};
terrain.sampleBatch(positions, output, {interpolation: 'triangle'});
```

Heights and statuses are required. Gradients, normals, and gradient statuses are
optional, but requesting gradients or normals requires `gradientStatuses`. Buffer
lengths must accommodate N heights/statuses, 2N gradients, and 3N normals. Larger
buffers retain their unused suffix. Input and output views must not overlap.

Float32 outputs round results to Float32. Overflow becomes `NUMERIC_ERROR` and
zero output instead of a valid infinite value. Height conversion overflow clears
the whole sample; gradient conversion overflow clears derivatives while leaving
the independently representable height valid. Float32 rounding can also affect
boundary selection when using Float32 input coordinates.

## HeightFieldGeometry

```ts
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain/geometry';

const mesh = new HeightFieldGeometry(terrain, {
  precision: 'float32' // or float64 for CPU geometry
});
// World position = mesh.origin + mesh.attributes.POSITION.value[index * 3 ...]
```

`HeightFieldGeometry` extends `@math.gl/geometry`'s `Geometry`. It emits indexed
`triangle-list` geometry with `POSITION`, `NORMAL`, and `TEXCOORD_0`. It is Z-up,
unlike the Y-up glTF `PlaneGeometry`. Triangle winding faces upward even when a
grid's row direction is reversed. Triangles with any missing vertex are omitted;
unused vertices retain finite placeholder attributes.

Options are `id`, `precision` (`'float32'` by default), and XYZ `origin`. Positions
are stored relative to the origin, which defaults to `[terrain.origin[0],
terrain.origin[1], 0]`; apply this translation when rendering. Position generation
uses grid steps directly to retain small offsets at large world origins. An
explicit origin Z can similarly preserve small height differences. Nonfinite or
degenerate emitted geometry throws rather than silently producing corrupt meshes.

Vertex normals are area-weighted averages of emitted triangle normals, suitable
for shading. They differ from individual triangle/contact normals. Texture UVs
run along increasing grid column/row; vertex registration maps outer nodes to
0 and 1, while cell registration maps nodes to raster texel centers. Source image
row orientation is the caller's responsibility. Indices use Uint32 for more than
65,535 grid samples, otherwise Uint16.

The mesh agrees with triangle sampling before chosen position quantization.
Float32 vertex rounding introduces additional error. Bilinear interpolation,
skirt generation, LOD morphing, tiled seams, and adaptive meshes are separate
concerns; this constructor creates only the regular source-grid triangulation.

## Implementation status

The local Cartesian foundation, geographic adapters and initial cell-registered
tiled snapshots implement portions of the
[terrain roadmap](../../../../dev-docs/terrain-roadmap.md). Adaptive tessellation,
accelerated intersections, shader kernels and deck.gl integration remain planned. CPU tests use analytic planes/saddles and
independent mesh centroid/normal checks; they do not establish CPU/GPU parity or
source DEM accuracy.

## Geographic sampling

```typescript
import {GeographicHeightField} from '@math.gl/geospatial/terrain/geographic';

const terrain = new GeographicHeightField({
  width: 2, height: 2,
  heights: new Float32Array([10, 20, 0, 10]),
  bounds: [179, 59, 181, 61],
  projection: 'geographic'
});
const sample = terrain.sample(180, 60);
```

Bounds are unwrapped west/south/east/north degrees; queries must use that same
longitude interval. Geographic and Web Mercator source rasters are supported.
Rows run north to south by default. Cell registration places samples at pixel
centers; vertex registration includes bounds endpoints. There is no implicit
longitude wrapping, latitude clamping, reprojection of raster data, or vertical
datum conversion. Geographic grids exclude poles. Web Mercator bounds are limited
to its square world extent in latitude.

Gradients and normals use WGS84 surface-metric east/north axes at the query
latitude. They describe elevation derivatives on the reference ellipsoid, without
an altitude-dependent metric correction. Normals are local east/north/up vectors,
not ECEF vectors. `heightReference` remains an opaque provenance label.

## Tiled snapshots

```typescript
import {TiledHeightField} from '@math.gl/geospatial/terrain/tiled';

const terrain = new TiledHeightField({
  revision: 'dem-2026-10',
  matrixSet: {
    crs: 'local-meters',
    matrices: [{
      id: 'fine', resolution: 10, origin: [0, 0],
      cornerOfOrigin: 'bottomLeft', tileSize: [2, 2], matrixSize: [1, 1]
    }]
  },
  tiles: [{matrixId: 'fine', column: 0, row: 0,
    heights: new Float32Array([0, 10, 20, 30])}]
});
const sample = terrain.sample(10, 10, {matrixId: 'fine', fallback: 'coarser'});
const upload = terrain.copyTileHalo('fine', 0, 0);
```

This initial tiled API accepts **cell-registered rasters in one common local metric
frame**. Matrix `tileSize` is the raster size; source buffers must match it exactly.
Matrices may have rectangular pixels and either row direction. CRS identifiers do
not trigger coordinate conversion. Geographic rasters use the separate geographic
adapter above; projected meters such as EPSG:3857 are not ground meters and must
not be passed as a local metric frame when physical slopes are required.

Construction copies and normalizes tile buffers and builds one-cell neighbor
halos. Create a new snapshot when residency changes; existing snapshots and their
revision identifiers stay stable. Queries use the same interpolation and diagonal
rules as `HeightField`, including derivatives across seams. The domain ends at
outer sample centers. `NOT_RESIDENT` means an interpolation tap has no loaded tile;
`NO_DATA` means a loaded source explicitly marks a required tap invalid. Known
no-data takes precedence over missing residency.

Fallback is opt-in and retries the **whole footprint** at a coarser matrix. Both
axis resolutions must be at least as coarse, with one strictly coarser. Candidates
sort by X resolution, then Y resolution, then identifier. No-data never triggers
fallback; no query blends taps from different resolutions. Results include the
actual matrix, snapshot revision and whether fallback occurred.

`copyTileHalo()` returns independent finite Float64 height and Uint8 validity
buffers with dimensions, metric sample-center transforms, vertex registration,
triangle diagonal and height-reference metadata. They are suitable
for worker transfer or preparing GPU buffers; this is not a GPU execution API or
a shader layout ABI. Missing neighbors have validity zero in the exported halo.
The incremental update API below reuses unchanged halos. Scalar queries still allocate
temporaries; persistent map structures, batch tiled queries, vertex-tile edge reconciliation,
coalesced tile rows, adaptive meshes and GPU kernels remain roadmap work.

## Incremental tile updates

```typescript
const next = terrain.withTiles({
  revision: 'dem-2026-11',
  tiles: [{matrixId: 'fine', column: 0, row: 0,
    heights: new Float32Array([1, 11, 21, 31])}],
  remove: []
});
for (const change of next.haloChanges) {
  // Upload copyTileHalo(...) when resident; evict the resource otherwise.
  console.log(change.matrixId, change.column, change.row, change.resident);
}
```

`withTiles()` returns a new snapshot. Inserted/replaced source buffers are copied;
unchanged source buffers and halos are shared internally. The previous snapshot
continues to answer exactly the same queries. Map copies cost O(resident tiles),
but only affected resident halos are rebuilt: changed tiles and their eight
same-matrix neighbors. This is conservative invalidation, including diagonal
neighbors needed for corner samples. Updates do not blend matrix levels.

`revision` must be a string different from the immediate parent's revision.
Revision uniqueness across an application's history is the caller's responsibility.
A transaction cannot repeat an identifier or both remove and replace it. Validation
fails atomically without modifying the previous snapshot. Removing an absent tile
is a no-op. An empty update can advance the revision without invalidating halos.

`tileCount` counts resident sources. `haloChanges` is a frozen, deterministic list
ordered by matrix identifier, row, then column. It lists resident halos to upload
and evicted tiles with `resident: false`; the initial snapshot lists all resident
tiles. Changes are relative to the immediate preceding snapshot, not a cumulative
log. Consumers skipping revisions must accumulate intervening changes or rebuild
resources from a separately maintained resident tile inventory. Every exported
halo carries the new snapshot revision, including an internally shared halo.

## Packed terrain buffers (experimental version 1)

```typescript
import {HeightField} from '@math.gl/geospatial/terrain';
import {packTerrainHeightField, unpackTerrainHeightField}
  from '@math.gl/geospatial/terrain/packed';

const halo = next.copyTileHalo('fine', 0, 0);
if (halo) {
  const packed = packTerrainHeightField(new HeightField(halo), {
    heightOrigin: 0,
    maxBytes: 1024 * 1024,
    maxHeightError: 0.01
  });
  const quantizedReference = unpackTerrainHeightField(packed);
}
```

This opt-in entry has no rendering dependency and creates no GPU resources. It
specifies four independently owned upload buffers, each with 4-byte scalar
alignment. The header and transform are each 32 bytes (two 16-byte vectors).
Typed-array words define the layout; callers handling cross-endian byte streams
must explicitly convert their byte order.

| Buffer | Scalar layout |
| --- | --- |
| `header` | Eight u32 words: version=1, width, height, registration (vertex=0/cell=1), diagonal (00-11=0/10-01=1), sample count, reserved=0, reserved=0 |
| `transform` | Eight f32 words: column X/Y, row X/Y, inverse00, inverse01, inverse10, inverse11 |
| `heights` | `width * height` row-major f32 elevations relative to `origin[2]` |
| `validity` | `width * height` row-major u32 values, exactly 0 or 1 |

`origin` stays in host-side double precision. Subtract its XY components before
converting query coordinates to f32; subtract 0.5 from transformed grid coordinates
for cell registration. The inverse transforms relative metric XY into grid
coordinates. Sample heights are relative to `origin[2]`; reconstruct absolute
heights by adding that origin at the appropriate precision. `heightReference`
remains host metadata. Invalid heights are finite zero placeholders regardless
of the chosen height origin; always consult validity before use.

Packing rounds grid steps to f32, then computes and rounds their inverse. It
rejects singular rounded grids and nonfinite transforms. **Horizontal grid
quantization is separate from height quantization**: the packed grid may differ
from the original grid. `maxHeightError` measures the largest absolute difference
between source heights and reconstructed packed heights at source nodes, not
horizontal error, surface interpolation error, or shader arithmetic error. It does
not certify CPU/GPU parity. Choosing a height origin near the source elevations
can reduce quantization. Valid heights that overflow f32, overflow reconstruction,
or exceed the requested height-error budget cause packing to throw.

`maxBytes` is a hard budget for all four upload buffers: `64 + 8 * sampleCount`,
defaulting to 64 MiB. The count must fit u32. This excludes application/device
copies, buffer-binding padding, and CPU reconstruction allocations. Packing does
not choose an adapter, evict pages, schedule uploads, or consult device limits.

`unpackTerrainHeightField()` validates the version, dimensions, flags, buffer
lengths/types, finite values, binary masks, inverse transform and host metadata.
It reconstructs a copied CPU reference for the quantized grid and elevations.
The payload's buffers are mutable and transferable; do not modify or detach them
while an upload or decoder reads them. Keep the tile identifier and snapshot
revision alongside the payload in the resource manager. WGSL/GLSL samplers,
bounded device page tables, shader conformance and luma.gl graph adapters are
subsequent T3 work.
