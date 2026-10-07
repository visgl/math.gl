# Local frames

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

Use `@math.gl/core/local-frame` to rotate offsets or velocities between a local
**east, north, up (ENU)** frame and fixed Cartesian XYZ, or build a local-to-fixed
matrix. The numeric functions accept reusable storage and have no runtime imports,
CRS lookup, ellipsoid dependency or global angle setting. They are an optional
entry, absent from the core root.

```typescript
import {
  createLocalFrameBasis, eastNorthUpBasis, localToFixed, fixedToLocal,
  localFrameToMatrix
} from '@math.gl/core/local-frame';

const basis = createLocalFrameBasis(); // Allocate once, reuse for many points.
const velocity = {x: 0.01, y: 0.02, z: 0.03}; // ENU metres/year.
if (!eastNorthUpBasis(12 * Math.PI / 180, 55 * Math.PI / 180, basis)) {
  throw new Error('Invalid local-frame angles');
}
localToFixed(velocity, basis); // Same object, now fixed XYZ metres/year.
fixedToLocal(velocity, basis); // Transpose rotation back to ENU.

const matrix = new Float64Array(16);
const origin = {x: 3650000, y: 775000, z: 5200000}; // Fixed XYZ metres.
localFrameToMatrix(basis, origin, 'north', 'east', 'down', matrix); // NED.
```

## Basis and angle conventions

`LocalFramePoint` is `{x: number, y: number, z: number}`. A local point's x/y/z
mean east/north/up for rotations. A fixed point's x/y/z mean Cartesian XYZ.
`LocalFrameBasis` stores six numeric factors: `eastX`, `eastY`, `northZ`, `upX`,
`upY`, `upZ`. East's Z component is zero; north is up × east. Treat these factors
as one basis, rather than independent configurable matrix entries.

`createLocalFrameBasis()` returns setup storage initially oriented at zero
longitude and latitude. All other functions require caller-owned storage, return
`true` on a successful finite result, and create no coordinate arrays or objects.

`eastNorthUpBasis(longitude, latitude, result)` takes **radians**, independent of
`config._cartographicRadians`. Longitude is periodic, latitude must lie within
±π/2, and neither angle may be non-finite. At a pole, the supplied longitude
chooses the east/north orientation. The basis contains no translation or height.

`eastNorthUpBasisFromDirections(east, up, result)` retains the supplied directions.
The caller must supply unit, mutually perpendicular east/up vectors, with
`east.z === 0` and up's horizontal component pointing radially outward.
Finiteness is checked; these geometric preconditions are not certified by the
function. This lets an adapter preserve its normal convention without inferring
a different geodetic position.

## Rotations and units

`localToFixed(point, basis, result = point)` rotates ENU to XYZ without translating.
`fixedToLocal(point, basis, result = point)` uses the transpose rotation, which is
an inverse only when the basis satisfies the orthonormal preconditions.
Both capture numeric inputs before writing, support in-place use or separate
point output, and retain the input units. An offset in metres remains metres; a
velocity in metres/year remains metres/year. A coordinate position needs an
origin added separately.

## Matrices and ownership

`localFrameToMatrix(basis, origin, firstAxis, secondAxis, thirdAxis, result)` writes
a column-major affine 4×4 matrix. The first three columns are the selected signed
local axes; the last column is the fixed-space origin in its distance units.
`LocalFrameAxis` is `east | north | up | west | south | down`. Triples must use
three distinct dimensions and be right handed, such as ENU or north/east/down.
All 24 right-handed signed permutations are supported.

Use a growable `number[]`, `Matrix4`, or floating typed array with at least 16
elements. Only indices 0–15 are written; view boundaries and later elements remain
untouched. Float32 matrix overflow is checked before writing. Floating storage is
recommended; other numeric arrays apply their ordinary element conversions.

Failed finite/domain/axis/storage checks return `false` without modifying output.
Computed components are captured before application setters can recursively call
these helpers. Output storage must be writable; exceptions thrown by application
setters cannot be rolled back. Reuse scratch per owner rather than exposing mutable
shared basis objects to unrelated operations.

## Geospatial and deformation conventions

[Ellipsoid local frames](../../geospatial/api-reference/ellipsoid.md) derive up
from the Cartesian origin divided component-wise by the squared radii. Deformation
uses the normal at the inverse geodetic position. They agree on a sphere/oblate
surface, but can differ away from the surface. Sharing the numeric basis does not
change either convention.

Geospatial retains its Cartesian pole threshold and canonical east = +Y, its
historical singular center matrix, and its three-radius/prolate fallback.
Deformation rejects the center and retains its geocentric inverse's near-axis
longitude convention. The angular helper allows caller-selected longitude even
at exact poles. These conventions must be considered when comparing frames.

## Attribution

These helpers are original math.gl code. Existing CesiumJS-derived geometry and
proj4js-derived geocentric conversions retain their source attribution in their
respective files; no upstream implementation was copied into this entry.
