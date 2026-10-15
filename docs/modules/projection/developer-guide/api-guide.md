# Choosing a CRS and projection API

The CRS and projection APIs describe coordinates, select and prepare operations,
transform reusable buffers, apply grid and temporal corrections, support rendering,
and analyze projection distortion. Choose the API for the question your application needs to answer.
A CRS includes an ellipsoid, datum, axes, units and other conventions; a projection
algorithm supplies only part of that definition. Two CRSs can use Mercator and still
require a coordinate transformation between them.

## Which API should I use?

| Question | API | Why use it? |
| --- | --- | --- |
| What does the source say about its coordinates? | `SpatialReference` / `CRSReference` from `@math.gl/crs` | Preserve declared, defaulted, unknown or absent CRS information, provenance, storage order, vertical reference and coordinate epoch. |
| What resolved CRS information can I store or display? | `CRSMetadata` from `@math.gl/crs` | Describe the effective axes, units, ellipsoid and parameters without carrying conversion functions. |
| Which algorithms, readers and grids can my application use? | `ProjectionEngine` / `CRSEngine` | Configure reusable capabilities and create independent transforms or CRS descriptors. |
| How do I convert between two known CRSs? | `Projection` / `PreparedProjection`, implemented by `ProjectionTransform` | Prepare a source–target operation and reuse its scalar or buffer methods. |
| How do I control operation order? | `ProjectionPipeline` | Compose units, axes, projections, datum/grid corrections and epoch propagation explicitly. |
| Which reviewed operation covers this dataset? | `OperationCatalog` | Select by extent, epochs, accuracy and prepared asset revisions before executing a payload. |
| How do I reuse coordinate storage? | Scalar `*To` methods / `ProjectionBuffer` | Write into caller-owned outputs, padded records or separate coordinate columns. |
| How do I apply horizontal or height corrections? | `DatumGrid` / `VerticalGrid` and readers | Prepare correction data separately and register it with a transform or pipeline. |
| How do I move coordinates between epochs? | `DeformationModel` / temporal components | Apply reviewed velocity fields or source-position rates and events with explicit epoch bounds. |
| How do I configure a map around one target CRS? | `CRSDescriptor` | Retrieve metadata, prepared source converters, rendering bounds, explicit normalization and position-dependent sizing factors together. |
| How much does this map projection distort distance, area or angles? | `ProjectionAnalysis` | Evaluate the projection Jacobian, scales, convergence and distortion within an explicit geographic domain. |
| How do I register or defer loading an algorithm? | `ProjectionPlugin` / `ProjectionDescriptor` | Supply an implementation or a lightweight loader independently of any configured CRS. |
| How do I inspect the engine's resolved execution parameters? | `NormalizedCRS` | Access numeric unit factors, ellipsoid, datum and axis settings for low-level integration or analysis setup. |
| How do I define a projection's default display envelope? | `ProjectionRenderingProfile` | Let a projection implementation supply native rendering bounds and geographic normalization. |

These names describe different kinds of API. `Projection`, `PreparedProjection`,
`CRSEngine` and the descriptor types are contracts, not constructors.
`ProjectionTransform` and `ProjectionAnalysis` are runtime classes. Obtain a
`CRSDescriptor` through `engine.getCRS()`.

## Preserve source metadata before resolving a CRS

Use [`SpatialReference`](../../crs/api-reference/spatial-reference.md) at an ingestion
boundary. It records what a dataset actually declares, including the distinction
between an absent CRS and an explicitly unknown one. Its `coordinateOrder` describes
stored coordinates independently of the CRS definition's authoritative axis order.
`CRSReference` is the nested declaration, including its definition and provenance.

Resolution serves another purpose. `normalizeCRS()` from `@math.gl/projection/core`
produces a `NormalizedCRS`: resolved parameters, ellipsoid and datum information,
angular and linear conversion factors, and axis conventions used by the engine.
Use it when integrating low-level APIs, such as constructing `ProjectionAnalysis`.
Ordinary application code can let the engine resolve definitions during construction.
Normalization alone does not load algorithms or prove that a coordinate is convertible.

