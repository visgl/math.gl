---
slug: /modules/projection/operation-selection
---

# OperationCatalog

Two coordinate reference systems can have several transformations between them.
A regional grid may be more accurate than a global approximation, but only within
its reviewed coverage and epoch range. `OperationCatalog` helps an application
choose among **operations it has supplied and reviewed**.

Import it from `@math.gl/projection/operations`. It is a separate, optional entry
point: ordinary projections, pipelines and the package root do not include it.
A retained browser ESM selector measures 6.3 KiB minified / 2.2 KiB gzip
(Node 24.14.0, esbuild, ES2020, gzip level 9); catalogue data and operation payloads
are separate application costs. Existing import sizes are unchanged.
Selection reads metadata and returns a payload. It does not create a projection,
preload an algorithm, fetch a grid or execute a transformation.

## Start with a reviewed operation

This runnable example selects a simple units conversion. The identifiers and
metadata are authored for the example; they are not an EPSG database record or a
claim about a real datum transformation.

```typescript
import {OperationCatalog} from '@math.gl/projection/operations';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';

const catalog = new OperationCatalog([
  {
    id: 'app:geocentric-metres-to-feet',
    sourceCRS: 'app:geocentric-metres',
    targetCRS: 'app:geocentric-feet',
    area: [-180, -90, 180, 90],
    epochRange: null,
    accuracyMeters: 0, // exact unit definition; floating-point rounding still applies
    provenance: {
      authority: 'application',
      version: 'unit-definitions-v1',
      reference: 'International foot: exactly 0.3048 metres'
    },
    operation: () => new ProjectionPipeline({
      input: {space: 'geocentric', units: ['m', 'm', 'm']},
      steps: [{type: 'unitconvert', xy: {from: 'm', to: 'ft'}, z: {from: 'm', to: 'ft'}}]
    })
  }
]);

const selected = catalog.select({
  sourceCRS: 'app:geocentric-metres',
  targetCRS: 'app:geocentric-feet',
  area: [10, 40, 20, 50],
  maxAccuracyMeters: 0
});
if (!selected) throw new Error('No reviewed operation covers this request');

const pipeline = selected.operation();
const coordinates = new Float64Array([10, 20, 30, 8]);
pipeline.projectFlatSync(coordinates, 4); // XYZ converted to feet; M stays 8
```

Select once for a batch, then use the existing [pipeline](./projection-pipeline.md)
or [projection](../developer-guide/projection-engine.md) APIs. Selection is a setup operation and
creates request metadata; it does not add work or objects to coordinate loops.

`OperationCatalog<T>` accepts any payload type `T`: an already prepared pipeline,
a projection configuration, a synchronous factory or an async factory that imports
algorithms. The returned payload has the same identity as the one supplied. Only
the application decides when to call it or await/preload its dependencies. Grid
registration and execution continue to follow the chosen engine's contracts.

## Describe the operation's limits

Every candidate requires these fields:

| Field | Meaning |
| --- | --- |
| `id` | Unique operation identifier within this catalogue |
| `sourceCRS`, `targetCRS` | Exact directed CRS identities agreed by the application |
| `area` | Conservative geographic coverage: `[west, south, east, north]` in degrees |
| `epochRange` | Inclusive decimal-year interval, or explicit `null` for no epoch restriction |
| `accuracyMeters` | Reviewed accuracy in metres, or explicit `null` for unknown accuracy |
| `provenance` | Nonempty `authority`, pinned `version` and source `reference` strings |
| `operation` | Application-owned configuration, prepared operation or factory |

`ballpark: true` marks an approximate fallback. It is rejected unless the request
explicitly permits ballpark operations. Omission means the application has declared
the candidate to be non-ballpark; the catalogue cannot determine this from equations.

`grids` lists required `{id, revision}` identities. The request's `availableGrids`
must contain **each exact pair**. Use a reviewed release identifier or content hash
for the revision, and declare availability only after preparing and validating that
asset for the chosen operation. Different revisions of the same grid do not match.
The catalogue does not inspect grid bytes, test interpolation coverage or download
missing assets. A required grid is never silently treated as optional.

