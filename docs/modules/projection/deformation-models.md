# Propagate coordinates between epochs

A velocity model describes how a position changes over time within a reference
frame. Use a `deformation` pipeline step to propagate coordinates from an explicit
source epoch to a target epoch. A kinematic Helmert step instead changes the
reference frame at an observation epoch; these are separate operations.

The current profile supports a time-invariant, bilinearly interpolated east,
north and up (ENU) velocity field. It applies the displacement in Earth-centred,
Earth-fixed (ECEF) XYZ metres. Choose the model, ellipsoid, reference frame and
validity interval appropriate to your data; a CRS code alone does not select them.

## Prepare a model

```typescript
import {createVelocityGrid} from '@math.gl/projection/grids/velocity';
import {createDeformationModel} from '@math.gl/projection/deformation';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';

const grid = createVelocityGrid({
  origin: [-1, -1], // Southwest node, longitude/latitude degrees.
  step: [2, 2],
  size: [2, 2],
  units: 'mm/year', // Required: 'mm/year' or 'm/year'.
  east: [1, 1, 1, 1],
  north: [2, 2, 2, 2],
  up: [3, 3, 3, 3]
});
const model = createDeformationModel({
  grid,
  epochRange: [2000, 2030] // Inclusive, application-reviewed decimal years.
  // Default ellipsoid: WGS84. Optional {semiMajorAxis, flattening} must match the grid.
});
const propagation = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{type: 'deformation', model, sourceEpoch: 2010, targetEpoch: 2020}]
});
const moved = propagation.project([6378137, 0, 0, 7]);
const restored = propagation.unproject(moved); // Uses the original epoch pair.
```

This small model is an illustrative constant velocity field, not an authoritative
geodetic dataset. Supply your own reviewed model for production transformations.
To work with longitude/latitude, surround the step with degree/radian unit
conversions and forward/inverse `cart` steps using the model's ellipsoid. Projection
steps can then convert the propagated location to a projected CRS.

Node values are copied during preparation, in rows from south to north and columns
from west to east. Longitude wrapping handles grids crossing the antimeridian.
Edges are inclusive; sampling never extrapolates beyond the grid. Non-finite samples
and an optional `noData` value are unavailable. A contributing nodata corner in
any component makes the whole vector unavailable; zero-weight corners are ignored.

## Mixed epochs and bulk coordinates

Set `sourceEpoch: 'coordinate'` to use the existing separate epoch argument. The
target epoch remains fixed in the step. Supply a decimal year for the entire call
or a Float32/Float64 epoch buffer with one value per coordinate record:

```typescript
const to2020 = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{type: 'deformation', model, sourceEpoch: 'coordinate', targetEpoch: 2020}]
});
const coordinates = new Float64Array([6378137, 0, 0, 4, 6378137, 0, 0, 5]);
const sourceEpochs = new Float64Array([2010, 2015]);
to2020.projectFlat(coordinates, 4, sourceEpochs);
to2020.unprojectFlat(coordinates, 4, sourceEpochs);
```

A deformation step does not change the epoch argument used by other steps. If
reference-frame operations before and after propagation require different observation
epochs, use separate pipelines with the corresponding epoch arguments.

Epochs are always separate from M. Propagation preserves M and later ordinates and
does not write to the epoch buffer. Inverse calls receive the **original source
epochs**, not the target epoch. A separate pipeline can physically propagate from
2020 back to 2010, but sampling velocity at that endpoint is not generally the
mathematical inverse of the original forward map.

Both source and target must be within the model's declared interval. A missing
coordinate epoch, invalid duration, uncovered point, non-finite result or inverse
non-convergence throws. The built-in inverse solves the forward map with a bounded
fixed-point iteration and a 10 nm ECEF iteration tolerance; it throws after 32
iterations. This numerical stopping criterion does not describe model accuracy.
Direct model calls restore XYZ on failure. Bulk calls retain completed records and
leave the failing record and later records unchanged. Float32 rounds only the final
XYZ record; choose Float64 when sub-metre ECEF displacements matter. Built-in model
and grid operations create no per-record arrays or objects.

## Local velocity orientation

VelocityGrid's `sample(longitude, latitude, result)` receives **radians** and writes
ENU velocities in metres/year. The regular grid's setup coordinates remain degrees;
its sampler performs that conversion. Deformation rotates these velocities using
the normal at the inverse geodetic position, then integrates over the decimal-year
interval in fixed XYZ metres. It shares the reusable
[local-frame functions](../core/api-reference/local-frame.md) with geospatial.

Sharing does not change geospatial's Cartesian-gradient normal choice at height,
or the existing geocentric near-axis longitude convention. Custom samplers may
recursively call a model: its owned basis is populated after sampling returns.
No per-coordinate basis object or intermediate vector is created.

## Load a velocity GeoTIFF

`loadVelocityGeoTIFFGrid` prepares numeric rasters after the application has fetched
and decoded them. It accepts a structural geotiff.js object or plain decoded
`VelocityGridGeoTIFFData`, compatible with loaders.gl raster data:

```typescript
import {loadVelocityGeoTIFFGrid} from '@math.gl/projection/grids/velocity-geotiff';

const grid = await loadVelocityGeoTIFFGrid(decodedRasterData);
const model = createDeformationModel({grid, epochRange: reviewedEpochRange});
```

The reader requires `TYPE=VELOCITY`, geographic degree/Greenwich coordinates,
axis-aligned tiepoint/scale geometry, explicit PixelIsPoint or PixelIsArea
registration, and bands 0/1/2 named `east_velocity`, `north_velocity`, `up_velocity`.
Each must declare `millimetres per year` or `mm/year`. Extra accuracy bands are
ignored. Native band scale/offset is applied after nodata checks. Supply complete
original bands, dimensions, metadata and tags; rendered RGB or resampled rasters
are unsuitable.

Images must be ordered parent before nested child, or disjoint. Later child images
have priority. If any component of a child vector is unavailable, sampling falls
back to a complete parent vector; components from different images are never mixed.
Preparation owns the samples and does not retain the decoder.

Model data, decoder choice, network loading and licensing remain application-owned.
Load and prepare a model once before constructing synchronous pipelines. Projection
algorithms in the same pipeline retain the existing lazy descriptor/preload API.

## Bundle cost and qualification

The model, regular grid and GeoTIFF adapter are separate optional subpaths. They are
not reexported from the root. Importing `/pipeline` alone retains the typed step
orchestration but no deformation model, velocity interpolator or TIFF decoder.
Core, ordinary projections and the default wrapper do not gain model code. See the
[measured bundle table](./projection-engine.md#tree-shaking-and-bundle-size).

Sixteen configurations / 64 coordinate-epoch pairs use an original synthetic MIT
velocity TIFF and pinned pyproj 3.7.2 / PROJ 9.5.1 forward evaluations. Forward-oracle
inverse roots are generated independently; the legacy PROJ inverse is also retained
with an explicit 0.1 mm comparison envelope. Tests cover both directions, fixed and
mixed epochs, XYZ/XYZM/additional tails, Float32 final rounding, Float64 results,
coverage, nodata, ownership and failure behavior. CI runs the corpus in Node and
browser engines and checks fixture hashes and packed ESM/CommonJS/types.

These authored fixtures validate the implemented contract, not a real model's
accuracy or unrestricted PROJ parity. No third-party model files or new dependencies
are distributed. Event offsets, nonlinear/time-varying components, automatic model
selection, dynamic CRS inference and model extrapolation are outside this profile.
