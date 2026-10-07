---
slug: /modules/projection/operation-pipelines
---

# ProjectionPipeline

`ProjectionPipeline` composes a known coordinate operation from typed steps. Use it
when you need to choose the order of projection, datum and height operations yourself.
For ordinary CRS-to-CRS conversion, use [Projection or ProjectionTransform](../developer-guide/projection-engine.md).
A pipeline does not find an EPSG operation or select grids automatically.

```typescript
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

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

Each step accepts `inverse: true`, `omitForward: true` and `omitInverse: true`.
The omit flags skip that step in the corresponding coordinate methods; setting both
is an error. Both programs are checked for unit/space consistency and balanced stacks
at construction. The reverse program must end in the declared input space/units.

For ordinary steps, `unproject` reverses the step order and reverses
each step's direction, including steps that were already marked inverse. Skipping
steps or restoring saved ordinates can discard information: the reverse program is
not necessarily the mathematical inverse of the forward program.

| Step | Contract |
| --- | --- |
| `unitconvert` | `xy: {from, to}` and/or `z: {from, to}`; angular-to-angular or linear-to-linear only. A supplied Z conversion requires XYZ records. |
| `axisswap` | `order: [2, 1]`, `[-2, 1]`, or any signed permutation of three ordinates. Two-axis steps preserve Z; three-axis steps require XYZ. M stays untouched. |
| `projection` | `name` selects a registered plugin; `parameters` supplies its PROJ parameter strings/flags and ellipsoid geometry. Forward: geographic radians → projected metres. Inverse: projected metres → geographic radians. Z units stay unchanged. `ob_tran` requires an explicit `output` space/unit and matching `o_proj`. |
| `cart` | Geographic radians/metre height → geocentric XYZ metres. Optional `ellipsoid` accepts `ellps`, `a`, `b`, `rf`, `f`, or `R` string parameters; default WGS84. Requires XYZ. |
| `helmert` | Geocentric XYZ metres. `translation: [x, y, z]` is in metres, optional `rotation` is in arcseconds, and `scalePPM` defaults to zero. Rotation requires `position_vector` or `coordinate_frame` convention. Scale must be positive. Requires XYZ. `exact: true` uses a full rotation matrix and its mathematical inverse. Optional `rates` and `referenceEpoch` enable kinematic parameters; coordinate epochs are supplied separately. |
| `deformation` | Geocentric XYZ metres; a prepared `model`, explicit `sourceEpoch` (decimal year or `'coordinate'`) and fixed `targetEpoch` propagate a position through a prepared static or temporal deformation model. Requires XYZ. See [deformation models](./deformation-models.md). |
| `push` / `pop` | `components: [1, 2]`, `[3]`, or another nonempty selection of X/Y/Z. Independent nested stacks preserve values and units; inverse execution swaps push/pop. M and later ordinates are never stacked. |
| `hgridshift` | Geographic radians; `grids` names prepared `datumGrids`, in priority order. Preserves height. Uses the grid's forward/inverse shift methods. |
| `vgridshift` | Geographic radians/metre height; `grids` names prepared `verticalGrids`. Adds `multiplier * offset` in the forward direction. Multiplier defaults to **−1**, following PROJ. Requires XYZ. |

Projection parameters retain the existing plugin contract: numeric values are strings,
angular parameters use degrees or supported DMS/radian strings, and a flag can be
`undefined`. `over` permits the existing plugins' unwrapped-longitude behavior.
CRS metadata such as `datum`, `towgs84`, `units`, `axis`, `pm`, `nadgrids` and
`geoidgrids` is rejected on projection steps: express these operations as separate
steps. Use `cart` for geocentric conversion. The `ob_tran` helper can return geographic or projected coordinates; supply the
output contract explicitly as shown below. Custom projection plugins must honor
the radians/metres contract above.

Helmert defaults to the package's existing small-angle seven-parameter equations. Its
inverse applies the transposed small-angle rotation, matching PROJ's default
approximation; it is not an exact matrix inverse. `exact: true` uses full rotations,
transposes the complete matrix for the position-vector convention, and uses the
transpose/reciprocal scale for inverse execution. Choose the mode expected by your
transformation parameters; parameters fitted to a small-angle model should retain
the default. Kinematic parameters use explicit coordinate epochs as shown below. A separate [deformation step](./deformation-models.md) propagates coordinates between epochs;
time-varying model components remain outside this profile.

## Coordinate epochs and moving reference frames

Use a kinematic Helmert step when supplied reference-frame parameters include annual
rates. `referenceEpoch` is the decimal year at which the base parameters apply.
Translation rates are metres/year, rotation rates are arcseconds/year and `scalePPM`
within `rates` is ppm/year. Every parameter uses `base + rate * (epoch - referenceEpoch)`.
The rotation convention is required when either base rotations or rotation rates are
specified. `exact: true` also works with rates; choose the model used to fit the parameters.

```typescript
const movingFrame = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{
    type: 'helmert',
    translation: [0.0127, 0.0065, -0.0209],
    rotation: [-0.00039, 0.00080, -0.00114],
    scalePPM: 0.00195,
    convention: 'position_vector',
    referenceEpoch: 1988,
    rates: {
      translation: [-0.0029, -0.0002, -0.0006],
      rotation: [-0.00011, -0.00019, 0.00007],
      scalePPM: 0.00001
    }
  }]
});