Provenance is required metadata, not an authenticity check. Applications must review
source terms, pin definitions and assets, qualify the numerical implementation, and
supply comparable accuracy estimates. The catalogue does not verify signatures,
interpret licenses or certify the stated accuracy. No third-party database or model
files are included with this API.

The catalogue snapshots and freezes all selection metadata, including nested area,
epoch, grid and provenance values. Changing the original metadata after construction
does not alter a decision. The payload itself remains application-owned and is not
copied or frozen; changing its behavior requires the application to review it again.
Duplicate identifiers and malformed metadata throw during construction.

## Request full coverage

`select(request)` returns the best eligible `CoordinateOperation<T>` or `undefined`.
An empty catalogue also returns `undefined`. A malformed request throws rather than
being interpreted as a broad or approximate request.

A candidate must satisfy every gate:

| Gate | Selection rule |
| --- | --- |
| CRS identities | Exact string matches in the requested direction; no alias normalization, inverse synthesis or operation chaining |
| Area | Candidate contains the entire requested rectangle, including its boundary |
| Epoch | A bounded candidate requires a supplied epoch; its range must contain the entire requested epoch interval |
| Grids | All required identities and revisions are declared available |
| Accuracy | Known accuracy meets `maxAccuracyMeters`, if supplied; unknown accuracy requires an opt-in |
| Ballpark | Ballpark candidates require `allowBallpark: true` |

### Geographic area and the antimeridian

Areas use longitude/latitude degrees regardless of the input coordinates' units,
axes or geographic, projected or geocentric space. Prepare the geographic extent
separately; the catalogue does not derive it from a coordinate buffer.

Longitudes must be in `[-180, 180]` and latitudes in `[-90, 90]`, with south at most
north. West greater than east declares an eastward rectangle crossing the
antimeridian: `[170, -10, -170, 10]` is a narrow strip across the seam.
`[-170, -10, 170, 10]` covers the much larger complementary longitude interval.

`[-180, -90, 180, 90]` covers the world. Equal west/east values describe a meridian;
`[180, south, -180, north]` also describes the seam meridian, not the world. Point
requests are allowed, and `-180` and `180` identify the same seam. There is no implicit
longitude wrapping, tolerance expansion or pole-specific inference.

Coverage is rectangular. If a real operation has irregular coverage or holes, supply
conservative rectangles wholly within valid coverage, or perform additional validation
in the application. A bounding box around an irregular region is not a guarantee that
all coordinates inside it are supported. Split a batch explicitly when no single
reviewed operation covers it; the catalogue never chooses per-coordinate fallbacks.

### Epochs and accuracy

Pass `epoch: 2020.5` for one decimal-year epoch, or `epoch: [2010, 2025]` for a batch.
Both ends are inclusive. When an operation propagates between two epochs, the
request must include the full interval of source and target epochs that will be used.
No epoch is read from M, a CRS identifier or the current date. Static candidates with
`epochRange: null` accept any valid requested epoch, or its omission.

Unknown accuracy is excluded by default. `allowUnknownAccuracy: true` permits it
only when no numerical accuracy ceiling is requested: an unknown accuracy cannot
satisfy `maxAccuracyMeters`, even with the opt-in. Zero is a valid accuracy ceiling.
Accuracy values describe application-reviewed operation quality, not a measured
floating-point error bound or an assurance of global geodetic accuracy.

Eligible candidates rank in this fixed order:

1. Non-ballpark before ballpark.
2. Known accuracy before unknown accuracy.
3. Lower declared accuracy in metres.
4. Identifier order by JavaScript string code units, independent of insertion order and locale.

The catalogue does not invent an accuracy advantage for a smaller area, a more recent
revision or a particular operator type. Review candidate metadata and use explicit
quality policies when the application needs different eligibility constraints.

## Explain a selection