`CRSMetadata` is the serializable resolved view exposed by a descriptor. Keep the
original `SpatialReference` alongside it when provenance, unresolved states or epochs
matter: resolved metadata cannot replace that source record. A `CRSDescriptor` also
contains functions and should be prepared again in each runtime rather than serialized
as an executable object.

## Use a transform for a source–target operation

An engine owns the available algorithms, readers, named definitions and grids. A transform
owns one configured conversion. Reuse the engine across datasets and reuse each transform
across coordinates; changing a target CRS means preparing another transform.

```typescript
import {projectionEngine} from '@math.gl/projection';

const transform = await projectionEngine.createProjectionAsync({
  from: 'EPSG:4326',
  to: 'EPSG:3857'
});
const position = transform.project([12, 55, 100]);
const restored = transform.unproject(position);
const positions = new Float64Array([12, 55, 13, 56]);
transform.projectFlat(positions, 2); // Updates the supplied buffer.
```

[`Projection`](../api-reference/projection.md) is the backend-independent contract.
Its ordinary methods may return promises for deferred transforms.
`createProjectionAsync()` returns a `PreparedProjection`, whose ordinary conversion
methods are synchronous. `ProjectionTransform` is the built-in general CRS-pair
implementation. Prefer the contract when writing reusable application code.

Use a transform when conversion is all you need. For explicitly ordered operations
or coordinate propagation between epochs, see
[`ProjectionPipeline`](../api-reference/projection-pipeline.md); for choosing among
application-reviewed operations, see [`OperationCatalog`](../api-reference/operation-catalog.md).

## Compose a pipeline when operation order matters

Use [`ProjectionPipeline`](../api-reference/projection-pipeline.md) for an explicit
recipe, such as height correction in a particular horizontal frame followed by a
datum shift and map projection. A CRS-pair transform derives supported stages from
definitions; a pipeline lets the application state each stage and its order. It is
typed composition, not a parser for arbitrary PROJ pipeline strings.

```typescript
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';

const pipeline = new ProjectionPipeline({
  input: {space: 'geographic', units: ['deg', 'deg', 'm']},
  projections: [universalTransverseMercator],
  steps: [
    {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}},
    {type: 'projection', name: 'utm', parameters: {zone: '31'}}
  ]
});
const projected = pipeline.project([3, 52, 100]);
const restored = pipeline.unproject(projected);
```

| Steps | Use them to |
| --- | --- |
| `unitconvert`, `axisswap` | Make units and signed axis order explicit between stages. |
| `projection`, `cart` | Convert geographic radians to projected metres or geocentric XYZ metres; use `inverse: true` for the opposite direction. |
| `helmert` | Apply static or epoch-dependent geocentric reference-frame parameters, with an explicit convention when rotations are supplied. |
| `hgridshift`, `vgridshift` | Apply prepared horizontal shifts or height offsets at the current geographic location. |
| `deformation` | Propagate XYZ from an explicit source epoch to a fixed target epoch with a prepared model. |
| `push`, `pop` | Save and restore X/Y/Z ordinates, for example to preserve original height during a horizontal operation. |

Construction validates space/unit transitions and stack balance. `unproject` reverses
step order and direction; `omitForward`, `omitInverse` and restored ordinates can make
the reverse program different from a mathematical inverse. Projection steps accept
algorithm parameters, not CRS-level datum, axis or grid declarations: use separate
steps for those. `obliqueTransformation` requires an explicit output space/unit.

Eager pipelines have synchronous ordinary methods. Descriptor-backed pipelines return
promises from ordinary methods; `await pipeline.preload()` enables synchronous `*Sync`
methods. Reuse the prepared pipeline for scalar calls and typed-array batches.

## Select an operation before executing a batch

