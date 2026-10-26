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
tiled snapshots, indexed query surfaces and conservative bounds implement portions of the
[terrain roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/terrain-roadmap.md). Adaptive tessellation, swept-volume contacts and incremental hierarchy updates remain
math.gl roadmap work. Shader implementations
belong in luma.gl and rendering integration belongs in deck.gl. CPU tests use analytic planes/saddles and
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
bounded device page tables, shader conformance and graph adapters are subsequent
T3 work in luma.gl, not math.gl. math.gl contains CPU algorithms, numerical
contracts and renderer-independent data layouts; it does not contain shader code
or create GPU resources.

## Triangulated terrain surfaces

```typescript
import {TerrainSurface, createTerrainSurface} from '@math.gl/geospatial/terrain/surface';

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

Queries reuse `@math.gl/geometry/spatial-index` for BVH traversal and exact
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
import {HeightFieldMinMax} from '@math.gl/geospatial/terrain/bounds';

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
