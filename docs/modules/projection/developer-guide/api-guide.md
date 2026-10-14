# Choosing a CRS and projection API

The CRS APIs describe coordinates, prepare conversions, support rendering, or analyze
projection distortion. Choose the API for the question your application needs to answer.
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

Both APIs share fourth-order numerical differentiation and step/half-step agreement
checks, while retaining these different public contracts. Reciprocals of parallel and
meridional scales do not generally recover descriptor factors: rotated or sheared grids
require the full inverse Jacobian. Descriptor sampling returns `null` when unavailable
or numerically unresolved; invalid nonpositive computed scales raise an error.

## Keep coverage, rendering bounds and analysis domains distinct

| Concept | Coordinates | Meaning |
| --- | --- | --- |
| `CRSMetadata.areaOfUse` | Greenwich longitude/latitude degrees | Geographic coverage declared by the CRS definition. |
| `CRSDescriptor.renderingBounds` | Effective target coordinates | A finite rectangle enclosing the selected rendering reference surface. It is neither an altitude range nor a conversion-validity test. |
| `ProjectionRenderingProfile` | Native projection units and geographic radians | Projection-owned rendering envelope and normalization, adapted by the descriptor into effective units and axis order. |
| `ProjectionAnalysis.domain` | Geographic radians | An explicit application-qualified rectangle in which numerical analysis is attempted. The derivative stencil must fit inside it. |

Declared area of use may narrow the default rendering envelope. Neither envelope nor
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