[`OperationCatalog`](../api-reference/operation-catalog.md), from `/operations`, filters
application-reviewed `CoordinateOperation<T>` records. Use it when several regional,
accuracy-limited or epoch-limited operations could convert a CRS pair. The payload can
be a prepared transform, pipeline, configuration or factory; selection never invokes it.
This example wraps the pipeline above and explicitly permits its unknown accuracy:

```typescript
import {OperationCatalog} from '@math.gl/projection/operations';

const catalog = new OperationCatalog([{
  id: 'example-utm31',
  sourceCRS: 'app:lon-lat-height', targetCRS: 'app:utm31-height',
  area: [0, 0, 6, 84], epochRange: null, accuracyMeters: null,
  provenance: {authority: 'application', version: 'example-v1', reference: 'example recipe'},
  operation: pipeline
}]);
const decision = catalog.inspect({
  sourceCRS: 'app:lon-lat-height', targetCRS: 'app:utm31-height',
  area: [2, 51, 4, 53], allowUnknownAccuracy: true
});
if (!decision.selected) throw new Error('No reviewed operation covers this request');
const selectedResult = decision.selected.operation.project([3, 52, 100]);
```

Use `select()` for the best eligible candidate or `inspect()` for ranked candidates
and rejection reasons. CRS identities match exactly in the requested direction; the
entire geographic extent and epoch interval must be covered. Optional `coverage` cells,
source/target frame metadata, `grids` and `models` impose additional gates. Declare
`availableGrids` and `availableModels` only after preparing exact `{id, revision}` assets.
Accuracy and provenance are application assertions, not measurements by the catalogue.
Eligible candidates rank by non-ballpark status, known/lower accuracy, then ID.

Selection does not normalize aliases, download data, synthesize inverses or chain
operations. Select once for a covered batch and reselect when its extent, epochs or
assets change. An absent result needs an explicit application decision.

## Reuse scalar outputs and coordinate buffers

Use `project`/`unproject` for independently owned result arrays. Use `projectTo` and
`unprojectTo` for a caller-owned number array, `Float32Array` or `Float64Array`; their
`*Sync` variants never start loading. For contiguous in-place coordinates,
`projectFlat`/`unprojectFlat` are the shortest path. `ProjectionCoordinate` and
`ProjectionOutput` describe scalar storage; `ProjectionArray` describes flat typed storage.

Use [`ProjectionBuffer`](../api-reference/projection-buffer.md) from `/bulk` when input
and output differ, records have padding, coordinates occupy separate columns, or work
is chunked. It captures a layout around a `BulkProjection` with synchronous reusable-output
methods. This continues the prepared transform from the first example:

```typescript
import {ProjectionBuffer} from '@math.gl/projection/bulk';

const pointOutput = new Float64Array(3);
transform.projectToSync([12, 55, 100], pointOutput);
const buffers = new ProjectionBuffer({
  projection: transform, dimension: 4, inputStride: 5, outputStride: 4
});
const input = new Float64Array([12, 55, 100, 7, 0, 13, 56, 200, 8, 0]);
const output = new Float64Array(8);
buffers.projectFlatTo(input, output, 2); // XYZM; input padding is omitted.
```

`projectColumnsTo`/`unprojectColumnsTo` accept one typed array per ordinate. Reuse the
adapter, arrays and column lists. Offsets and strides are elements; `start` and `count`
are records. Preload lazy transforms before nonempty adapter calls. Inputs and outputs
must be disjoint or have supported exact in-place mappings; shifted overlap is rejected.
Layout errors write nothing; a coordinate failure preserves the failing and later records,
while earlier records remain committed. M and later ordinates remain payload, never time.
Float32 rounds final output; prefer Float64 for small displacements on large geocentric
coordinates. See the reference for ownership, overflow and epoch-array rules and
[performance guidance](../benchmarks.md).

## Prepare horizontal and vertical grids separately

