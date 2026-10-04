# Coordinate systems, ellipsoids, datums and epochs

A coordinate such as `[12, 55, 100]` is incomplete without its reference system.
The numbers might mean longitude, latitude and ellipsoidal height, or easting,
northing and gravity-related height. Units, axes, datum and sometimes time determine
what location those numbers describe.

This guide introduces the concepts used by `@math.gl/projection`. It is useful
before choosing a [projection algorithm](./projections.md) or composing an
[operation pipeline](./operation-pipelines.md).

## Geographic, projected and geocentric coordinates

| Space | Typical coordinates | What they describe |
| --- | --- | --- |
| Geographic | Longitude, latitude, ellipsoidal height | Angles on a reference ellipsoid and height along its surface normal |
| Projected | Easting, northing, optional height | Planar coordinates obtained from a geographic location using projection equations |
| Geocentric | X, Y, Z | Cartesian coordinates relative to the reference frame's Earth-centered origin |

A cartographic projection maps a curved surface onto a plane. A datum transformation
changes the reference frame in which a location is expressed. A complete conversion
between projected CRSs can involve inverse projection, a datum operation, then
forward projection. PROJ describes this decomposition in its
[geodetic transformation guide](https://proj.org/en/stable/usage/transformation.html).

```typescript
import {Projection} from '@math.gl/projection';

const utm = new Projection({to: 'EPSG:32631'});
utm.project([3, 50, 100]); // geographic degrees and meters → UTM meters

const earthCentered = new Projection({to: 'EPSG:4978'});
earthCentered.project([3, 50, 100]); // X/Y/Z meters
```

Geocentric records need three components. Geocentric coordinates are useful for
3D reference-frame operations; they are not a flat map projection.

## Ellipsoids: the shape model

An ellipsoid approximates Earth's shape. Its semi-major axis **a** is the equatorial
radius and its semi-minor axis **b** is the polar radius. Flattening is
**f = (a − b) / a**; inverse flattening is **1 / f**. Eccentricity squared is
**e² = 1 − b² / a²**. These quantities describe the same shape in different forms.
See [PROJ's ellipsoid reference](https://proj.org/en/stable/usage/ellipsoids.html)
for mathematical parameter definitions.

| Shape | Semi-major axis (meters) | Inverse flattening |
| --- | ---: | ---: |
| WGS84 | 6,378,137 | 298.257223563 |
| GRS80 | 6,378,137 | 298.257222101 |
| Sphere | Application-selected radius | Flattening is zero |

The package accepts named ellipsoids through `+ellps`, explicit axes through `+a`
and `+b`, flattening through `+f` or `+rf`, and a sphere through `+R`. See
[ellipsoid parameters](./api-reference/projection-engine.md#current-coverage) for
precedence and validation.

```typescript
const ellipsoidalMercator = new Projection({
  to: '+proj=merc +ellps=WGS84 +datum=WGS84 +units=m'
});
const sphericalMap = new Projection({
  to: '+proj=moll +R=6371000 +datum=none +units=m'
});
```

The [catalogue](./projections.md) identifies spherical and ellipsoidal algorithms.
Some world-map algorithms use spherical equations even when an ellipsoid is
specified. That is an algorithm choice, not an ellipsoidal datum transformation.

Web Mercator (`EPSG:3857`) uses spherical projection equations with the WGS84
semi-major axis and WGS84 geographic coordinates. Its distortion grows rapidly
with latitude. It is convenient for tiled basemaps; its planar meters should not
be treated as accurate ground distances. Ellipsoidal Mercator is a different
projection and produces different northings.

### Interoperating with geospatial ellipsoids

[`Ellipsoid`](../geospatial/api-reference/ellipsoid.md) supports surface geometry,
local frames and three independent radii. Projection CRS definitions use the
sphere/oblate-spheroid subset. Both modules share `SpheroidParameters`, a type-only
contract for the two axes in metres. They also share the low-level
[spheroid conversions](../core/api-reference/spheroid.md) for forward conversion
and the qualified sphere/oblate surface/exterior inverse. Geospatial retains its
three-radius and interior geometry paths.

```ts
import {Ellipsoid} from '@math.gl/geospatial';
import {normalizeCRS, ProjectionEngine} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';

const normalized = normalizeCRS('+proj=longlat +ellps=GRS80');
const shape = Ellipsoid.fromSpheroid(normalized.ellipsoid);
const {semiMajorAxis: a, semiMinorAxis: b} = shape.toSpheroid();
const geometry = `+a=${a} +b=${b}`;
const conversion = new ProjectionEngine({
  from: `+proj=longlat ${geometry}`,
  to: `+proj=geocent ${geometry}`,
  projections: [geocentric]
});
// Same shape, longitude/latitude degrees and ellipsoidal height metres.
const xyz = conversion.project([12, 55, 100]);
```

The adapters transfer geometry only. They do not reconstruct a CRS or identify a
datum transformation. Triaxial and prolate geospatial ellipsoids cannot be
represented by this projection contract and are rejected by `toSpheroid()`.
Keep adapter calls outside coordinate loops; projection imports do not load the
geospatial class.

Geospatial conversions use degrees by default, or radians when
`config._cartographicRadians` is enabled. Projection's public CRS conversions use
the declared CRS units independently of that global setting; a pipeline `cart`
step requires radians. At the center, geospatial returns `undefined` while
projection throws. At exact poles, projection canonicalizes longitude to zero.
Geospatial retains near-pole latitude precision using both the horizontal and
vertical surface-normal components. Non-finite or unrepresentable surface inverses
return `undefined` without changing caller outputs; surface iteration is bounded.
Its center-neighborhood radial fallback is an approximation and can differ from a
geodetic inverse. Projection's spherical inverse preserves nonzero near-axis directions;
its oblate inverse retains a separate convergence policy. Cross-module tests record
these boundaries; the kernels have not been combined.

## Datums: the reference frame

An ellipsoid provides a shape. A geodetic datum or reference frame establishes how
that shape and its coordinates relate to Earth. Sharing an ellipsoid does not make
two datums interchangeable. Even familiar names such as WGS84 or NAD83 can refer
to different realizations; the required accuracy determines how specifically a
frame must be identified.

In this package, `+datum` chooses a supported named datum definition. An explicit
`+towgs84` supplies a three- or seven-parameter transformation; `+nadgrids` refers
to prepared horizontal correction grids. Merely specifying `+ellps` does not
request a datum shift. `+datum=none` explicitly disables datum conversion.

| Operation | What it does | Application responsibility |
| --- | --- | --- |
| Three-parameter translation | Changes geocentric X/Y/Z by fixed offsets | Supply parameters valid for the source and target frames |
| Seven-parameter Helmert | Adds rotations and scale to translation | Declare units and the correct rotation convention |
| Horizontal correction grid | Interpolates regional longitude/latitude corrections | Load the grid, match its datum and check coverage |
| Vertical geoid grid | Relates ellipsoidal and gravity-related heights | Match the height datum, geographic datum and model conventions |
| Kinematic Helmert | Evaluates frame-transformation parameters at an epoch | Supply reference epoch, rates and observation epoch |
| Deformation model | Propagates coordinates between epochs using velocities | Supply the model, source epoch, target epoch and valid coverage |

The configurable engine requires grids to be supplied by the application; it does
not select operations or fetch grid files from an authority database. Use
[explicit pipelines](./operation-pipelines.md) when operation order and conventions
need to be stated. In particular, a Helmert rotation's sign depends on whether the
operation uses the position-vector or coordinate-frame convention. See the
[PROJ Helmert reference](https://proj.org/en/stable/operations/transformations/helmert.html).

## Heights: ellipsoid versus gravity

Ellipsoidal height **h** is measured relative to the reference ellipsoid.
Gravity-related height **H** is measured relative to a physical height datum. For
a matching geoid model with undulation **N**, the usual conversion is **h = H + N**.
A longitude/latitude projection on its own does not perform this conversion.

The third ordinate is ellipsoidal height by default. Explicit `+geoidgrids`
conversion uses registered geoid undulations in meters, with source and destination
height operations around the horizontal datum operation. Choose a model matching
your datum and tide convention. See the
[height conversion guide](./projection-engine.md#convert-geoid-heights) for loading
GTX or GeoTIFF grids and integrating `@math.gl/geoid`.

A separately declared vertical CRS in WKT, PROJJSON or metadata is not automatically
executed. Explicit horizontal extraction discards that component; it does not
convert its heights. Validate the height semantics before calling a 3D transform.

## Epochs: when a coordinate applies

Earth's crust moves. In a dynamic reference frame, a coordinate must be associated
with a time. The **coordinate epoch** is the time at which the coordinate describes
the point. A **reference epoch** identifies when a transformation's base parameters
are defined. These are distinct: rates can evaluate those parameters at another
coordinate epoch.

For example, a base translation of 1 meter at epoch 2000 with a rate of 0.01 meters
per year evaluates to 1.2 meters at epoch 2020. A kinematic Helmert transforms
between reference frames at the supplied epoch. It does not by itself propagate
a point between two epochs in one frame. A deformation model supplies that separate
operation, using velocities over a source-to-target time interval.

The API uses **decimal years**, not Unix timestamps or JavaScript milliseconds.
Supply a scalar epoch or one Float32/Float64 epoch per flat record. The fourth
coordinate component remains M, a measure; it is never interpreted as time.

```typescript
import {ProjectionPipeline} from '@math.gl/projection/pipeline';

// Illustrative coefficients, not an authoritative datum transformation.
const movingFrame = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{
    type: 'helmert',
    translation: [1, 0, 0],
    referenceEpoch: 2000,
    rates: {translation: [0.01, 0, 0]},
    convention: 'position_vector'
  }]
});
movingFrame.project([6378137, 0, 0, 42], 2020); // M=42 is preserved
const xyz = new Float64Array([6378137, 0, 0, 6378137, 1, 0]);
movingFrame.projectFlat(xyz, 3, new Float64Array([2000, 2020]));
```

See [kinematic Helmert operations](./operation-pipelines.md) for inverse semantics
and [deformation models](./deformation-models.md) for propagation with geographic ENU velocity grids
applied to geocentric positions. PROJ's
[deformation reference](https://proj.org/en/stable/operations/transformations/deformation.html)
provides background on velocity-based epoch changes.

`@math.gl/crs` can retain `coordinateEpoch` metadata. The ordinary `Projection`
and `ProjectionEngine` do not silently apply it; epoch-bearing spatial references
require an explicit time-dependent operation. Nor does a dynamic CRS definition
select a velocity model or an operation automatically.

## Axes, units and precision

A CRS can declare latitude before longitude, west-positive longitude or different
horizontal and vertical units. Default coordinate arrays use conventional x/y/z
order. `enforceAxis: true` honors the declared CRS axes. Metadata about stored
coordinate order is a separate concern; see the
[engine API](./api-reference/projection-engine.md#integration-with-mathglcrs).

Use Float64 storage for large map coordinates with small local differences.
Float32 storage can lose sub-meter detail even if the equations calculate in
JavaScript double precision. A successful round trip demonstrates consistency, not
absolute accuracy: compare independent reference coordinates, especially near
projection singularities, grid edges and datum boundaries.

## A transformation checklist

1. Identify the source and target CRS, including datum realization, units and axes.
2. Choose a projection whose area and distortion suit the map; use authoritative parameters for an established CRS.
3. Determine whether horizontal or vertical datum operations are required.
4. Supply matching grids and verify coverage and nodata behavior.
5. For dynamic frames, distinguish frame transformation at an epoch from propagation between epochs.
6. Check compatibility, then validate representative coordinates against independent references.

See [independent validation](./independent-validation.md) for the package's qualified
accuracy profile. The optional [operation catalogue](./operation-selection.md) filters
application-reviewed candidates; general EPSG operation discovery and complete
PROJ/EPSG database behavior are outside the supported subset.