const point = [3657660.66, 255768.55, 5201382.11, 8]; // XYZM; M stays 8.
const transformed = movingFrame.project(point, 2010.25);
const restored = movingFrame.unproject(transformed, 2010.25);

const coordinates = new Float64Array([...point, ...point]);
movingFrame.projectFlat(coordinates, 4, 2020); // One epoch for the entire batch.
const epochs = new Float64Array([2020, 2020]);
movingFrame.unprojectFlat(coordinates, 4, epochs); // Or one epoch per record.
```

These are explicitly chosen operations and parameter sets, following
[PROJ's kinematic Helmert contract](https://proj.org/en/stable/operations/transformations/helmert.html).
The example parameters do not select a CRS or establish an operation's area, validity
period or accuracy. Check those properties with the parameter provider. A Helmert
step changes the reference frame at the supplied observation epoch; it does not move
a coordinate from one observation epoch to another. Inverse execution uses the same
epoch and preserves the default small-angle inverse approximation unless `exact` is chosen.

`project` and `unproject` accept an optional decimal-year number as their second argument.
`projectTo` and `unprojectTo` accept it as their third argument, after the output.
Flat methods accept a number or `Float64Array`/`Float32Array` as their third argument,
after the stride. The `*Sync` and lazy methods have the same epoch arguments.
A pipeline containing rates requires explicit epochs in both directions, even when
rates are zero or a particular direction omits that step. Static pipelines require
none; supplying valid epochs leaves their results unchanged. An epoch on the step
or in M is never inferred or accepted as an observation time.

An epoch buffer is read-only during the call and contains one value per coordinate
record. Subarray views are supported, including non-overlapping views of shared
storage; overlap with the coordinate view is rejected before any records change.
SharedArrayBuffer wrappers can refer to the same memory even when they are different
objects. If both views are shared-backed, overlapping byte ranges are conservatively
rejected, including buffers that appear separately allocated. Disjoint byte ranges,
a single batch epoch, or an ordinary epoch buffer remain supported.
Wrong buffer types/lengths and a missing or invalid batch epoch are also rejected
before transformation. A non-finite per-record epoch or invalid time-adjusted scale
follows the usual partial-error contract: completed records stay transformed, and
the failing/remaining records stay unchanged. Use Float64 epochs for fractional-year
precision; Float32 epochs use their stored rounded value. Callers must keep borrowed
coordinate and epoch inputs stable until an asynchronous operation completes.

Prepared parameter snapshots cache the last epoch; repeated-epoch batches reuse
coefficients. Mixed epochs update coefficients without allocating per-record arrays
or objects. Empty batches accept an empty epoch buffer. Epochs remain separate from
M and are not converted between calendars or time units by this API.

## Save ordinates and choose direction-specific steps

Use `push`/`pop` to keep original heights during a horizontal datum operation, or to
sample a height grid in another horizontal frame while retaining the original X/Y.
For the latter, omit the redundant horizontal operation in each direction:

```typescript
const heightOnly = new ProjectionPipeline({
  input: {space: 'geographic', units: ['rad', 'rad', 'm']},
  datumGrids: {interpolationFrame: preparedHorizontalGrid},
  verticalGrids: {height: preparedHeightGrid},
  steps: [
    {type: 'push', components: [1, 2]},
    {type: 'hgridshift', grids: 'interpolationFrame', omitInverse: true},
    {type: 'vgridshift', grids: 'height', multiplier: 1},
    {type: 'hgridshift', grids: 'interpolationFrame', inverse: true, omitForward: true},
    {type: 'pop', components: [1, 2]}
  ]
});
```

Stacks are independent for X/Y/Z, nested, and local to a coordinate call. The flat
path reuses storage across records without allocating coordinate arrays per record.
Underflow and unbalanced stacks are construction errors, unlike PROJ's permissive
empty-stack behavior. Restoring X/Y from different coordinate spaces is rejected;
restoring both horizontal components together can restore their saved space/units.
There is no fourth stack: M remains an uninterpreted measure, separate from future epochs.

## Rotated geographic and projected coordinates

Register `obliqueTransformation` with its child algorithm and state its output
explicitly. Geographic output accepts degrees or radians; projected output is metres.
The `o_proj` parameter must match the registered child:

```typescript
import {obliqueTransformation} from '@math.gl/projection/projections/ob_tran';