Grids supply data to transforms and pipelines. They neither choose an operation nor
load themselves from a CRS identifier. Use the [grid adapters](../api-reference/datum-grids.md)
to prepare data once, then register it under application-owned names.

| Correction | Public adapters | Where it is used |
| --- | --- | --- |
| Horizontal datum shift | `parseNTv2Grid` (`/grids/ntv2`), `loadGeoTIFFGrid` (`/grids/geotiff`) → `DatumGrid` | `datumGrids` with `+nadgrids`, or pipeline `hgridshift`. |
| Vertical/geoid offset | `createVerticalGrid`, `createGeoidGrid` (`/grids/vertical`), `parseGTXGrid` (`/grids/gtx`), `loadVerticalGeoTIFFGrid` (`/grids/vertical-geotiff`) → `VerticalGrid` | `verticalGrids` with `+geoidgrids`, or pipeline `vgridshift`. |
| ENU velocity | `createVelocityGrid` (`/grids/velocity`), `loadVelocityGeoTIFFGrid` (`/grids/velocity-geotiff`) → `VelocityGrid` | A deformation model, then a pipeline `deformation` step. |

GeoTIFF adapters consume separately decoded data and import no TIFF decoder. NTv2/GTX
readers consume file bytes. `createGeoidGrid` adapts a prepared `@math.gl/geoid` model;
`createVerticalGrid` snapshots regular metre offsets. Match the horizontal datum,
vertical reference, tide convention and coverage to the operation. The application
owns fetching, decoding, data terms and caching.

```typescript
import {ProjectionTransform} from '@math.gl/projection/core';
import {createVerticalGrid} from '@math.gl/projection/grids/vertical';

// Synthetic constant undulation, not a surveyed geoid model.
const local = createVerticalGrid({
  origin: [10, 50], step: [5, 5], size: [2, 2], offsets: [30, 30, 30, 30]
});
const heights = new ProjectionTransform({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
  to: 'EPSG:4979', verticalGrids: {local}
});
const ellipsoidal = heights.project([12, 52, 100]); // h = H + N = 130 metres.
```

A source geoid grid adds N to orthometric height before horizontal datum conversion;
a destination grid subtracts N afterwards. Pipeline `vgridshift` instead adds
`multiplier * offset`, defaulting to **−1**; set `multiplier: 1` for H → h. Grids
sample the longitude/latitude at their stage, so order matters.

Ordered grid lists, `@optional` names and an explicit `null` fallback express policy.
Missing required grids or uncovered coordinates fail; do not assume extrapolation or
implicit zero corrections. Grid interface sampling uses radians even where regular-grid
setup uses degrees. See the reference for format limits, nodata and subgrid behavior.

## Keep observation epochs, frame changes and propagation distinct

Use a kinematic `helmert` step for a reference-frame change **at an observation epoch**.
Its `rates` adjust base parameters relative to `referenceEpoch`. Pass the observation
epoch explicitly to scalar calls or as a constant/per-record epoch argument to flat
calls. This does not propagate a position between observation epochs.

Use [`createDeformationModel`](deformation-models.md) from `/deformation` to propagate
with a time-invariant ENU velocity field. `createVelocityGrid` accepts setup coordinates
in degrees and explicit `m/year` or `mm/year` values; its sampler returns metres/year.
`DeformationModel.forward`/`inverse` mutate a `ProjectionPoint` in ECEF metres, both using
the original source/target epoch pair. The following continues the pipeline imports above:

```typescript
import {createVelocityGrid} from '@math.gl/projection/grids/velocity';
import {createDeformationModel} from '@math.gl/projection/deformation';

const velocity = createVelocityGrid({
  origin: [-1, -1], step: [2, 2], size: [2, 2], units: 'mm/year',
  east: [1, 1, 1, 1], north: [0, 0, 0, 0], up: [0, 0, 0, 0]
});
const model = createDeformationModel({grid: velocity, epochRange: [2000, 2030]});
const propagation = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{type: 'deformation', model, sourceEpoch: 'coordinate', targetEpoch: 2020}]
});
const moved = propagation.project([6378137, 0, 0, 7], 2010);
const original = propagation.unproject(moved, 2010); // Original source epoch again.
```

