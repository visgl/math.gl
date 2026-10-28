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
