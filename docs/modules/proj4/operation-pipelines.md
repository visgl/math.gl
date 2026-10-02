# Explicit operation pipelines

`ProjectionPipeline` composes a known coordinate operation from typed steps. Use it
when you need to choose the order of projection, datum and height operations yourself.
For ordinary CRS-to-CRS conversion, use [Projection or TypeScriptProjection](./typescript-engine.md).
A pipeline does not find an EPSG operation or select grids automatically.

```typescript
import {ProjectionPipeline} from '@math.gl/proj4/pipeline';
import {universalTransverseMercator} from '@math.gl/proj4/projections/utm';

const pipeline = new ProjectionPipeline({
  input: {space: 'geographic', units: ['deg', 'deg', 'm']},
  projections: [universalTransverseMercator],
  steps: [
    {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}},
    {type: 'projection', name: 'utm', parameters: {zone: '31', ellps: 'WGS84'}}
  ]
});

const projected = pipeline.project([3, 52, 100, 7]);
const original = pipeline.unproject(projected);
const positions = new Float64Array([3, 52, 100, 7, 4, 53, 125, 8]);
pipeline.projectFlat(positions, 4); // Same buffer, XYZM records.
pipeline.unprojectFlat(positions, 4);
```

## Units and operation order

`input` declares a coordinate space and the stored X/Y/Z units. Units are `deg`,
`rad`, `m`, international `ft`, or `us-ft`. Geographic input has angular X/Y and
linear Z; projected and geocentric input have linear ordinates. Longitude and
latitude refer to Greenwich. Geographic equation steps expect longitude/latitude
order: use an axis step to put coordinates into that order first.

The constructor tracks units and spaces through the sequence and rejects incompatible
adjacent steps. `input` and the derived `output` are immutable snapshots. Units and
spaces do not identify a datum; choosing the appropriate ellipsoids and operations
is the application's responsibility. Changes to definition arrays, parameter records
and grid registrations after construction do not change the compiled operation.
Grid implementations remain application-owned objects.

Each step accepts `inverse: true`. `unproject` reverses the step order and reverses
each step's direction, including steps that were already marked inverse.

| Step | Contract |
| --- | --- |
| `unitconvert` | `xy: {from, to}` and/or `z: {from, to}`; angular-to-angular or linear-to-linear only. A supplied Z conversion requires XYZ records. |
| `axisswap` | `order: [2, 1]`, `[-2, 1]`, or any signed permutation of three ordinates. Two-axis steps preserve Z; three-axis steps require XYZ. M stays untouched. |
| `projection` | `name` selects a registered plugin; `parameters` supplies its PROJ parameter strings/flags and ellipsoid geometry. Forward: geographic radians → projected metres. Inverse: projected metres → geographic radians. Z units stay unchanged. |
| `cart` | Geographic radians/metre height → geocentric XYZ metres. Optional `ellipsoid` accepts `ellps`, `a`, `b`, `rf`, `f`, or `R` string parameters; default WGS84. Requires XYZ. |
| `helmert` | Static geocentric XYZ metres. `translation: [x, y, z]` is in metres, optional `rotation` is in arcseconds, and `scalePPM` defaults to zero. Rotation requires `position_vector` or `coordinate_frame` convention. Scale must be positive. Requires XYZ. |
| `hgridshift` | Geographic radians; `grids` names prepared `datumGrids`, in priority order. Preserves height. Uses the grid's forward/inverse shift methods. |
| `vgridshift` | Geographic radians/metre height; `grids` names prepared `verticalGrids`. Adds `multiplier * offset` in the forward direction. Multiplier defaults to **−1**, following PROJ. Requires XYZ. |

Projection parameters retain the existing plugin contract: numeric values are strings,
angular parameters use degrees or supported DMS/radian strings, and a flag can be
`undefined`. `over` permits the existing plugins' unwrapped-longitude behavior.
CRS metadata such as `datum`, `towgs84`, `units`, `axis`, `pm`, `nadgrids` and
`geoidgrids` is rejected on projection steps: express these operations as separate
steps. Use `cart` for geocentric conversion. The `ob_tran` helper is currently rejected
because its output can be geographic degrees or projected metres; this API does not
infer an output-unit contract for that helper. Custom projection plugins must honor
the radians/metres contract above.

Helmert uses the package's existing small-angle seven-parameter equations. Its
inverse applies the transposed small-angle rotation, matching PROJ's default
approximation; it is not an exact matrix inverse. Exact rotations, transformation
rates, observation epochs and time-dependent grids are not supported here.

## Explicit grids and height operations