This synthetic field illustrates wiring only. Supply a reviewed model, matching
ellipsoid/frame and inclusive `epochRange`. Geographic inputs need surrounding unit
conversions and `cart` steps. Deformation does not update the epoch argument seen by
other steps; frame changes requiring different observation epochs need separate calls.
Reversing the original map is not generally equivalent to sampling a negative duration
at the endpoint. Coverage and inverse convergence can fail.

Use [`createTemporalDeformationModel`](../temporal-models.md) from `/temporal` when steady
velocity is insufficient. It returns the same `DeformationModel` contract for the same step:

```typescript
import {createTemporalDeformationModel} from '@math.gl/projection/temporal';

const temporalModel = createTemporalDeformationModel({
  epochRange: [2000, 2030],
  components: [{
    id: 'steady-rate', field: velocity, units: 'm/year',
    timeFunction: {type: 'velocity'}
  }]
});
```

`TemporalDeformationComponent` combines a synchronous `DeformationField` with a
`TemporalFunction`: velocity (`m/year`), acceleration (`m/year^2` with `referenceEpoch`),
step (`m` with event `epoch`) or exponential relaxation (`m` with event `epoch` and
positive `timeConstantYears`). Fields receive radians and write finite east/north/up
amplitudes. All fields must cover the same source position, even for zero coefficients.
Components are summed there and rotated into ECEF; this is not trajectory integration.
The temporal reference details event boundaries, inverse solving and qualification.

Observation epoch, frame reference epoch and model validity interval are separate.
None is inferred from M, a CRS code or the clock. Use the catalogue's full source-to-target
epoch interval and exact model revisions when selecting operations, and
[qualify real model data](../deformation-qualification.md) independently.

## Use a CRS descriptor for a map's target CRS

`CRSEngine` extends the engine contract with `getCRS()`. The full, configurable and lazy
general engines implement it; a specialized pair-only engine need not.
A descriptor combines one resolved target CRS with prepared converters and rendering
conventions. It saves applications from assembling these pieces independently.

```typescript
import {lazyProjectionEngine} from '@math.gl/projection/projections/lazy';

const target = await lazyProjectionEngine.getCRS('EPSG:3857');
const converter = target.converter.WGS84;
const position = converter.from([12, 55, 100]);
const restored = converter.to(position);
const renderingBounds = target.renderingBounds;
const scale = target.getRenderingScale(position); // A triple, or null if unavailable.
const normalized = converter.normalize([372, 95, 100]);
```

A converter dictionary key identifies the source CRS. `from` converts that source to
the descriptor's target; `to` converts back. WGS84 is always prepared and uses
longitude/latitude in degrees and ellipsoidal height in metres. Request additional
source CRS strings through the `converters` option. Retrieval is asynchronous; returned
converter methods are synchronous and accept optional reusable output storage.

