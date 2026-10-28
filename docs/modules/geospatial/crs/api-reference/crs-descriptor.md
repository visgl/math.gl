# createCRSDescriptor

Assemble a `CRSDescriptor` for an external backend from explicit metadata, prepared
converters and rendering policy. Importing this helper retains no native CRS parser,
projection catalogue, resolver, proj4js or WASM runtime in a tree-shaken bundle:

```typescript
import {createCRSDescriptor} from '@math.gl/geospatial/crs';
import type {CRSDescriptorOptions, CRSDescriptor, CRSConverter} from '@math.gl/geospatial/crs';
```

The helper can be used inside an application's `CRSEngine.getCRS()` implementation.
It does not prepare an operation, resolve identifiers, infer bounds or calculate
rendering derivatives. The backend must supply those decisions before construction.

## Options

| Option | Contract |
| --- | --- |
| `metadata` | Shared `CRSMetadata` from `@math.gl/geospatial/crs`: frame, backend projection name/parameters, ellipsoid, effective axes and component units, lossiness and optional area of use. |
| `converter` | Map of prepared `CRSConverter` objects. An own `WGS84` entry is required. Additional source keys are exact strings. |
| `renderingBounds` | Finite ordered XYZ envelope in target units and axis order. Zero width on an axis is allowed. This is a rendering policy, not an operation validity test. |
| `renderingScale` | Three positive finite factors, or a synchronous callback returning those factors or `null` when unavailable. Uses the existing [descriptor scale conventions](../../projection/api-reference/projection-engine.md). |
| `executionIdentity` | Optional immutable backend/operation/resource provenance; see execution identity below. |
| `signature` | Optional nonempty opaque identity. Defaults to `getCRSSignature(metadata)`. This does not fingerprint backend implementations or grid contents. |

Each converter supplies synchronous `from`, `to` and `normalize` operations:

- `from` converts source coordinates into the descriptor's target CRS.
- `to` converts target coordinates back into the source CRS.
- `normalize` applies the target's rendering normalization in source coordinates.
- Omit the output argument to return a number array; provide an output array or
  Float32/Float64 buffer to write into and return that exact storage.

`WGS84` always means longitude/latitude in degrees and ellipsoidal height in metres.
Backend adapters own input validation, domains, axes, height conversion, trailing
measure preservation, aliasing, output capacity and failure atomicity. A fourth
measure must not silently become a coordinate epoch.

## Ownership and failures

Metadata, bounds, constant scales and converter containers are copied and frozen.
Methods are captured with their original receiver. Backend closures and resources
remain backend-owned; keep them alive and their configuration stable while the
descriptor is used. A rendering-scale callback's result is validated and copied.

Malformed metadata/policy, missing methods, asynchronous results and replacement
output objects raise `TypeError`. Synchronous backend errors propagate unchanged.
Shape checks cannot prove numerical correctness or prevent side effects started
by an incorrectly asynchronous callback. They do not supply a CRS-equivalence or
cross-engine transformed-buffer cache key.

## Tested proj4js example