const rotated = new ProjectionPipeline({
  input: {space: 'geographic', units: ['rad', 'rad', 'm']},
  projections: [obliqueTransformation('longlat')],
  steps: [{
    type: 'projection', name: 'ob_tran',
    parameters: {o_proj: 'longlat', o_lat_p: '45', o_lon_p: '-90'},
    output: {space: 'geographic', unit: 'rad'}
  }]
});
```

For a rotated Mollweide map, register `obliqueTransformation(mollweide)` and use
`o_proj: 'moll'` with `output: {space: 'projected', unit: 'm'}`. Ordinary projection
steps retain the geographic-radians/projected-metres contract. Lazy descriptors work
with the same output declaration and preload/synchronous behavior.

## Explicit grids and height operations

Prepare grids through the [grid adapters](./api-reference/datum-grids.md#convert-geoid-heights)
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

Use the same descriptors and shared implementation cache as `ProjectionTransform`.
Construction starts no imports; only projection names used by steps are preloaded.

```typescript
import {lazyUniversalTransverseMercator} from '@math.gl/projection/projections/lazy/utm';

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

## Reusable scalar outputs

`projectTo(coordinate, output, epoch?)` and `unprojectTo(coordinate, output, epoch?)`
reuse a preallocated number array, `Float32Array` or `Float64Array` and return that exact
output. Their bound `*Sync` counterparts never import and require preloaded implementations.
Epochs stay explicit; M is never used as time:

```typescript
const output = new Float64Array(4);
movingFrame.projectTo(point, output, 2010.25);
movingFrame.unprojectTo(output, output, 2010.25);
```