Normalization is an explicit rendering operation. It wraps or clamps a source
coordinate for the target's display convention; conversion never invokes it automatically.
See [descriptor retrieval and converters](projection-engine.md#retrieve-a-crs-descriptor)
for options and loading behavior.

## Choose rendering scales or projection analysis by their meaning

`getRenderingScale(position)` evaluates at a position in the **target CRS's stored
units and axis order**. For geographic and projected CRSs, it samples the complete
inverse transform to WGS84, retaining axis/unit adaptations and datum stages. Local
lengths use WGS84 curvature radii, with ellipsoidal-height changes included in the axis
lengths. The target projection may use a different ellipsoid or a sphere.

For projected CRSs, the factor in the vertical component is instead an isotropic
**rendering sizing convention**, derived from the square root of the inverse horizontal
area scale and expressed in the vertical unit. It does not convert physical altitude.
Use the component unit metadata and converters for height conversion. Geocentric and
identity descriptors have constant physical unit factors.

For example, EPSG:3857 at 60° latitude has rendering factors of approximately
`[0.501260, 0.500417, 0.500838]`, while its converter preserves a height of 100 metres.
Do not multiply that altitude by the rendering Z factor to interpret its physical unit.

[`ProjectionAnalysis`](../api-reference/projection-analysis.md) answers a mathematical
question about a **single projection**, rather than a complete CRS-pair operation:

```typescript
import {normalizeCRS} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {ProjectionAnalysis, createProjectionFactors} from '@math.gl/projection/analysis';

const crs = normalizeCRS('+proj=merc +ellps=WGS84');
const analysis = new ProjectionAnalysis({
  projection: mercator,
  context: {...crs.ellipsoid, parameters: crs.parameters},
  domain: {west: -1, east: 1, south: -1.2, north: 1.2}
});
const factors = createProjectionFactors();
if (analysis.factors(0.2, 0.6, factors)) {
  console.log(factors.parallelScale, factors.meridionalScale, factors.arealScale);
}
```

Analysis inputs and geographic domain bounds are in **radians**; the Jacobian reports
physical projected units per input radian. It excludes CRS unit/axis adaptation, prime
meridians and datum stages. Use it to compare distortion, inspect convergence or study
the local shape of a map projection. Supply the matching plugin and geometry, and choose
an application-qualified domain. A failed calculation returns `false` and leaves its
reusable output unchanged.

`ProjectionAnalysis.projectTo` and `unprojectTo` evaluate the single projection within its
domain using reusable point outputs. Use `jacobian` with `createProjectionJacobian()`
when you need derivatives directly; use `factors` with `createProjectionFactors()` for
cartographic scales and angles. `ProjectionDomain`, `ProjectionJacobian`,
`ProjectionFactors` and `ProjectionAnalysisOptions` describe these contracts.

Both APIs share fourth-order numerical differentiation and step/half-step agreement
checks, while retaining these different public contracts. Reciprocals of parallel and
meridional scales do not generally recover descriptor factors: rotated or sheared grids
require the full inverse Jacobian. Descriptor sampling returns `null` when unavailable
or numerically unresolved; invalid nonpositive computed scales raise an error.

## Keep coverage, rendering bounds and analysis domains distinct

| Concept | Coordinates | Meaning |
| --- | --- | --- |
| `CRSMetadata.areaOfUse` | Greenwich longitude/latitude degrees | Geographic coverage declared by the CRS definition. |
| `CRSDescriptor.renderingBounds` | Effective target coordinates | A finite XYZ envelope enclosing the selected rendering reference surface; consumers select axes from the effective axis order. It is neither an altitude range nor a conversion-validity test. |
| `ProjectionRenderingProfile` | Native projection units and geographic radians | Projection-owned rendering envelope and normalization, adapted by the descriptor into effective units and axis order. |
| `ProjectionAnalysis.domain` | Geographic radians | An explicit application-qualified rectangle in which numerical analysis is attempted. The derivative stencil must fit inside it. |

For projection implementations, `getRenderingProfile(coverage)` defines a rendering
target for the declared area of use. Coverage uses the same Greenwich degree convention
as `CRSMetadata.areaOfUse`: longitude endpoints lie in `[-180, 180]`, `west > east`
crosses the dateline, and `[-180, south, 180, north]` covers all longitudes. The engine
passes this coverage unchanged; each implementation interprets it using its own
conversion branch and prime meridian.

Declared area of use replaces the default rendering extent, with projection-owned clipping at unprojectable horizons. Neither envelope nor
area of use automatically becomes an analysis domain. A point inside rendering bounds
can still fail conversion, and a point outside them can remain mathematically convertible.

## Distinguish algorithm descriptors from CRS descriptors

`ProjectionPlugin` supplies an algorithm such as Mercator. Its `create(context)` method
initializes equations for the supplied ellipsoid and parameters. A
`ProjectionDescriptor` supplies an algorithm name, aliases and a deferred loader for
that plugin. Use these when configuring engine imports or adding custom algorithms;
neither represents a fully configured CRS or a source–target operation.

`CRSDescriptor` represents the resolved target and application-facing behavior.
Its `signature` is opaque identity under fixed engine conventions, not proof of arbitrary
CRS equivalence. It does not fingerprint custom algorithm implementations or grid
contents, so equal signatures alone cannot establish that packed coordinates are
interchangeable across engines.

For engine selection, plugin registration and lazy loading, continue with
[imports, plugins and loading](projection-engine.md).

## Choose imports and extension points

The public export map separates optional capabilities. The root is convenient for the
full built-in engine; it does not reexport every optional family. Use these entry points
when controlling dependencies or implementing an integration:

| Entry point | API and purpose |
| --- | --- |
| `@math.gl/projection` | `FullProjectionEngine`, shared `projectionEngine`, core contracts, eager algorithms/readers and `ProjectionPipeline`. A convenient built-in CRS engine. |
| `/core` | `ConfigurableProjectionEngine` / `createProjectionEngine`, `ProjectionTransform`, normalization, compatibility checks and extension contracts; register only needed capabilities. |
| `/types` | Runtime-free engine, transform and CRS descriptor contracts for application/backend boundaries. |
| `/web-mercator` | `WebMercatorProjectionEngine` for only WGS84/EPSG:4326 ↔ EPSG:3857, without general readers or datum machinery. |
| `/projections/<name>` | Individual eager algorithms, including `obliqueTransformation` for rotated coordinates; see the [projection catalogue](projections.md). |
| `/projections/lazy` and `/projections/lazy/<name>` | `LazyProjectionEngine`, `lazyProjectionEngine` and individual deferred descriptors. |
| `/parsers/wkt`, `/parsers/projjson` | `wktCRSParser`, `projJSONCRSParser` for supported structured CRS definitions. |
| `/datums` | `datumCatalog` and datum plugin types for regional definitions beyond the core defaults. |
| `/pipeline`, `/operations`, `/bulk`, `/analysis` | Explicit programs, reviewed selection, reusable layouts and single-projection differential analysis. |
| `/grids/*`, `/deformation`, `/temporal` | The independent grid readers and model constructors described above. |

The exported `/experimental` and `/native` paths remain compatibility aliases for
corresponding engine/projection/parser entries; prefer canonical paths for new code.
They do not select a separate native execution backend.

For custom integrations, `CRSParser` produces `ParsedCRS`; `DatumCatalogPlugin` supplies
`DatumDefinition` records; `ProjectionPlugin.create(ProjectionContext)` returns a
`ProjectionImplementation` operating on `ProjectionPoint`. Optional flat kernels use
`ProjectionFlatContext`/`ProjectionFlatOperation`. A rendering profile adds display
policy, while `DatumGrid`, `VerticalGrid`, `VelocityGrid` and `DeformationModel` supply
separate data/operation contracts. Keep these low-level native units distinct from the
stored units and axes handled by the CRS transform.

`createProjectionDescriptor`, `preloadProjection` and `getLoadedProjection` manage a
custom deferred algorithm's loader and implementation cache. Engine configuration
also accepts named definition aliases; registration remains local to the engine.
`checkProjectionCompatibility` reports construction support with the selected options;
`TypeScriptCRSError` and compatibility reasons support diagnostics. A successful check
is not a coverage, numerical accuracy or arbitrary CRS-equivalence test. See
[engine configuration and extension examples](projection-engine.md) and the
[engine factory reference](../api-reference/projection-engine.md).

A typical application preserves source metadata, prepares algorithms and grid/model
data, selects a reviewed operation if necessary, then reuses a transform or pipeline
through scalar or buffer APIs. A map can additionally obtain a target descriptor for
rendering conventions; projection analysis evaluates distortion separately.