Use `inspect(request)` to see every eligible candidate and rejected candidate. It
returns `{selected, candidates, rejected}`; candidates are in the same rank order
used by `select`. Each rejection contains its `candidate`, all failed `reasons` and
all `missingGrids` and `missingModels`. Results and diagnostic arrays are frozen.

```typescript
const decision = catalog.inspect({
  sourceCRS: 'app:geocentric-metres',
  targetCRS: 'app:geocentric-feet',
  area: [10, 40, 20, 50],
  epoch: [2010, 2025],
  availableGrids: [],
  maxAccuracyMeters: 0
});
for (const rejected of decision.rejected) {
  console.log(rejected.candidate.id, rejected.reasons, rejected.missingGrids);
}
```

Reason codes, reported in fixed order, are `source-crs`, `target-crs`, `area`,
`epoch-required`, `epoch`, `grid`, `accuracy-unknown`, `accuracy`, `ballpark`, `coverage`, `source-metadata`, `target-metadata` and `model`.
Inspection does not probe an operation, invoke its factory or preload its payload.
Re-select explicitly when grid availability or the requested extent changes; an
already returned decision is not updated automatically.

## Scope and qualification

This API is a bounded selector over an application-provided list. It is not an EPSG
operation database, a parser for PROJ operation descriptions, a general GIS planner
or automatic dynamic-datum interpretation. It does not change the operation chosen
by `Projection`, `ProjectionTransform` or `ProjectionPipeline` unless the application
explicitly uses its returned payload.

Qualification includes a separate pointwise longitude-containment oracle for 2,401
arc pairs, seam/global/polar and inclusive-epoch cases, exact grid revisions, conservative
quality gates, insertion-order independence, immutable metadata and selected-factory
pipeline execution in Node and Chromium. Packed ESM/CommonJS and TypeScript consumers
check the public entry point. Bundle checks enforce that selection retains no projection,
parser, model or grid implementation and adds no code to existing imports.

See [independent validation](./independent-validation.md) for geodetic qualification
and [Performance](./benchmarks.md) for measurement guidance.

## Irregular coverage and frame/model identity

An optional `coverage` list supplies reviewed covered geographic rectangles
within the candidate's bounding `area`. The complete requested extent must fit
**one** cell. Holes and gaps are rejected. This conservative contract may reject
an extent crossing adjacent cells even if their union covers it; it never assumes
a bounding box covers an irregular model or reconstructs polygon topology.
Antimeridian and ±180° seam endpoints follow the existing area rules.

Optional `sourceMetadata` and `targetMetadata` have this shape:

```typescript
const sourceMetadata = {
  horizontalCRS: 'app:horizontal-v1', verticalCRS: 'app:height-v1',
  referenceFrame: 'app:dynamic-frame-v1', frameKind: 'dynamic' as const,
  frameEpoch: 2010
};
```

Static metadata omits `frameEpoch`; dynamic metadata requires a finite frame epoch
and a candidate with a bounded `epochRange`. Requests match every field exactly,
including presence. A metadata-bearing request cannot select a legacy candidate
that lacks those fields. Frame epoch identifies the reference frame; request
`epoch` is the observation epoch or whole propagation interval. These are distinct.
This metadata does not enable implicit dynamic WKT/PROJJSON interpretation or
choose/execute a deformation model.

Candidate `models` entries are `{id, revision, license, termsReference}`. All four
strings must be nonempty. Requests declare prepared exact identities through
`availableModels: [{id, revision}]`; changed revisions do not match. Grid and
model readiness are separate requirements. Terms record an application's review;
the selector does not interpret a license or certify rights. Coverage, metadata
and model lists are snapshotted and frozen with the existing candidate metadata.
`inspect` reports every failed constraint and missing exact model identity.

The [application qualification harness](./deformation-qualification.md#pinned-assets-and-reviewed-operation-metadata)
checks local asset hashes and those selection constraints before comparing supplied
independent coordinates. Physical authority, reference independence and real
model validation remain application responsibilities.