The input types, capacity, spare output, in-place identity, distinct-view overlap checks,
Float32 rounding/overflow and stable-storage requirements follow the
[engine's reusable-output contract](./api-reference/projection-engine.md#reusable-scalar-outputs).
The `/pipeline` subpath also exports `ProjectionCoordinate` and `ProjectionOutput`.
Pipelines reuse their working point and cached ordinate stack; nested calls use isolated
scratch. Existing `project` and `unproject` still return independently owned arrays.
Descriptor-backed `*To` calls return promises and snapshot input before loading. Keep their
output untouched until the promise settles; use `*ToSync` after preloading to avoid those
snapshots and promises.

## Typed arrays, validation and package boundaries

`projectFlat` and `unprojectFlat` accept `Float32Array` or `Float64Array` and a record
stride of at least two. Steps using height or geocentric Z require a stride of at least
three. M and all further ordinates are copied/preserved without validation or epoch
interpretation. Empty valid buffers are accepted.

Reuse a pipeline and use the flat methods to process large buffers in place.
Programs containing only unit/axis steps and at least one unit conversion use a
whole-buffer path. Pure axis programs retain general dispatch. Each step retains its original
multiplication or division and intermediate finite checks; steps are not combined
algebraically. Projection, grid, stack and datum steps retain the general runner.
General scalar/bulk calls share an instance-owned working point and a lazily cached
ordinate stack. Recursive hooks use independent storage; failures release the lease.
The cached stack remains allocated until the pipeline is collected.
Operations run in double precision; a Float32 buffer is rounded only on final
record output. Non-finite X/Y/Z and Float32 output
overflow are errors. Records completed before an error remain transformed; the
failing record and remaining records are untouched. `project` and `unproject` never modify
scalar input; the reusable-output methods can explicitly use that same object in place.

`/pipeline` exports the class and its types without the CRS engine, projection catalogue,
WKT/PROJJSON readers, grid decoders or proj4js runtime. Add plugins/readers explicitly.
The class is also available from the root barrel; ESM tree shaking keeps it out of
ordinary core, wrapper and projection bundles. CommonJS subpaths select APIs but do
not provide browser code splitting. See [bundle measurements](../developer-guide/projection-engine.md#tree-shaking-and-bundle-size).

## Qualified profile and remaining work

The source/generator/grid hashes and independent forward/inverse references are
checked in CI. Thirty-nine authored pipelines / 108 XYZM points cover units, axes, Mercator,
UTM, geocentric conversion, both static Helmert conventions, explicit inverse steps,
horizontal/vertical grid placement, exact rotations, nested stacks, skipped directions
and geographic/projected oblique output. Scalar and Float64 results are checked against
pyproj 3.7.2 / PROJ 9.5.1 in Node, Chromium, Firefox and WebKit; Float32 checks cover
final rounding on rounded inputs. These are fixture tolerances, not global accuracy
proofs or geoid-model accuracy claims. A separate kinematic corpus adds 12 pipelines /
48 coordinate/epoch pairs for approximate/exact rotations, both conventions, inverse
steps and a geographic-to-UTM height-preserving chain.

This is typed composition, not a parser for arbitrary `+proj=pipeline` strings. Unknown
operators and parameters throw instead of being skipped. Stack support covers X/Y/Z
with stricter balance validation; arbitrary operators, time-varying deformation components, automatic
EPSG operation lookup and dynamic CRS inference remain outside this profile.
Use the optional [operation catalogue](./operation-catalog.md) to choose among
application-reviewed pipelines before execution.


## Static Helmert batches

For a direction with exactly one active static `helmert` step, `projectFlat` and
`unprojectFlat` operate directly on the coordinate buffer using numeric locals.
Translation/scale, small-angle and exact rotations use the same arithmetic as
scalar calls. Both rotation conventions and inverse-oriented steps are supported.
The public API, Z/M handling, explicit epochs and partial failure behavior stay
the same; no additional option or preparation call is needed.

Mixed pipelines keep general execution. Single-stage time-dependent rates are also
optimized as described below. See the
[measurement guidance](./benchmarks.md#operation-pipelines-and-grids)
to compare your operation chain in both directions.


## Kinematic Helmert batches

A direction with one active `helmert` step with `rates` also runs directly over
Float32/Float64 buffers. Pass an explicit decimal-year observation epoch as the
third argument: a number applies to the whole batch; a `Float32Array` or
`Float64Array` supplies one epoch per record. M is preserved and never used as time.

```typescript
const coordinates = new Float64Array([4000000, 1000000, 4800000, 8]);
pipeline.projectFlatSync(coordinates, 4, 2020);
// Or provide one observation epoch per coordinate record:
pipeline.unprojectFlatSync(coordinates, 4, new Float64Array([2020]));
```

A constant batch prepares the epoch-adjusted coefficients once, after validating
the first coordinate. Mixed epochs use the same preparation and last-epoch cache
as scalar calls. Both rotation conventions, exact/small-angle rotations and
inverse-oriented steps retain scalar equation order, Float32 validation and
completed-record commits. A failing record and its tail stay untouched. Empty
buffers still validate the epoch argument but do not prepare adjusted parameters.
No new option, loading step or public API is required. See the
[pipeline benchmark commands](./benchmarks.md#operation-pipelines-and-grids).