The [complete example](https://github.com/visgl/math.gl/blob/master/modules/geospatial/projection/examples/proj4-crs-descriptor.ts)
prepares a real proj4js converter for spherical equidistant cylindrical coordinates:

```typescript
import {createProj4CRSDescriptor} from './proj4-crs-descriptor';

const descriptor = createProj4CRSDescriptor();
const xy = descriptor.converter.WGS84.from([12, 55]);
const output = new Float64Array(4);
descriptor.converter.WGS84.from([12, 55, 123, 8], output);
descriptor.converter.WGS84.to(output, output); // In-place inverse; retains height/measure.
```

This bounded example projects XY and preserves height and measures. It supplies no
datum, vertical or epoch operation. Its rendering-scale callback returns `null`
instead of inventing a derivative policy; normalization is explicitly identity,
so the renderer remains responsible for seams and clipping. It is an example
descriptor provider, not a complete `ProjectionEngine` implementation.

The shared conformance tests exercise both a native descriptor and this proj4js
descriptor: independent coordinate anchors, inverses, XY/XYZ/XYZM, typed outputs,
in-place conversion, input ownership and failures before writes. Run them with:

```sh
yarn exec vitest run --project node modules/geospatial/projection/test/lib/external-crs-descriptor.spec.ts
```

proj-wasm's asynchronous public API cannot directly supply these synchronous
converters. Use it for definition resolution followed by native preparation, or
for separate asynchronous preprocessing. See [external engines](../../projection/developer-guide/external-projection-engines.md).

## Explicit projection domains

`createCRSDescriptor` accepts an optional `projectionDomain`, also constructible with
`createCRSProjectionDomain` from `@math.gl/geospatial/crs` or the geospatial root.
It describes a sampled validity boundary in the descriptor's target horizontal axes and units:

```ts
const projectionDomain = createCRSProjectionDomain({
  polygons: [{outer: [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]}],
  periodic: {axis: 0, minimum: -180, period: 360}
});
```

Each component has a closed `outer` ring and optional closed `holes`. Winding is unrestricted.
Components must have disjoint interiors; rings must be simple, with holes strictly inside their
outer ring and disjoint from other holes. Construction validates finite, closed, nondegenerate
rings and period arithmetic, then deeply snapshots and freezes the geometry. It does not prove
polygon topology or projection validity. Empty `polygons` mean an empty domain; an omitted
`projectionDomain` means the backend has not supplied one.

`renderingBounds` remain a rendering envelope, and `areaOfUse` remains geographic CRS metadata.
Neither is converted into a domain. A backend must supply hemisphere boundaries or interrupted
lobes explicitly, with sampling accuracy appropriate to its application. `periodic` describes a
canonical target interval and does not unwrap or clip geometry. Seam vertices may carry different
UVs and must remain distinct.

Domain changes do not change the CRS metadata signature automatically. Rebuild the descriptor and
invalidate derived geometry when projection parameters or domain sampling change; use a separate
application revision key where CRS metadata alone does not identify the prepared operation.
No external engine dependency is introduced, and native descriptors do not infer this field.

For native interrupted/composite maps, `MapEngine` already owns spherical clipping and sampled
region outlines. Keep using that map pipeline for source geometry. This descriptor field is an
interchange contract for prepared target-plane domains, including external backends; it does not
replace native map topology. Convert outlines only when their placements, holes and sampling
match the descriptor's target space, rather than treating layout frames as validity boundaries.

## Execution identity and cache invalidation

CRS `signature` describes CRS identity. It cannot establish that two engines, grid versions or
mutable callbacks produce interchangeable coordinates. `executionIdentity` is an optional,
caller-declared snapshot for this separate concern:

```ts
import {createCRSDescriptor, getCRSExecutionKey} from '@math.gl/geospatial/crs';

const descriptor = createCRSDescriptor({
  ...preparedOptions,
  executionIdentity: {
    backend: 'proj-wasm',
    version: '0.1.0',
    operation: 'selected-operation-with-visualization-axis-order',
    parameters: {centralMeridian: 0, strict: true},
    resources: {datumGrid: 'sha256:actual-content-digest'},
    revision: 'application-operation-and-domain-sampling-v1'
  }
});
const executionKey = getCRSExecutionKey(descriptor);
```

`createCRSExecutionIdentity` validates and freezes the same structure independently. Required
`backend`, `version` and `operation` strings must be nonempty. Optional `parameters` contain finite
numbers (except negative zero), strings, booleans or null; `resources` map names to nonempty immutable
content identifiers. Record key order does not affect the key. Optional `revision` is a nonempty
string for state not otherwise represented. Missing records behave like empty records.

The builder snapshots this data. The opaque, versioned execution key includes it, the CRS signature,
source-converter names and the explicit projection-domain geometry/period. Without execution identity,
`getCRSExecutionKey` returns **null**: keep caches local to that descriptor instance or disable reuse.
It never silently falls back to the CRS signature. Equivalent domain rings in a different order may
produce different keys; this is conservative invalidation, not geometric equivalence testing.

The application must identify **all** selected operations and callback state, including source-specific
pipelines, datum policies, coordinate epochs, algorithm builds, grid contents and domain sampling policy.
A URL or engine name alone is insufficient. math.gl does not inspect function bodies, read resource
files or attest that the declared identity is correct. Mutable engine changes require a new descriptor
and updated identity; changing the original options object does not update an existing snapshot.
Native descriptors do not yet automatically provide this provenance.

For a transformed-buffer cache, combine the execution key with source data revision, source CRS,
direction, dimensions and layout. For a derived-mesh cache, also include attributes, sampling tolerance,
rendering policy and view state. Rendering bounds/scales and arbitrary callbacks are not serialized by
this helper. In particular, changing a view-following projection's center must update its declared
parameters; changing zoom-dependent tessellation tolerance must update the mesh key. Never reuse a
pending worker result after its request's execution/mesh key is no longer current.
