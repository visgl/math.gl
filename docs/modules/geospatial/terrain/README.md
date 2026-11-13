# Terrain

Experimental CPU terrain data and algorithms, usable in Node.js, browser workers,
and rendering applications. The initial implementation provides affine height
fields and regular meshes in local Cartesian coordinates. Coordinates and heights
use meters; the surface is Z-up.

Terrain APIs are available from `@math.gl/geospatial/terrain` and `@math.gl/geospatial`.
Named imports are tree-shakable; unbundled module loaders evaluate the root
entry and its declared dependencies.

## Usage

```typescript
import {HeightField} from '@math.gl/geospatial/terrain';

const field = new HeightField({
  width: 2, height: 2, heights: new Float64Array([0, 1, 2, 3])
});
const height = field.sample(0.5, 0.5);
```

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Affine and geographic height fields | ✅ | Vertex/cell registration, optional raster-footprint clamping, masked bilinear support, explicit metric/geographic frames, and nearest/bilinear/triangle sampling. |
| Batch heights, gradients and normals | ✅ | Caller-owned buffers and separate value/gradient statuses retain interpolation and coverage semantics. |
| Resident tiled snapshots and incremental updates | ✅ | Insertion/replacement/eviction, neighbor halos and whole-footprint fallback are explicit; no implicit tile fetching. |
| Regular and adaptive CPU meshing | ✅ | Regular geometry and optional tessellators produce mesh data with source registration and nodata contracts. |
| Terrain analysis and contour paths | ✅ | Raster gradients, slope/aspect, profiles, contours, stitching, bounded simplification and profile measurements. |
| Indexed ray, nearest and contact queries | ✅ | Bounded triangle-surface queries include sphere/capsule contacts and segment clearance with explicit completion status. |
| Tile reconciliation and conforming mesh seams | ✅ | Same-level vertex reconciliation, supported mixed-resolution boundary stitching and visual skirts have separate physical/visual contracts. |
| Packed GPU-upload substrate | ✅ | Experimental versioned packed buffers provide a CPU-validated data layout; they do not execute shaders. |
| Real-DEM and numerical qualification | ◐ | Analytic controls and an independent regional GDAL fixture are implemented; broader terrain distributions and CPU/GPU conformance remain open. |
| Device-callable WGSL/GLSL terrain execution | ❌ | Shader/device implementation and [GPU qualification](https://github.com/visgl/math.gl/blob/master/dev-docs/terrain-roadmap.md) belong to companion luma.gl work. |
| Continuous first-impact and physics solver integration | ❌ | Overlap/clearance queries do not provide time-of-impact, rotating/curved sweeps, reduced contact manifolds, or a dynamics solver. |
| Automatic renderer LOD/drape/picking integration | ❌ | The module supplies data and queries; complete deck.gl rendering/LOD and shared displayed-surface integration remain separate roadmap work. |

## Sampled line of sight

`getTerrainProfileHorizon(profile, {observerHeight})` returns the greatest known
elevation angle and its first sample index. Missing samples make this a lower
bound; `complete` reports whether all samples are present. The observer's absolute
height must be above the ground at station zero when that sample is known.
`getTerrainProfileViewshed` classifies each sample along the same straight radial
profile using `TerrainProfileViewStatus`: observer, visible, blocked, unknown or
missing. A known earlier obstruction blocks a target even if another earlier sample
is missing; otherwise missing earlier terrain makes visibility unknown. A tangent
to an earlier sample is blocked. These operations describe the sampled
piecewise-linear surface, not an area viewshed or unsampled terrain. They do not
model Earth curvature, refraction, or geodesic paths.

`getTerrainProfileVisibility(profile, {observerHeight, targetHeight})` compares
absolute endpoint elevations against samples of a straight horizontal profile.
It returns `blocked` when a valid sample touches or crosses the line, `unknown`
when coverage is missing and no obstruction is known, and `clear` otherwise.
The result also reports the first observed blocker, missing sample count and
minimum sampled vertical clearance. Missing samples can hide an earlier blocker.
A clear result applies to the sampled piecewise-linear profile, not unsampled
terrain. Curvature, refraction and geodesic paths are not modeled.

## Cross-tile contours

`weldTerrainContourTiles(tiles, {width, height})` combines contour segment
graphs from same-resolution vertex-registered tiles. Each tile supplies integer
`column` and `row` addresses and its `createTerrainContours` result. The output
is a `TerrainContours` graph that can be passed to `stitchTerrainContours`.
Grid coordinates are expressed in the shared global tile lattice; positions use
the first tile's local origin. All tiles must use the same affine grid, contour
levels, and height reference. Matching boundary coordinates are compared exactly
in the lattice; `maxPositionDifference` bounds any world-frame XY mismatch at
a matching point and defaults to zero. The function never welds merely nearby
points, interpolates missing terrain, or closes a gap for a missing tile.
Identical shared-boundary segments are emitted once. The input vertex and segment
budgets apply across the full set of tiles, before welding.
The weld key keeps integer and fractional lattice components separate; output
`gridCoordinates` are Float64 values and can round at large lattice offsets.

```ts
import {weldTerrainContourTiles, stitchTerrainContours} from '@math.gl/geospatial/terrain';
const contours = weldTerrainContourTiles(tiles, {width: 257, height: 257});
const paths = stitchTerrainContours(contours);
```

`stitchTerrainContourTiles(tiles, options)` composes these two operations for a
single snapshot, with the same weld and path capacity limits.

`diagnoseTerrainContourBoundaries(contours, {width, height})` reports graph
vertices on tile lattice lines that have degree one or degree greater than two.
Its arrays provide vertex IDs, graph degrees, contour-level indices and a
column/row boundary bitmask. It classifies the supplied Float64 grid coordinates,
which can round at very large offsets. An endpoint is evidence of an open path,
not proof of a seam defect: dataset edges, absent tiles and nodata can also
produce one. The function does not alter or close the graph.
Run `node scripts/benchmark-terrain-contours.mjs` after building to measure
contour generation, welding and tracing separately on the pinned DTED fixture.
The report includes warmup, percentile timings, graph size, segment and path counts.

### Gradient pyramids

`createTerrainGradientPyramid(createTerrainGradientGrid(field))` builds weighted
block averages of valid world-frame gradient vectors. Every level reports valid
and total source-sample counts, including smaller blocks at odd edges. `blockSize`
describes coverage on the original grid; the returned origin and steps describe
that source grid rather than uniformly spaced centers of the coarser blocks.
Taking the slope of an averaged gradient is not the same as averaging slopes or
differentiating filtered elevation. These averages are not conservative bounds.

### Incremental vertex halos and filtered rasters

`updateTerrainVertexTileHalos(previous, resident, changed, options)` rebuilds
only affected halos from a complete post-update source snapshot and reuses other
halo objects. Pass the previous snapshot's options as `options.previousOptions`;
changes to the grid, height reference, or reconciliation tolerance require a full
rebuild. Include every arrival, replacement and eviction in `changed`; treat
shared result buffers as immutable. The function detects omitted arrivals and
evictions but cannot detect an omitted replacement. It does not update derivatives,
meshes or bounds on the caller's behalf.

`createTerrainFilteredPyramid` builds box-filtered **cell raster** levels with
valid-source and total-source counts. Odd edges are weighted by their actual
source sample counts; missing samples do not contribute to the average. These
filtered values are not conservative bounds and do not preserve ridges.

### Vertex-tile derivative halos

`createTerrainVertexTileHalos(tiles, options)` reconciles a same-resolution
vertex-tile snapshot and returns a copied grid with a one-vertex border around
each tile. The padded `field` can be passed to `HeightField` and
`createTerrainGradientGrid`; the original tile occupies columns `1..width` and
rows `1..height`. Border values come from resident edge and diagonal neighbors,
without extrapolation. `statuses` distinguishes `NOT_RESIDENT`, `NO_DATA`, and
`VALID` for every padded sample; `field.validity` marks only valid samples.
Rebuild halos after changing the resident snapshot. `getTerrainVertexHaloAffectedTiles`
identifies a conservative set of resident tiles to rebuild for arrivals, replacements
or evictions. Pass the tile width and height; two-vertex dimensions have a wider
dependency neighborhood because halo samples can themselves be shared. `maxSamples` bounds the
total padded sample count, and shared-height disagreement is checked by the
same reconciliation policy. This does not establish mixed-resolution halos.

Terrain-data, analysis, meshing, and query capabilities against the broader CPU/GPU terrain roadmap.


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

| Property | Description | Default |
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
| `'bilinear'` | Bilinear patch through four cell samples | All four must be valid by default; opt into nonzero-weight support with `noData: 'support'` | Analytic patch derivatives |
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

| Status | Value | Description |
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
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain';

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

The CPU implementation covers affine/geographic fields, tiled snapshots and incremental
updates, regular/adaptive meshes, indexed surface queries, analysis, contour/profile
processing, vertex reconciliation, conforming boundary seams and visual skirts. These
are bounded deliveries of the [terrain roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/terrain-roadmap.md).

GPU shader execution and CPU/GPU/rendering conformance, general first-impact
queries, reduced contact manifolds, solver integration and a global seam/LOD scheduler
remain separate work. Analytic controls and the regional independent DEM fixture
qualify their documented profiles; broader source-data accuracy and terrain
distributions require additional evidence.

## Geographic sampling

```typescript
import {GeographicHeightField} from '@math.gl/geospatial/terrain';

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
import {TiledHeightField} from '@math.gl/geospatial/terrain';

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
coalesced tile rows and adaptive meshes remain math.gl roadmap work. GPU kernels
and device resource management belong in luma.gl.

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
  from '@math.gl/geospatial/terrain';

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
bounded device page tables, shader conformance and graph adapters are subsequent
T3 work in luma.gl, not math.gl. math.gl contains CPU algorithms, numerical
contracts and renderer-independent data layouts; it does not contain shader code
or create GPU resources.

## Triangulated terrain surfaces

```typescript
import {TerrainSurface, createTerrainSurface} from '@math.gl/geospatial/terrain';

const surface = new TerrainSurface({
  positions: new Float64Array([0, 0, 0, 10, 0, 2, 0, 10, 3]),
  indices: new Uint32Array([0, 1, 2]),
  origin: [1000, 2000, 0],
  heightReference: 'local-survey'
});
const height = surface.sample(1002, 2003);
const hit = surface.intersectRay([1002, 2003, 100], [0, 0, -1], {maxDistance: 200});
const nearest = surface.nearest([1002, 2003, 100]);
const topology = surface.copyTopology();
// To query the exact regular triangulation of an existing HeightField:
// const surface = createTerrainSurface(field, {origin: [1000, 2000, 0]});
```

`TerrainSurface` accepts copied Float32/Float64 local XYZ vertices and a Uint16/Uint32
triangle list. Coordinates are local Cartesian meters, Z up. The optional XYZ
`origin` is a translation into world coordinates; use a local frame to retain
precision. `heightReference` is provenance only. `triangleCount` includes all input
triangles; `activeTriangleCount` counts those participating in queries.

An optional Uint8 `triangleValidity` mask excludes zero-marked triangles from all
queries and topology. Use it to exclude visual skirts or other nonphysical faces.
All vertex positions must be finite, including those of excluded triangles.
Active triangles need a finite, nondegenerate XY projection and finite gradients;
vertical walls belong in a general mesh API, not this 2.5D terrain surface.

Shared **indexed** edges must have at most two active incident triangles, with
opposite edge directions. Both globally clockwise and counterclockwise meshes
are accepted, as are disconnected components. Nonmanifold edges and inconsistent
shared-edge winding throw. Positions are not welded: coincident vertices with
different indices remain topologically distinct. This validates edge incidence,
not geometric self-intersections or manifoldness around every vertex.

`copyTopology()` returns detached `halfedges` and `boundaryHalfedges` arrays.
Halfedge `3 * triangleIndex + j` goes from source vertex `j` to `(j + 1) % 3`.
Its value is the opposite halfedge index, or -1 for a boundary/inactive edge.
`boundaryHalfedges` lists only active boundary edges, in input order; it is not
an ordered boundary-loop list. `copyData()` returns independent positions,
indices and triangle-validity arrays. Retain `origin` and `heightReference` when
reconstructing a surface from those arrays.

### Height and geometric queries

`sample(worldX, worldY)` evaluates planar barycentric heights, XY gradients and
upward contact normals. Its result extends `TerrainSample` with `triangleIndex`
and three barycentric weights in the original input vertex order. Overlapping
XY footprints are allowed: the highest local elevation wins; exact ties select
the lowest original triangle index. Uncovered XY locations (including holes and
points outside every triangle) return `NO_DATA`; this API does not infer a
rectangular domain or missing-tile residency. Invalid coordinates return
`INVALID_INPUT`; unrepresentable arithmetic returns `NUMERIC_ERROR`. Failure
results have zero numeric sample values, index -1 and zero barycentric weights.

`intersectRay(origin, direction, {maxDistance?})` returns the nearest two-sided
hit with original triangle index, metric distance, world point, upward normal
and barycentric weights. Direction magnitude does not change distance units.
`intersectSegment(start, end)` uses the same query on the closed segment, including
endpoints. A zero-length segment returns null. Coplanar rays do not produce hits.
`nearest(point, {maxDistance?})` returns the actual Euclidean closest point on an
active triangle, which can lie on an edge or vertex. It is not a vertical clearance
or signed-distance query. These methods return null when no result lies within
the inclusive distance limit; malformed inputs and result overflow throw.

Queries reuse `@math.gl/geometry` for BVH traversal and exact
triangle kernels. Contact normals always point upward, even for a ray from below;
they are not automatically oriented toward the query. Exact distance ties choose
the lowest original triangle index. Boundary decisions use floating-point triangle
arithmetic, not an exact-predicate or certified watertight intersection algorithm.
At shared edges, a mesh query's chosen one-sided normal can differ from
`HeightField`'s cell tie rule even when heights agree.

`createTerrainSurface(field, {origin?})` reuses `HeightFieldGeometry` with Float64
positions, preserving its diagonal, registration, missing-data holes and local
origin. Triangle IDs refer to emitted mesh order, not a stable cell identifier
across edits. General decoded triangle meshes can instead be passed directly to
`TerrainSurface`; loading/dequantizing file formats remains loaders.gl work.

### Bounded ray, segment and nearest queries

`intersectRayQuery(origin, direction, {maxDistance?, maxWork?})`,
`intersectSegmentQuery(start, end, {maxWork?})`, and
`nearestQuery(point, {maxDistance?, maxWork?})` return `{result, complete, work}`.
`result` has the same shape as the corresponding unlimited method. The segment distance
limit is always the endpoint distance; a zero-length segment completes with null and zero work.

```typescript
const query = surface.nearestQuery([1002, 2003, 100], {maxDistance: 50, maxWork: 256});
if (!query.complete) {
  // Defer, retry with more work, or apply the consumer's fallback.
  // Neither a provisional hit nor null is a final collision answer.
} else if (query.result) {
  // Use the final closest terrain point.
}
```

`maxWork` is Infinity by default, or a nonnegative safe integer. One unit visits a
BVH node (including child-bound ordering/pruning) or a leaf triangle (including its
bounds, mask and exact kernel). Rejected/skirt triangles consume visits too. Returned
`work` never exceeds the limit. Empty surfaces complete at zero work; nonempty surfaces
with zero budget are incomplete. The budget bounds traversal/refinement counts, not
wall-clock time, construction cost, or numeric error. There is no resumable cursor.
See the [shared index contract](../../geometry/spatial-index/README.md#bounded-queries).
The original ray, segment and nearest methods remain unlimited.

### Sphere contacts

`intersectSphere(center, radius, {maxWork?, maxContacts?})` returns the same completion
envelope, containing an array of `TerrainSphereContact` values. Coordinates are world XYZ
in meters and radius is finite and nonnegative. The sphere is closed: tangency counts,
and radius zero tests point contact. Contacts are sorted by original triangle index.

Each contact contains `triangleIndex`, closest terrain `point`, Euclidean `distance`,
`penetration = radius - distance`, `normal`, and `faceNormal`. The contact normal points
from the closest terrain feature toward the sphere center; it can be horizontal at an
edge or downward for contact from below. At exactly zero distance its direction is
ambiguous, so it falls back deterministically to the upward face normal. `faceNormal`
always retains that upward triangle normal. Normals and distances are computed in the
local frame before adding the world origin to output points. Results are detached.

```typescript
const contacts = surface.intersectSphere([1002, 2003, 20], 0.5, {
  maxWork: 512,
  maxContacts: 16
});
// Use as a complete candidate contact set only when contacts.complete is true.
```

`maxContacts` defaults to Infinity, or accepts a nonnegative safe integer. Finding an
additional contact beyond this capacity makes the list incomplete. Exactly filling
capacity can still complete after the remaining search rules out more contacts. An
incomplete list is an unspecified subset, not necessarily the deepest contacts.
The work budget includes closest-point tests and bounds the number of candidate tests;
the contact limit bounds retained results. Adjacent triangles may return duplicate or
coincident contacts. Masks exclude visual skirts before exact contact testing.

These are two-sided contacts with a zero-thickness triangle sheet, not a solid volume
below the terrain. A sphere wholly below and separated from that sheet has no contact.
This is a discrete query, not continuous collision detection: fast movement can tunnel.
Manifold reduction, material lookup, response/friction, timestep policy and first-impact
tests remain consumer or future work. No solver or shader is added.

### Segment clearance and capsule contacts

`nearestSegment(start, end, {maxDistance?})` computes minimum Euclidean separation along
the entire closed segment. `nearestSegmentQuery(start, end, {maxDistance?, maxWork?})`
adds the same bounded completion contract as other queries. The result is a `TerrainSegmentHit`:
original `triangleIndex`, `distance`, world terrain `point`, upward face `normal`, world
`segmentPoint`, and `segmentFraction` in [0, 1]. This differs from `intersectSegment`, which
returns the first ray intersection: clearance can be positive and considers coplanar overlap.
It also differs from vertical height-above-ground sampling. Ties between triangles use the
lowest original index. The unlimited method never silently truncates on a work limit.

`intersectCapsule(start, end, radius, {maxWork?, maxContacts?})` returns an envelope containing
`TerrainCapsuleContact[]`. Each contact has the sphere-contact fields plus `segmentPoint`
and `segmentFraction` for the closest point on the capsule's axis. The normal points from
the closest terrain feature toward that axis point; at zero distance it falls back to the
upward face normal. `penetration` is radius minus minimum separation. World-origin addition
happens after local distance/normal calculations. Both endpoints and the axis interior count;
two endpoint-only sphere queries are insufficient. Visual skirts remain excluded by the mask.

```typescript
const clearance = surface.nearestSegmentQuery(start, end, {maxDistance: 20, maxWork: 512});
const contacts = surface.intersectCapsule(start, end, 0.5, {maxWork: 512, maxContacts: 16});
// Require complete before treating either result as final.
```

Radius is finite and nonnegative. A point axis reduces geometrically to a sphere, and a
zero-radius capsule tests segment overlap. Work/capacity validation, incomplete-list behavior,
two-sided sheet semantics and possible duplicate contacts match the sphere API. Output arrays
are detached. A capsule can test the volume of a sphere translating on a straight path, but
`segmentFraction` is **not time of first impact**. It locates a minimizing pair and may be
nonunique. No first-impact, curved-path, rotating-capsule or solver response is implied.

The shared Float64 kernels normalize coordinates before geometric products, with analytic,
scale, degeneracy and exhaustive traversal tests. They are not exact or watertight-certified;
grazing and ill-conditioned cases remain subject to rounding. Use a local origin and check
completion. See the [kernel and numerical contract](../../geometry/spatial-index/README.md#segment-clearance-and-capsule-overlap).

## Conservative height-field bounds

```typescript
import {HeightFieldMinMax} from '@math.gl/geospatial/terrain';

const hierarchy = new HeightFieldMinMax(field);
const bounds = hierarchy.query(); // all cells
const region = hierarchy.query({minColumn: 0, minRow: 0, maxColumn: 1, maxRow: 2});
const root = hierarchy.copyLevel(hierarchy.levelCount - 1);
```

This immutable hierarchy covers `(field.width - 1) * (field.height - 1)` cells.
Level zero stores extrema of each cell's valid source corners; subsequent levels
reduce 2×2 children with min/max, never averaging. Odd dimensions and smaller
outer blocks are supported. A narrow ridge remains in every ancestor bound.
These bounds conservatively enclose bilinear and regular triangle interpolants
where those interpolants are valid; they do not describe filtered terrain or
exaggerated/displayed geometry unless built from those source values.

`query()` accepts an inclusive integer **cell-index** rectangle, not world XY or
sample indices. Out-of-range, reversed or fractional windows throw rather than
being silently clipped. It aggregates fully covered hierarchy nodes and refines
partial overlaps until the requested rectangle is exact. Results include:

- `heightRange`: valid source-corner minimum/maximum, or undefined if none exist.
- `cellCount`: the number of requested cells.
- `populatedCellCount`: cells with at least one valid source corner.
- `completeCellCount`: cells with all four source corners valid.

A populated cell need not contain a valid triangle or bilinear patch. Extrema may
therefore be conservative even around holes; coverage counts are not a substitute
for interpolation-specific validity checks. Adjacent cells share source corners,
but each cell is counted only once. `copyLevel(index)` returns detached finite
Float64 extrema, Uint32 cell-count arrays, dimensions and block size. Missing
nodes use zero placeholders and zero populated counts. No GPU resources or shader
code are created. Incremental hierarchy edits and hierarchy-based ray traversal
remain future work.

## Plain mesh data and optional tessellators

```typescript
import {createTerrainMesh} from '@math.gl/geospatial/terrain';
import {createMartiniTerrainMesh} from '@math.gl/geospatial/terrain';
import {createDelatinTerrainMesh} from '@math.gl/geospatial/terrain';
import {measureTerrainMeshError} from '@math.gl/geospatial/terrain';
import {getTerrainMeshEdge} from '@math.gl/geospatial/terrain';

const regular = createTerrainMesh(field);
const rtin = createMartiniTerrainMesh(field, {maxError: 1, fullEdges: ['maxColumn']});
const tin = createDelatinTerrainMesh(field, {maxError: 1});
const report = measureTerrainMeshError(field, rtin);
const boundaryVertexIds = getTerrainMeshEdge(rtin, 'maxColumn');
```

Bundlers can eliminate unused named exports: sampling-only bundles retain neither
tessellator, and selecting one backend excludes the other. These APIs return
plain detached buffers, with no renderer objects, normals, UVs, query indexes or physics
methods. `TerrainSurface` can consume the resulting data when those capabilities are needed.
No shader code is included.

`TerrainGridMesh` contains Float64 `positions` (local XYZ), Uint32 `indices` and
`gridCoordinates` (packed integer column/row per vertex), source `width`/`height`,
world `origin` and `heightReference`. World positions are local positions plus origin.
The default origin is `[field.origin[0], field.origin[1], 0]`; pass an explicit XYZ
origin to change it. Triangles wind counterclockwise in world XY even for flipped
or sheared grids. Cell registration places vertices at sample centers. Regular
meshes preserve the field's diagonal and omit triangles with missing corners;
unreferenced source vertices remain in their buffers. Builders reject coordinate
overflow or triangles collapsed by an unsuitable origin.

Both adaptive builders require complete data and a finite nonnegative `maxError`,
in the source height units (meters under the terrain contract). They return an
`AdaptiveTerrainMesh` with `error`, `requestedMaxError`, `refinementPasses` and
`tessellator`. MARTINI uses a pinned 0.2.0 RTIN backend and requires a square
`(2^k+1)` sample grid. Delatin uses the ISC backend transferred from loaders.gl
and accepts rectangular grids. It retains synchronous CommonJS support.

The adapters independently measure each candidate against all valid source nodes.
They refine candidates that fail measurement, for at most nine passes. MARTINI's
last pass forces the full RTIN; Delatin's last pass uses the regular grid and reports
`tessellator: 'regular'`. This is a **source-node vertical error bound**, not a
continuous bound against bilinear interpolation or the field's chosen diagonal.
A two-by-two saddle can have zero node error and nonzero interior error.

Both accept `maxSamples` (default 1,100,000), `maxTriangles` (default full-grid
triangle count), and `maxSampleTests` (default 10,000,000 per measurement pass).
Delatin additionally accepts `maxRefinements`, the maximum backend point insertions
(default sample count minus four corners); this does not limit the regular fallback.
Capacity/work exhaustion throws rather than returning an uncertified mesh. These
are admission, output and work limits, not exact peak-memory or elapsed-time limits.

MARTINI's `fullEdges` forces every source sample on selected sides, named
`minColumn`, `maxColumn`, `minRow`, `maxRow`. Adjacent same-resolution tiles with
matching samples and frames can choose different interior tolerances while sharing
these full boundary vertices. Delatin does not support forced edges. Neither API
implements mixed-resolution stitching, skirts, geomorphing or a tile scheduler.
`getTerrainMeshEdge` returns referenced vertex IDs sorted along the selected grid
side; grid sides are not geographic compass directions or general boundary loops.

`measureTerrainMeshError` validates the grid/frame correspondence, rasterizes
the stored XY triangles at source nodes, includes Z-origin rounding loss, and returns `maxSampleError`, `rmsSampleError`,
`coveredSampleCount`, `uncoveredSampleCount`, and `sampleTests`. Missing source
nodes are ignored; uncovered valid nodes are reported separately and must not be
interpreted as zero error. Overlaps use the worst residual per node. A finite
`maxSampleTests` bounds expanded triangle bounding-box sample visits. A conservative coordinate-roundoff
check rejects origins or ill-conditioned frames that cannot retain sample resolution;
use a local origin. One extra grid node around each bounding box accounts for XY
rounding when selecting candidate samples. Measurement does not
certify manifoldness, coverage between nodes, holes, or a continuous error bound.

### Migrating loaders.gl terrain meshing

Keep image decoding, elevation conversion, padding, tile bounds, UVs, skirts,
workers and mesh schema in loaders.gl. Pass its already decoded and padded heights
into `HeightField`, then call the selected math.gl tessellator. For an image of
`imageWidth` by `imageHeight` with one extra border sample, use field dimensions
`imageWidth + 1` and `imageHeight + 1`, vertex registration, `origin: [minX, maxY]`,
`columnStep: [xScale, 0]`, and `rowStep: [0, -yScale]`. Preserve the decoder's current
border policy: MARTINI duplicates the final row/column, while the existing Delatin
path leaves its padding at zero. Changing that policy is a separate loaders change.

Pass mesh `origin: [0, 0, 0]` if preserving absolute legacy positions. Convert
positions to Float32 only at the renderer/schema boundary and account for that
additional precision loss separately. UVs are `column / imageWidth` and
`row / imageHeight` from `gridCoordinates`. Indices already have correct world
winding. Independent error verification can refine beyond the old backend result;
byte-for-byte index identity is not promised. After adopting these APIs, loaders.gl
can remove its MARTINI dependency and vendored Delatin implementation. This math.gl
change does not modify loaders.gl itself.

## Raster gradients and slope/aspect

```typescript
import {createTerrainGradientGrid} from '@math.gl/geospatial/terrain';
import {getTerrainSlopeAspect, createTerrainSlopeAspectGrid} from '@math.gl/geospatial/terrain';

const gradients = createTerrainGradientGrid(field, {method: 'horn'});
const angles = createTerrainSlopeAspectGrid(gradients);
const orientation = getTerrainSlopeAspect(0.25, -0.5);
```

These are standalone functions, with no new methods on terrain classes. Stencil
calculation and angle conversion are independently tree-shakable. A selective
bundle does not retain mesh builders, query indexes, rendering classes, or the other calculation. Outputs are
owned typed arrays suitable for worker transfer and subsequent GPU upload; no GPU
resources or shader code are created.

`createTerrainGradientGrid` computes raster derivatives using `horn` (default;
weighted 3×3 differences) or `zevenbergen-thorne` (central differences). These are
**raster stencil estimates**, not derivatives of the selected interpolation patch.
Both require all nine source samples, including the center and diagonal neighbors.
The outermost sample ring gets `OUTSIDE_DOMAIN`; any missing sample in an interior
window gives `NO_DATA`. No edge extrapolation, hole filling, or halo fetch occurs.
Supply a larger height field containing the desired halo when boundary derivatives
are required. Arithmetic overflow gives `NUMERIC_ERROR`.

The output has `width`, `height`, packed Float64 `gradients` (`dz/dx`, `dz/dy`),
Uint8 `statuses`, the selected `method`, and the field's origin, steps, registration
and height-reference metadata. Values are zero for non-VALID statuses. The full
inverse-transpose affine transform maps index-space differences into world XY,
including reflected, rotated and sheared grids. Horizontal coordinates and heights
must share the metric Cartesian units of `HeightField`; geographic degrees need
an appropriate metric transformation first. `maxSamples` defaults to 1,100,000 and
is checked before output allocation.

`getTerrainSlopeAspect(gx, gy)` returns slope in radians from horizontal, and
downhill aspect in radians clockwise from world +Y in `[0, 2π)`. World +Y only
means north when the caller's frame makes it north. Nonfinite gradients throw.
An exactly flat surface has slope zero and `aspect: undefined`; no arbitrary
flat-aspect direction or flatness tolerance is imposed.

`createTerrainSlopeAspectGrid` accepts the gradient grid's dimensions, buffers and
statuses, validates them, and returns Float64 `slopes`/`aspects` plus copied Uint8
`statuses`/`aspectStatuses`. Flat samples retain VALID slope and get NO_DATA aspect.
Other source statuses propagate to both outputs; their numeric values remain zero.
Its `maxSamples` also defaults to 1,100,000. Conversion can be used independently
with caller-supplied gradients, without importing the stencil implementation.

The Horn and Zevenbergen–Thorne methods and flat-aspect distinction are also used
by [GDAL's terrain analysis](https://gdal.org/en/stable/programs/gdaldem.html).
This implementation uses radians and the explicit affine Cartesian frame above;
it does not reproduce GDAL's CRS scaling or optional edge interpolation. The
formulas are implemented here with analytic plane/polynomial and stencil fixtures;
no GDAL code or runtime dependency is included.

## Elevation profiles

```typescript
import {sampleTerrainProfile} from '@math.gl/geospatial/terrain';

const profile = sampleTerrainProfile(
  (x, y) => field.sample(x, y, {interpolation: 'triangle'}),
  [0, 0, 100, 0, 100, 50],
  {spacing: 5, maxSamples: 1000}
);
```

The first argument is a callback returning `{status, height}`. Bind a height field,
indexed surface or resident tiled snapshot and the desired interpolation policy in
that callback. `path` contains packed Cartesian XY vertices. Each nonzero segment
is divided evenly using `ceil(segmentLength / spacing)`: all corners and the final
endpoint are retained, and spacing is a nominal maximum within each segment,
subject to Float64 rounding. Samples are not placed on a global distance lattice.
Repeated consecutive vertices add no sample; a point or entirely repeated path
produces one sample. Coordinates are copied before callbacks execute.

Results contain packed Float64 XY `positions`, cumulative horizontal `distances`,
Float64 `heights`, Uint8 `statuses`, and total horizontal `length`. Missing statuses
propagate and numeric values remain zero. A VALID callback result with a nonfinite
height becomes NUMERIC_ERROR; invalid status codes and thrown callbacks cause an
exception. The function does not bridge missing terrain.

Finite positive `spacing` is required. `maxSamples` defaults to 1,000,000 and bounds
both input vertex count and planned output count before any callback executes.
Overflow, lost cumulative-distance increments, or sub-resolution repeated output
positions throw explicitly. This is a sampled profile: it does not find every
ridge or cell crossing, certify segment clearance, integrate surface length, or
compute geographic/geodesic distance. Use surface segment queries for clearance.

## Triangle-surface contours

```typescript
import {createTerrainContours} from '@math.gl/geospatial/terrain';

const contours = createTerrainContours(field, [100, 200, 300]);
```

This function extracts contours of the **regular fixed-diagonal triangle surface**.
It honors `field.diagonal`, registration and affine frame. It does not contour the
bilinear interpolant or an adaptive mesh, and those surfaces can differ on saddles.
A triangle with any missing corner is omitted, matching regular mesh creation.
No contour in an omitted area must not be interpreted as evidence of flat terrain.

Levels must be finite and strictly increasing; an empty list is allowed. The tie
rule separates strictly-below values from at-or-above values. Completely flat
triangles and point-only touches produce no segment. An exact level edge is emitted
when approached from a below-level triangle, and duplicate shared edges are removed.
Adjacent triangles reuse intersections by source edge or exact source vertex, per
level. Vertex intersections may form branches: the output is an undirected indexed
segment graph, not a collection of oriented or stitched paths. Plateau boundaries
are not generally complete polygon rings under this tie convention.

`TerrainContours` contains Float64 local XYZ `positions`, fractional column/row
`gridCoordinates`, Uint32 endpoint pairs in `segments`, a `levelIndices` entry for
each segment, a copied Float64 `levels` array, XYZ `origin`, and `heightReference`.
Origin defaults to `[field.origin[0], field.origin[1], 0]`; it can be overridden.
No normals, UVs, triangle mesh, stitching index or renderer objects are constructed.
Local origins preserve coordinate precision. Nonfinite output, unrepresentable
edge fractions, and collapsed output segments throw; results are Float64 numerical
geometry, not an exact-arithmetic or geometric-error certificate.

Admission limits are `maxSamples` (1,100,000), `maxLevels` (256), and
`maxTriangleTests` (10,000,000). The last bounds `levels × cells × 2`, counting even
missing triangles, before extraction. Output limits are `maxVertices` (2,000,000)
and `maxSegments` (1,000,000). Exceeding any limit throws instead of returning partial
geometry. Output arrays are detached; ordering is deterministic for the same input.
Path stitching and bounded simplification are separate entries described below.
Isobands, cross-tile joining and adaptive-mesh contouring remain future operations.

## Contour paths and bounded simplification

```typescript
import {stitchTerrainContours} from '@math.gl/geospatial/terrain';
import {simplifyTerrainContourPaths} from '@math.gl/geospatial/terrain';

const paths = stitchTerrainContours(contours);
const simplified = simplifyTerrainContourPaths(paths, {
  maxError: 0.5,
  maxDistanceTests: 1_000_000
});
```

Stitching traces maximal chains through degree-two vertices. Ends and junctions
terminate paths; remaining degree-two components become closed cycles. A loop
attached to a junction is also explicitly closed. Every input segment occurs in
exactly one output path. Connectivity is determined by vertex ID, never by a
coordinate tolerance: coincident vertices with different IDs remain separate.
There is no cross-tile welding, orientation selection, polygon filling or nesting
classification. Output ordering is deterministic for a fixed vertex/segment order.

`TerrainContourPaths` contains copied `positions`, `gridCoordinates`, `levels`,
`origin` and `heightReference`, plus:

- `indices`: Uint32 packed vertex IDs in path order.
- `offsets`: Uint32 path boundaries, beginning with zero and ending at indices.length.
- `levelIndices`: one Uint32 level ID per path.
- `closed`: one Uint8 flag per path. Closed paths repeat their first vertex at the end.

Empty graphs return offsets `[0]`. The stitcher validates typed-array shapes,
finite coordinates, strictly increasing levels, frame metadata, vertex/level
membership, and level heights. Duplicate edges, self-edges, collapsed XY edges,
and a vertex shared between different levels are rejected. A junction is not
arbitrarily paired into through-paths. Unreferenced input vertices are retained in
the copied vertex buffers so vertex IDs remain stable.

Both operations accept `maxVertices` (2,000,000), `maxSegments` (1,000,000),
`maxPaths` (1,000,000), `maxIndices` (2,000,000), and `maxLevels` (256).
Stitching checks input and output capacities. Simplification checks these input
capacities; its compacted output never has more vertices, indices or paths.
Limits are nonnegative integers within the Uint32 representation. Exceeding a
capacity throws, with no partial result. These bound element counts rather than
exact peak memory or elapsed time.

`simplifyTerrainContourPaths` uses iterative Ramer–Douglas–Peucker subdivision in
local XY. `maxError` is required, finite and nonnegative, in the metric coordinate
units of the contour data. It keeps open-path endpoints, vertices shared across
paths, and three deterministic anchors per closed path. Closed paths retain at
least three distinct vertex IDs and a closing repeated index. Coincident chord
endpoints force additional retained vertices to avoid zero-length output edges.
Caller-supplied paths must have consistent offsets/closure, nondegenerate adjacent
edges, and no repeated interior vertex IDs within an individual path.

The output has the same path data contract, compacted vertex buffers, and
`sourceVertexIndices` mapping each output vertex to its input vertex ID. It also
reports `requestedMaxError`, `maxDeviation` and `distanceTests`. The measured
maximum is the distance of discarded source vertices to their corresponding
replacement chord. This also bounds the linear source edges between those
vertices in ordinary Euclidean geometry, subject to Float64 arithmetic. Retained
vertices have zero displacement. Numeric overflow throws. `maxDistanceTests`
(default 10,000,000) bounds point-to-segment evaluations, including failed candidate
chords; exhaustion throws rather than returning an unfinished simplification.
The iterative implementation avoids call-stack growth on long paths.

This is a geometric approximation, **not topology-preserving simplification**.
New crossings, changed nesting, orientation changes or collapsed polygon area
are possible. A replacement chord need not follow the terrain's exact level set.
Do not use these paths as guaranteed valid isoband polygons or collision contours.
[CGAL's topology-preserving approach](https://doc.cgal.org/6.0/Polyline_simplification_2/index.html)
uses additional constraints to prevent intersections and nesting changes; those
capabilities remain future work here. No CGAL code or dependency is included.

The two entries import neither contour extraction nor each other. They operate on
plain data without terrain classes, tessellators or rendering dependencies.

## Profile measurements and coverage

```typescript
import {measureTerrainProfile} from '@math.gl/geospatial/terrain';

const measurements = measureTerrainProfile(profile);
// Check measurements.complete and coveredLength before interpreting totals.
```

This independent function measures the sampled piecewise-linear profile without
resampling terrain. It returns total horizontal `length`, `coveredLength`,
`missingLength`, covered/missing segment counts and `validSampleCount`. Only
intervals whose **two endpoints are VALID** contribute to covered measurements:

- `ascent` and `descent`: positive accumulated elevation gains and losses.
- `surfaceLength`: sum of `hypot(horizontal interval, elevation change)`.
- `heightIntegral`: trapezoidal height integral over covered horizontal intervals.
- `meanHeight`: distance-weighted mean over covered intervals, or undefined when
  none exist. It is accumulated separately so a tiny integral underflow does not
  automatically erase the mean.

`minimumHeight` and `maximumHeight` cover every valid sampled height, including
isolated samples. They are undefined if no sample is valid. Missing intervals are
not bridged, and no missing-height estimate is substituted. `complete` means every
sample is VALID: a valid single-point profile is complete, with zero interval
lengths and undefined mean; an invalid single point is incomplete even though its
missing length is zero. Extrema and total ascent describe the samples, not unseen
ridges or valleys between them.

The supplied cumulative `distances` are authoritative horizontal stationing. They
must begin at zero, increase strictly, and end at `profile.length`. XY positions
are validated but not used to recompute stationing, which may carry different
rounding. Buffer shapes, statuses and valid heights are checked; numeric overflow
throws. Non-valid heights are ignored. The function uses compensated accumulation
for totals and accepts `maxSamples` (default 1,000,000) as an admission bound.
Outputs are scalar values and do not mutate the profile. This entry does not import
the profile sampler or any terrain/query class.

## Vertex-tile reconciliation

```ts
import {reconcileTerrainVertexTiles} from '@math.gl/geospatial/terrain';

const reconciled = reconcileTerrainVertexTiles(tiles, {
  width: 257, height: 257,
  origin: [0, 0], columnStep: [30, 0], rowStep: [0, -30],
  heightReference: 'dataset-datum', maxHeightDifference: 0.01
});
// Each result has {column, row, field}; field is a detached HeightFieldProps value.
```

Each input has integer lattice `column`/`row`, a packed Float32/Float64 `heights`
array and an optional Uint8 `validity` array. All tiles have the declared dimensions,
metric affine steps and vertical reference. Tile origins advance by `width - 1`
and `height - 1` sample steps: the outer vertex rows/columns overlap. Cell-registered
rasters must be explicitly converted by the caller; they are not interpreted as
vertex tiles automatically. Addresses are local lattice coordinates, not XYZ tile IDs.

The result is sorted by `(column,row)`. At a shared vertex, the lexicographically
smallest tile owns the height, including four-way corners. The valid-copy height
range must fit `maxHeightDifference` (default zero). Any missing copy makes every
copy of that shared vertex missing; missing data is never filled from a neighbor.
Interior samples remain unchanged. Inputs are copied and never mutated. The result
reports the number of shared lattice vertices and maximum valid-copy disagreement.
An incomplete tile set is reconciled only against its present neighbors; reconcile
again when the set changes. Callers publish the returned set atomically.

`maxTiles` defaults to 4096 and `maxSamples` to 4,000,000 across all input tiles.
Invalid buffers, duplicate addresses, unsafe lattice arithmetic, excess disagreement,
and exhausted capacities throw before returning any result. The function imports
neither `HeightField` nor `TiledHeightField` at runtime. It does not provide tile
fetching, halos, cross-resolution resampling, or derivative continuity. Shared
heights remove positional disagreements; adjacent interpolants can still have
different slopes.

## Conforming mixed-resolution mesh seams

```ts
import {stitchTerrainMeshEdges} from '@math.gl/geospatial/terrain';

const stitched = stitchTerrainMeshEdges(coarseMesh, 'maxColumn', fineMesh, 'minColumn', {
  rangeA: [0, 0.5], // lower half of coarse grid side meets the full child side
  maxHeightAdjustment: 2
});
// stitched.a and stitched.b are detached meshes in coarseMesh.origin.
// seamA[i] and seamB[i] address exactly identical XYZ positions.
```

`TerrainSeamMesh` accepts plain positions, triangle indices, grid coordinates,
dimensions, origin and height reference. Existing regular/MARTINI/Delatin meshes
satisfy the input shape. Output grid coordinates are Float64 because inserted
boundary vertices can lie between source grid samples. These outputs can be
stitched again, or passed as positions/indices to surface consumers; APIs requiring
integer `TerrainGridMesh` coordinates do not accept them automatically.

`rangeA` and `rangeB` are increasing intervals in `[0,1]`, measured in ascending
row or column along the named grid side. Both default to `[0,1]`. Opposite spatial
orientations are detected. Ranges allow a coarse tile to meet multiple children;
missing range endpoints are inserted. Full-side mismatches in sample count and
non-power-of-two ratios are supported too.

Normalized knots separated only by reversal/range-normalization roundoff (within
eight scaled machine epsilons) reuse existing vertex identities. The function
rejects ambiguous matches that would collapse distinct vertices on the same side.
Existing grid coordinates are preserved, so reversed non-power-of-two results can
be stitched again without accumulating duplicate knots.

A owns the piecewise-linear XYZ profile. The function forms the union of edge
knots, samples that profile, inserts vertices, and splits adjacent triangles into
fans. B's boundary conforms to A. Interior vertex positions are retained, rebased
to A's origin. The output contains no seam skirts or degenerate connector triangles.
The original input meshes remain unchanged.

`maxHeightAdjustment` defaults to zero. The maximum difference between the original
edge profiles is checked at the union of knots, including inserted endpoints;
this bounds their vertical profile difference subject to Float64 arithmetic.
It is **not** a continuous error certificate for either tile interior or source DEM.
The displayed boundary triangles change, so recompute derived normals, bounds,
query indexes and renderer products. Fractional source grid coordinates support
UV reconstruction. Other per-vertex/per-face attributes are not transferred.

The selected input grid sides must be complete, unique, straight affine boundary
chains, with exactly one incident triangle per edge. Mesh triangles must have
positive nonzero XY area. Sides must have opposite interiors and equal height
reference labels. Holes on the selected side, mismatched endpoints, nonconforming
input sides and inverted output triangles are rejected. This validates the selected
boundary, not global mesh manifoldness. Arbitrary curved globe-space edges need
preparation in a suitable local planar frame.

`coordinateTolerance` is an absolute XY alignment tolerance (default `1e-8` in the
mesh's metric units). Limits default to 2,000,000 vertices and 4,000,000 triangles
per mesh, and 100,000 boundary vertices. Both input and output capacities are checked;
exhaustion throws without returning partial meshes.

For multiple seams, choose consistent authoritative profiles and shared corner
heights first. Publish all changed meshes together. A later stitch that changes a
previously shared vertex requires rebuilding the affected neighbors. There is no
implicit global seam scheduler, transition morph, normal smoothing or source-tile
mutation. A selective bundle retains no tessellator, terrain class or renderer.

## Independent DEM qualification

The committed GDAL DTED fixture and generated GDAL 3.9.3 Horn/Zevenbergen–Thorne
references exercise 925 valid samples per method, all missing/edge statuses,
adaptive-mesh nodal errors and same-level seams. Input provenance, preprocessing,
regeneration commands and tolerances are recorded in
[the fixture manifest](https://github.com/visgl/math.gl/blob/master/modules/geospatial/test/terrain/fixtures/README.md).
Normal Node and browser tests require no GDAL installation.

After building geospatial, `node scripts/qualify-terrain-dem.mjs` verifies the source
hash and outputs reproducible numerical residuals, mesh sizes and warm timing
observations. On the initial fixture, maximum slope residuals are below `6e-8`
degrees and circular aspect residuals below `2.3e-5` degrees. The suite uses a
low-relief regional DEM; mountainous/coastal datasets, continuous approximation
bounds, regional performance and GPU/rendering conformance remain separate work.

## Visual skirt geometry

```ts
import {createTerrainSkirt} from '@math.gl/geospatial/terrain';

const visualMesh = createTerrainSkirt(mesh, {height: 50});
// `visualMesh.positions` and `visualMesh.indices` include the skirts.
// `visualMesh.triangleValidity` excludes skirt triangles from terrain queries.
```

`createTerrainSkirt` accepts packed Float32 or Float64 local XYZ positions and
Uint16 or Uint32 triangle indices. It copies both inputs, retains the original
triangles, and appends vertical quads lowered by the positive `height` in position
units. Source triangles must be nondegenerate, counterclockwise in XY, and have
consistent manifold shared edges. Boundary directions are derived from triangle
winding, giving outward-facing skirt triangles around both outer boundaries and
holes. By default every boundary is skirted, including nodata holes.

To select only specific boundary segments, pass `edges` as packed Uint16/Uint32
vertex pairs. Pair order and direction do not determine winding. Every pair must
identify a distinct boundary edge; invalid, internal or duplicate edges are rejected.
An empty list adds no geometry. The builder does not guess tile-side membership,
generate seams or modify the physical surface.

`skirtVertexOffset` and `skirtTriangleOffset` identify the first appended vertex
and triangle. `sourceVertexIndices` maps each appended vertex to its original
vertex, allowing a consumer to copy UVs or other attributes. `triangleValidity`
contains one for each source triangle and zero for each visual skirt triangle;
pass it to terrain surface queries to exclude skirts. The returned local `bounds`
include the lowered vertices. Normals, UVs and other attributes are not generated.

The output preserves Float32/Float64 position precision. It preserves Uint32
indices, and promotes Uint16 to Uint32 whenever appended vertices would exceed
65,536 total vertices. A height too small to lower a vertex in the position type,
or one that would overflow, throws instead of emitting degenerate skirts.
`maxVertices` and `maxTriangles` default to 2,000,000 and 4,000,000 respectively;
both input and output are checked before a result is returned.

A selective named-import bundle retains no HeightField, tessellator, renderer or query index. Skirts hide visual gaps; they do not reconcile mismatched
heights or provide a collision surface.

### Sampling raster footprints and masked support

Sampling defaults to the sample-center domain and requires a complete interpolation
cell. Raster adapters can opt into two independent policies:

- `domain: 'footprint'` includes the outer half-cell margins of cell-registered
  fields and clamps them to the nearest sample. It does not extend the raster footprint.
  Vertex-registered fields keep their existing domain. Derivatives along a clamped
  grid axis are zero before transformation into world coordinates; normals describe
  that extended surface. At the clamp transition, the interior one-sided derivative is used.
- `noData: 'support'` lets bilinear heights ignore missing neighbors with exactly
  zero weight. Missing positive-weight support still returns `NO_DATA`; weights
  are never renormalized. Roundoff-sized grid-coordinate excursions snap to sample
  nodes, capped at one millionth of a pixel. Gradients still require a complete cell,
  so a valid height can have `gradientStatus: NO_DATA`.

Both options work with `HeightField.sampleBatch` and `GeographicHeightField.sample`.
`TiledHeightField` retains its halo/residency rules and rejects these policies. For example,
`field.sample(x, y, {domain: 'footprint', noData: 'support'})` lets a loader
adapter sample pixel-centered physical grids without reimplementing interpolation.
These policies do not fill holes, change vertical datums, or extrapolate slopes.

## Mixed-resolution contour graphs

`weldTerrainMixedContourTiles(tiles, options)` accepts vertex-registered contour
graphs with individual `width`, `height`, `spacing`, and minimum `column`, `row`.
Addresses are minimum coordinates in a common finest lattice, rather than tile
indices. Spacing is a positive power of two. Tile interiors must not overlap;
rectangular tiles and coarse tiles meeting multiple fine neighbors are supported.
All tiles must use the same affine world grid, height reference and contour levels.

The operation joins exact lattice intersections at the same contour level and
splits boundary-aligned segments at finer vertices before deduplicating shared
subsegments. `maxPositionDifference` bounds world XY disagreement at shared
vertices and subdivision points; it does not enable spatial-nearness matching.
Missing coverage and differing coarse/fine boundary intersections remain open.
Reconcile the source surfaces first when continuity is required. This graph
operation does not resample or modify terrain elevations.

`maxTiles`, inherited contour graph capacity limits, and `maxBoundaryTests`
(default 10 million, including tile-overlap admission checks) bound work and
output. Coordinates that lose fractional precision during lattice rebasing are
rejected. Output origin follows lexicographic tile order; output grid coordinates
use the common lattice. Compose the result with `stitchTerrainContours`.

The terrain sampling example includes a mesh lab with regular, MARTINI and
Delatin wireframes, an error slider, pinned DTED and analytical stress surfaces,
output buffer bytes, single-run build time and nodal error. Nodata is preserved
by the regular builder; adaptive builders require complete samples. The
`scripts/benchmark-terrain-meshes.mjs` benchmark reports warmed p50/p95 build
times separately from error measurement. Nodal measurements and these small
fixture timings provide neither continuous-surface certificates nor regional
throughput estimates.

### Mixed-resolution derivative halos

`createTerrainMixedVertexTileHalos(tiles, {maxSamples, maxTileTests})` prepares detached,
vertex-registered fields with a one-node border for `createTerrainGradientGrid` (Horn
or Zevenbergen–Thorne). Import it from `@math.gl/geospatial/terrain` or
`@math.gl/geospatial`; it does not bundle derivative, mesh or rendering code.

Each tile supplies `{column, row, spacing, field}`. Addresses are integer coordinates
in a common finest-level lattice, **not tile indices**; spacing is a positive
power of two in lattice units. All fields must describe the same affine metric
frame and height reference. Tile dimensions may differ. Results are sorted by
spacing, column, then row. Duplicate addresses at the same spacing are rejected.

The finest resident tile owns each requested point, including shared boundaries
and overlapping interiors. Equal resolutions use column/row order. Samples use
that owner's piecewise-linear triangle surface, including its diagonal. Exact nodes
are read directly; interpolated heights require only nonzero-weight support, so
neighboring nodata does not unnecessarily invalidate a valid node or edge. Nodata in
an owner never falls back to a coarser source. Status bytes use
`TerrainVertexHaloStatus`: 0 not resident, 1 nodata, 2 valid. No extrapolation or
hole filling occurs. Source buffers are unchanged. Missing stencils remain invalid.

Output fields have width/height increased by two, tightly packed Float64 heights,
validity masks and shifted origins. Original tile nodes occupy rows/columns 1
through the original dimensions. Compose with `new HeightField(tile.field)` and
`createTerrainGradientGrid`; crop to those nodes when consuming derivative grids.
Rebuild from the current tile snapshot after arrivals, evictions or edits.

The default limits are four million padded samples and ten million source-tile
containment tests. Exceeding either throws. These are bounded snapshot operations,
not a spatial index or incremental mixed-level cache. Plane gradients are exact
up to roundoff; curved surfaces can retain derivative differences across different
stencil resolutions. This API does not certify normal continuity or repair source
height discontinuities. The terrain sampling example includes an interactive seam
explorer for ratios, residency, nodata and derivative methods.

### Incremental mixed-resolution snapshots

`updateTerrainMixedVertexTileHalos(previous, resident, options)` creates a snapshot
when `previous` is null, then rebuilds only targets whose padded sample rectangle
intersects an edited, arrived or evicted source's old or new coverage. Results include
`rebuilt` and `removed` keys (`spacing/column/row`). Unchanged halo objects are shared.
Treat source descriptors, source buffers and returned snapshots as immutable; replace
the source descriptor after every edit, including validity or metadata edits. Supply
the complete current resident set. Ownership changes and diagonal neighbors are
included conservatively. All source frames and aggregate output capacities remain
validated, including when nothing is rebuilt. `maxDependencyTests` (default ten
million) bounds dependency comparisons separately from halo sampling work.

`updateTerrainMixedGradientGrids(previous, halos, options)` reuses derivative entries
by halo identity. Changing `method` rebuilds all entries. `maxSamples` bounds the
entire derivative snapshot (default four million), including reused grids. These
operations retain plain immutable snapshots; they do not mutate buffers or maintain
a persistent spatial index. Both are available through the two public terrain roots.

### Topology-preserving contour simplification

`simplifyTerrainContourPathsTopology(paths, options)` applies bounded RDP followed
by conservative exact-dyadic XY topology checks. Input crossings, overlaps and touches
without shared vertex IDs are rejected. Shared vertices and optional
`protectedVertexIndices` stay anchored; use those IDs for tile seam vertices.
Shortcuts must avoid other edges and must not sweep other vertices, preserving
component relationships and ring nesting. Proposed output edges are also checked
against each other. If any shortcut is unsafe, the whole result falls back to a
detached copy of the input (`rejected: true`, `maxDeviation: 0`). This conservative
policy favors correctness over maximal reduction. It does not construct polygons or
infer holes from contour direction. Every level participates in XY topology.

`maxTopologyTests` defaults to one million and throws on exhaustion; topology
validation is quadratic in edge count and intended for bounded batches. Existing
`maxDistanceTests` and contour capacities still apply. `topologyTests` and `rejected`
provide diagnostics. The simpler approximate API remains available independently.

### Elevation isobands

`createTerrainIsobands(fields, levels, options)` clips each valid regular-grid triangle
to successive elevation intervals and assembles footprint polygons. Inputs are
`HeightField` instances in a common affine metric frame; multiple fields must be
non-overlapping, conforming same-resolution patches with integral lattice origins.
Canonical shared edges cancel across tile boundaries. Mixed-resolution fields must
be reconciled before polygonization. Conflicting shared heights are rejected.

Output `positions` contains world XY pairs; `indices` and `offsets` delimit closed
rings, `bandIndices` identifies each ring's interval, and `parents` is -1 for an outer
ring or the containing outer ring's index for a hole. Outer rings are counterclockwise
and holes clockwise in world XY. Boundary edges follow domain limits and omitted
nodata triangles. This is the declared triangle surface, not bilinear interpolation.
Constant-height triangles at internal thresholds belong to the upper interval; the
last upper endpoint is included. Adjacent bands share their boundary geometry.

Options bound levels (default 256), input triangles (default two million), generated vertices (two million),
processed polygon edges (six times the triangle cap; twelve million by default)
and work tests (32 times the triangle cap; 64 million by default); exhausted budgets
throw. Budgets accumulate across bands, including cancelled internal edges; the
triangle cap is input admission, not a promise that every multi-band output fits the
other independent limits. Raise explicit limits for denser/more numerous bands.
Ring assembly uses deterministic angular routing at point contacts. Exact
conforming coordinates are required; no tolerance-based welding or extrapolation is
performed. Geographic wrapping, geodesic area and mixed-LOD stitching are separate work.

### Incremental mesh and hierarchy patches

`updateTerrainMeshes(previous, resident, options)` and
`updateTerrainBounds(previous, resident, options)` accept immutable
`{id, field: HeightField}` patches. Pass null to initialize, then the complete current
resident set. Replacing a field rebuilds that patch; unchanged fields retain their
mesh buffers or conservative `HeightFieldMinMax`. Evicted IDs disappear. Bounds retain
source-corner extrema and missing-coverage counts. Regular meshes retain nodata holes.

`updateTerrainGradientPyramids(previous, gradients, options)` composes with the mixed
halo/gradient snapshots, reusing pyramids by immutable gradient-grid identity. Both
methods and halo-neighbor changes therefore invalidate the appropriate pyramids.

Each function is independently tree-shakable through both geospatial entry points.
The default `maxSamples` is four million aggregate base samples, including reused
patches. Updates are **patch-granular**, rebuilding an edited patch internally; choose
patch dimensions to control dirty-region granularity. These functions do not perform
in-place sub-buffer updates or incremental adaptive tessellation. Keep snapshots and
buffers immutable while sharing them. The elevation-band/terrain-edit example shows
an editable patch, nodata holes, conservative extrema and a reused distant mesh.

### Indexed topology and path-local rejection

Contour topology validation now uses a static bounding-box hierarchy to narrow exact
edge predicates and swept-region vertex tests. Isobands use independent indexes for
patch overlap, height-range selection and ring-parent lookup. Broad-phase traversal
is charged to the existing work budgets; exact predicates and clipping still decide
geometry. Dense overlapping candidates can retain quadratic worst-case work.

`simplifyTerrainContourPathsTopology(paths, {maxError, rejection: 'path'})` restores
only unsafe paths, retaining safe reductions in other paths. The default `'batch'`
policy remains conservative whole-result fallback. Path-local fallback retains the
input vertex pool and identity source mapping so restored and simplified paths share
anchors. `maxDeviation` remains a conservative accepted-error bound. `rejected` means
at least one path was restored, not that all paths were restored.

### Dirty-window mesh regions and hierarchy updates

`TerrainDirtyWindow` uses inclusive **source sample** coordinates. Report every
height/validity change between immutable inputs; unreported edits cannot be detected
without a full scan. Changed dimensions/frame/diagonal/reference rebuild the state.

- `updateTerrainMeshRegions(previous, field, dirty, options)` divides a field into
  cell regions (`cellsPerRegion`, default 32). Edits rebuild only regions touching the
  dirty sample windows, including both sides of a shared boundary. Unaffected region
  objects and buffers retain identity. The snapshot records a common world `origin`. Region fields and mesh buffers use
  its local affine frame, with each mesh origin fixed at zero and sample positions
  computed directly from parent grid indices. Keep the common world reference
  separate when rendering/computing to avoid rounding region offsets into large
  absolute origins. Stream the region buffers as separate draw/compute regions.
- `updateTerrainMartiniMeshRegions` adds complete square power-of-two regions with
  fully refined boundaries. Dimensions must divide the configured cell size exactly.
- `updateTerrainDelatinMeshRegions` supports rectangular/partial edge regions.
  Independent adaptive boundaries require `stitchTerrainMeshEdges` for conformance.
  Both adaptive variants return null data for incomplete regions, without filling
  nodata, and rebuild all regions when `maxError` changes. They remain separate imports
  so regular updates do not load either adaptive backend.
- `updateTerrainBoundsRegions(previous, field, dirty, options)` updates source-corner
  extrema/counts near dirty samples and recomputes only affected ancestors. No averaging
  substitutes for conservative bounds.
- `updateTerrainGradientPyramidRegions(previous, grid, dirty, options)` updates derivative
  leaves and affected ancestors. Its dirty windows refer to **gradient-grid samples**;
  expand source-height edits by the stencil radius before calling it.

Pass null to initialize. Defaults bound samples at four million and dirty work at ten
million tests, with at most 100,000 windows. Region sample limits include duplicated
boundary vertices. Hierarchy arrays use copy-on-write per touched level; immutable
snapshots therefore still incur full copies of those arrays even though recomputation
is local. Unchanged levels are shared. Work limits cover dependency/stencil selection
and incremental recomputation; initialization is bounded by sample admission. Reuse
returned snapshots directly and treat all shared buffers as immutable. Returned
`rebuilt` indices and `updatedCounts` support upload/recomputation diagnostics.

Mesh error qualification admits only bounded affine construction roundoff (a few
ulps, capped at one billionth of a cell-axis step) when matching XY to the declared
grid. This permits equivalent parent-grid and region-offset coordinate calculations;
meaningful displaced/forged coordinates and insufficient-precision frames still throw.

### Persistent block hierarchies

`updateTerrainPersistentBounds(previous, field, dirty, options)` and
`updateTerrainPersistentGradients(previous, grid, dirty, options)` provide block-based
immutable hierarchies. Pass null to initialize. Dirty windows identify source-height
samples for bounds and gradient-grid samples for gradients; include stencil dependencies.
Report every height/validity/status change. Unreported edits are not discovered by
scanning the input. Metadata or block-size changes rebuild the hierarchy.

Each level stores width, height, blockSize, nodesPerBlock and plain blocks. A block has
its linear node offset/count, interleaved Float64 `values` and Uint32 `counts`. Bounds
values are minimum/maximum, with populated/complete source-cell counts. Gradient values
are weighted mean dz/dx,dz/dy, with valid/total original sample counts. Missing nodes
have zero value placeholders. `getTerrainHierarchyNode(level, column, row)` reads an
independent value/count pair; consumers can read individual block buffers directly.
Clone shared buffers before transferring/detaching them: direct transfer would invalidate
every snapshot sharing that block.

Updates copy each touched block once and share all untouched blocks. Level block
directories are shallow-copied when edited; this still has a directory-copy cost.
`stats.copiedBlocks`, `stats.copiedBytes` and `stats.updatedNodes` describe data-buffer
copies and recomputation. Initialization stats describe allocated output blocks, not
transient construction allocations. Metadata/input arrays and JS directories are not
included in copiedBytes. Keep every shared snapshot and buffer immutable.

Defaults admit four million base samples, 256 nodes per block and ten million
incremental work tests; dirty-window selection and ancestor updates share one budget.
Initialization is sample-bounded and may allocate flat temporary hierarchies. Block-size
changes and frame changes require full initialization. Block size trades copy locality
against directory overhead. This is separate from GPU resource management or uploads.

### LOD correspondence and morph preparation

`createTerrainLodMorph(fine, coarse, {ratio, coarseOrigin, maxSamples})` prepares
fine-node correspondence to the coarse regular triangle surface. Both fields must be
vertex-registered with matching height references and diagonals, and share an affine
frame. Ratio is a power of two >=2. `coarseOrigin` is an integer offset in fine-grid
sample units (default [0,0]), forward-validated against the coarse world origin.

Results include detached fine/coarse heights, vertical deltas, coarse fractional grid
coordinates and per-node `TerrainMorphStatus`: VALID, FINE_NO_DATA, COARSE_NO_DATA or
OUTSIDE_COARSE. The output retains a separate world origin and affine steps; it does
not bake world coordinates into vertex buffers. Default capacity is four million fine
samples. Coarse sampling uses only nonzero-weight triangle support, without extrapolation
or fallback through missing data. Displacement overflow throws.

`evaluateTerrainLodMorph(morph, factor)` is an independent CPU reference returning
heights and validity for a uniform factor in [0,1]. Invalid correspondence stays
unavailable even at factor zero; select source-only fallback explicitly in the consumer.
At factor one, a regular fine grid with the matching diagonal represents the coarse
triangle surface wherever correspondence is complete. Existing mesh builders can
consume the evaluated heights with the returned frame metadata.

`maxNodalDisplacement` measures valid vertical differences only; it is not a certified
continuous error or screen-space LOD bound. These APIs prepare a transition, not a
camera-driven LOD scheduler. Neighbor morph factors, pinned simulation domains,
normal recomputation and coordinated seam schedules remain consumer responsibilities.
No shaders or device resources are created in math.gl. The LOD/streaming explorer
shows ratios, morph endpoints, missing coarse support and a real-DEM tile replay.

### Coordinated tile transitions and mixed-resolution bands

`coordinateTerrainLodMorphs(tiles, options)` accepts `{column, row, spacing, morph,
factor}` tiles. Addresses are integer finest-lattice sample coordinates; spacing is
a positive power of two. Each morph has its own factor. All frames, height references
and diagonals must agree, and tile interiors must not overlap. Partial shared edges,
T junctions and multi-tile corners participate in a deterministic global policy:
the coarsest incident tile owns shared heights; column/row order breaks equal-level
ties. Shared validity is the intersection of incident triangle support. Missing
support is masked conservatively and never filled from a different source.

Output `tiles` contain detached vertex fields on the common unit lattice, with
`spacing: 1` and `sourceSpacing` recording input resolution. Interiors preserve their
sampled triangle surface except for the cells adjacent to reconciled boundaries.
`maxHeightAdjustment` reports the largest valid nodal change; `sharedSamples` counts
shared output incidences, including duplicate representations at incident tiles.
`origin`, `columnStep` and `rowStep` describe the common frame. Construct local vertex
XY from `(column+x)*columnStep + (row+y)*rowStep` and retain the world origin separately
when rendering, avoiding large-origin cancellation. Existing regular mesh builders can
consume the returned fields for a bounded reference transition surface.

This reference **densifies coarse tiles** to the declared finest lattice. It is intended
for bounded transition patches, qualification and preparation, not a sparse production
LOD scheduler. Default `maxSamples` admits four million expanded samples and `maxTests`
twenty million tests. Source metadata, output expansion, overlap discovery and per-node
work are bounded; excess throws before an output is returned. Uniform or independent
morph schedules are allowed. Shared heights agree at common knots; no normal-continuity,
camera-selection, continuous-error or cross-frame motion certificate is implied.

`createTerrainMixedIsobands(tiles, levels, options)` accepts the existing
`TerrainMixedVertexTile` inputs, constructs the same conforming reference surface, then
assembles elevation-band rings and holes with domain/nodata boundaries. Output matches
`TerrainIsobands`, with reconciliation diagnostics. `maxHeightAdjustment` defaults to
zero so source disagreements are rejected; explicitly budget desired seam adjustment
(or pass Infinity to acknowledge unbounded finite adjustment). Coordinated transitions
allow finite adjustments by default and report their measured maximum. The two APIs
therefore distinguish source analysis from intentional displayed-surface reconciliation.

Expanded triangle admission uses the polygonizer's `maxTriangles`; level/vertex/edge
limits also apply. Reconciliation and polygonization share one `maxTests` budget.
Matching diagonals ensure subdivision preserves complete coarse triangle interiors.
The reported bands describe the reconciled displayed surface, which can differ near
adjusted seams from each raw input DEM. Geographic wrapping and datum conversion remain
outside these local affine operations. The coordinated transition/band example shows
2:1/4:1 factors, shared corners and missing coarse support.


## Boundary fidelity qualification

The terrain example's **Mesh generation → Boundary qualification study** compares
current regular, MARTINI and Delatin meshes with pinned offline constrained references.
It separates nodal tolerance, sampled surface error, supplied-boundary height error,
interior crossings and missing/excess domain coverage. The Sierra study references
are labeled counterexamples: they preserve the intended planar domain but fail
independent nodal tolerance checks on triangle edges.

No constrained mesher or additional public API is introduced. See the
[qualification methodology and reproduction instructions](../../../../test/terrain-boundaries/README.md)
and [roadmap findings](../../../../dev-docs/terrain-roadmap.md).

### Adaptive meshing with nodata

`createValidDomainTerrainMesh(field, {maxError})` preserves the union of
valid regular triangles, including holes, isolated components and half cells.
Every boundary sample is retained. Refinement checks every source sample
incident to a valid triangle, including shared edges. Isolated samples with
no incident triangle do not define surface area.

The output includes detached positions, indices, sample-grid coordinates and
the achieved nodal error. Optional sample, triangle and sample-test limits
throw when exceeded. The tolerance applies at source samples.

### XYZ breaklines

`createBreaklineTerrainMesh(field, {maxError, breaklines})` accepts XYZ
segments in sample-index XY and the field's height reference. Fractional
coordinates place vertices between raster samples. Segments can share
endpoints with identical heights. Split crossings and T-junctions before
calling the mesher. Segments must lie in the valid domain.

The returned `breaklineEdges` buffer maps each input segment to its output
vertex pair. The mesher rejects source samples that conflict with the line
and requested tolerance. To give the line priority, set
`breaklinesOverrideSamples: true`. The result reports the number of samples
excluded from nodal certification under this policy. The valid raster
domain still determines coverage on both sides of each segment.

### Continuous mesh error bounds

`boundTerrainMeshError(field, mesh, options)` brackets the maximum absolute
vertical difference over the overlap of a mesh and a raster reference. Select
`reference: 'triangle'` for the field diagonal or `'bilinear'` for complete
cells. Each valid half cell contributes independently in triangle mode.
Mesh grid coordinates are authoritative and can be fractional. Mesh Z uses
the supplied origin and must share the field’s height reference.

The upper bound covers every point in the overlap, including triangle edges.
The lower bound is supported by the returned witness in sample coordinates.
Overlapping faces contribute independently. This measures error on the common
domain; use separate coverage diagnostics to detect holes or excess geometry.
A null upper bound indicates no surviving comparison boxes. At the depth
limit the bracket can remain wider than the requested gap. Exceeding the
box budget throws rather than returning an incomplete bound.

In Mesh generation, choose **Source triangles** or **Bilinear cells** under
**Continuous error reference** to compare this bracket with nodal error.