Prepare grids through the [grid adapters](./typescript-engine.md#convert-geoid-heights)
and supply them to the pipeline. Fetching and decoding remain application-owned.
Grid names support ordered lists, `@optional` names and an explicit `null` fallback;
missing required grids and uncovered coordinates are errors.

```typescript
const withHeight = new ProjectionPipeline({
  input: {space: 'geographic', units: ['deg', 'deg', 'ft']},
  projections: [universalTransverseMercator],
  verticalGrids: {local: preparedGeoidGrid},
  steps: [
    {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}, z: {from: 'ft', to: 'm'}},
    // Orthometric H → ellipsoidal h before entering geocentric datum operations.
    {type: 'vgridshift', grids: 'local', multiplier: 1},
    {type: 'cart', ellipsoid: {ellps: 'intl'}},
    {type: 'helmert', translation: [1, 2, 3]},
    {type: 'cart', ellipsoid: {ellps: 'WGS84'}, inverse: true},
    {type: 'projection', name: 'utm', parameters: {zone: '31'}}
  ]
});
```

Place a destination height grid after the datum conversion and before the destination
projection. A vertical offset is sampled at that step's longitude/latitude, which may
differ from the source location. This preserves the explicit operation order described
by [PROJ pipelines](https://proj.org/en/stable/operations/pipeline.html) and
[vertical grid shifts](https://proj.org/en/stable/operations/transformations/vgridshift.html).

## Lazy projections and synchronous methods

Use the same descriptors and shared implementation cache as `TypeScriptProjection`.
Construction starts no imports; only projection names used by steps are preloaded.

```typescript
import {lazyUniversalTransverseMercator} from '@math.gl/proj4/projections/lazy/utm';

const lazy = new ProjectionPipeline({
  input: {space: 'geographic', units: ['deg', 'deg', 'm']},
  projections: [lazyUniversalTransverseMercator],
  steps: [
    {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}},
    {type: 'projection', name: 'utm', parameters: {zone: '31'}}
  ]
});

const result = await lazy.project([3, 52]); // Imports UTM on the first request.
await lazy.preload();
const immediate = lazy.projectSync([3, 52]);
```

Eager plugin lists provide synchronous `project`, `unproject`, `projectFlat` and
`unprojectFlat`. Lists containing descriptors provide promises, even after loading.
The `*Sync` methods always run synchronously and never import; they throw if a
required implementation has not been preloaded. Preloading the descriptor directly
also enables these methods. Concurrent requests share imports, and failed imports
can be retried. Unrecognized algorithm-specific parameters on unloaded descriptors
are rejected when the implementation is available.

## Typed arrays, validation and package boundaries

`projectFlat` and `unprojectFlat` accept `Float32Array` or `Float64Array` and a record
stride of at least two. Steps using height or geocentric Z require a stride of at least
three. M and all further ordinates are copied/preserved without validation or epoch
interpretation. Empty valid buffers are accepted.

Built-in mutable equation and grid hooks use one scratch point per call and no
intermediate coordinate arrays per record. Custom legacy plugin/grid methods may
allocate their own arrays. Operations run in JavaScript double precision; a Float32
buffer is rounded only on final record output. Non-finite X/Y/Z and Float32 output
overflow are errors. Records completed before an error remain transformed; the
failing record and remaining records are untouched. Scalar input is never modified.

`/pipeline` exports the class and its types without the CRS engine, projection catalogue,
WKT/PROJJSON readers, grid decoders or proj4js runtime. Add plugins/readers explicitly.
The class is also available from the root barrel; ESM tree shaking keeps it out of
ordinary core, wrapper and projection bundles. CommonJS subpaths select APIs but do
not provide browser code splitting. See [bundle measurements](./typescript-engine.md#tree-shaking-and-bundle-size).

## Qualified profile and remaining work

The source/generator/grid hashes and independent forward/inverse references are
checked in CI. Twenty-one authored pipelines / 54 XYZM points cover units, axes, Mercator,
UTM, geocentric conversion, both static Helmert conventions, explicit inverse steps,
and horizontal/vertical grid placement. Scalar and Float64 results are checked against
pyproj 3.7.2 / PROJ 9.5.1 in Node, Chromium, Firefox and WebKit; Float32 checks cover
final rounding on rounded inputs. These are fixture tolerances, not global accuracy
proofs or geoid-model accuracy claims.

This is typed composition, not a parser for arbitrary `+proj=pipeline` strings. Unknown
operators and parameters throw instead of being skipped. PROJ `push`/`pop`, omitted
forward/inverse steps, arbitrary operators, epochs, automatic EPSG operation selection
and dynamic datums remain outside this profile. See the [remaining roadmap](./roadmap.md).
