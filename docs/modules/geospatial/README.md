# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

`@math.gl/geospatial` provides ellipsoid geometry, geographic/Cartesian conversions, local tangent frames, globe queries, and tile-grid geometry. Use it for WGS84 positions and 3D Tiles bounds without a renderer dependency.

Geographic arrays use `[longitude, latitude, height]`, with angles in degrees and ellipsoidal height in metres by default. Cartesian arrays use Earth-centered coordinates in metres. Geoid heights and general CRS conversion are handled by [geoid](../earth/geoid/README.md) and [projection](./projection/README.md).

The geospatial group includes `@math.gl/geospatial`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`,
`/wkb`, `/geoarrow`, and `/expressions`. `@math.gl/web-mercator` remains available for existing
imports. DGGS remains a separate package.

New to these concepts? Start with [Geospatial terminology](./developer-guide/terminology.md)
for geodesics, rhumb lines, chords, ellipsoids, reference systems, and projection properties.

## Feature support

A geospatial mathematics checklist spanning surfaces, reference frames, and global paths.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Ellipsoid coordinates and surface geometry | ✅ Implemented | [Ellipsoid](./api-reference/ellipsoid.md), metric/auxiliary-latitude helpers, and [qualified surface inversion](./api-reference/ellipsoid-accuracy.md). |
| Local frames, poses and packed transforms | ✅ Implemented | [LocalReferenceFrame](./api-reference/local-reference-frame.md) with explicit ENU/NED conventions and documented ownership. |
| Series and elliptic-integral geodesics | ✅ Implemented | [Series](./api-reference/ellipsoid-geodesic.md) and [Exact](./api-reference/ellipsoid-geodesic-exact.md) solvers have distinct oblate/prolate support profiles. |
| Geodesic area, rhumbs and intersections | ✅ Implemented | [Polygon accumulation](./api-reference/geodesic-polygon.md), [rhumb geometry](./api-reference/ellipsoid-rhumb.md), and [bounded intersection searches](./api-reference/geodesic-intersections.md). |
| Surface paths, seams and clipping | ✅ Implemented | [Geodesic/rhumb paths](./api-reference/geodesic-path.md), geographic seams and global/latitude cut APIs preserve declared edge semantics. |
| Triaxial coordinates, direct paths and sampling | ✅ Implemented | [TriaxialEllipsoid](./api-reference/triaxial-geometry.md) supplies surface conversions, initial-value geodesics and surface sampling within documented domains. |
| Globe visibility and tile-matrix geometry | ✅ Implemented | [Globe queries](./api-reference/globe-queries.md) and [tile matrices](./api-reference/tile-matrix.md) remain independent of tile loading/rendering. |
| UTM/UPS, MGRS and angle utilities | ✅ Implemented | [Coordinate utilities](./api-reference/coordinate-utilities.md) implement explicit WGS84 grid, envelope and formatting conventions. |
| Batched columnar GIS operations | ✅ Implemented | The optional [Turf-compatible entry](https://github.com/visgl/math.gl/blob/master/modules/geospatial/src/turf.ts) operates on GeoArrow columns with nullable row-aligned results; its supported operation set is explicit. |
| Full global triaxial inverse geodesics | ❌ Not implemented | Direct triaxial trajectories do not provide a global inverse/closest-route or route-uniqueness solver. |
| Precision encoding with a renderer contract | ◐ Partial | Local frames are implemented; the [C7 roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/geospatial-roadmap.md) retains shared high/low encoding and consumer qualification work. |
| Qualified inertial/terrestrial state-vector frames | ❌ Not implemented | Versioned Earth-orientation providers and full position/velocity frame transformations remain [C9 work](https://github.com/visgl/math.gl/blob/master/dev-docs/geospatial-roadmap.md). |

## Installation

```bash
npm install @math.gl/geospatial
```

![WGS84: The 1984 World Geodetic System Ellipsoid](./images/WGS84_mean_Earth_radius.svg)

<center>WGS84: The 1984 World Geodetic System Ellipsoid. <br/>
Attribution: From <a href="https://en.wikipedia.org/wiki/World_Geodetic_System#/media/File:WGS84_mean_Earth_radius.svg">wikipedia</a>, Creative Commons 4.0.</center>

## Import paths

| Import | APIs |
| --- | --- |
| `@math.gl/geospatial` | [Ellipsoid](./api-reference/ellipsoid.md), [tangent planes](./api-reference/ellipsoid-tangent-plane.md), [surface geodesics](./api-reference/ellipsoid-geodesic.md), [geodesic paths](./api-reference/geodesic-path.md), [rhumb paths](./api-reference/rhumb-path.md), and [WGS84 helpers](./api-reference/helpers.md) |
| `@math.gl/geospatial` | [Geographic rectangles](./api-reference/lng-lat-rectangle.md), [region bounding boxes](./api-reference/make-obb-from-region.md), [visibility queries](./api-reference/globe-queries.md), [mesh subdivision](./api-reference/subdivide-globe-mesh.md), [rhumb subdivision](./api-reference/rhumb-path.md), and [geographic seams](./api-reference/geographic-seams.md) |
| `@math.gl/geospatial` | [Oblique ellipsoidal visibility and shared cut graphs](./api-reference/geographic-atlas.md) |
| `@math.gl/geospatial` | [Ellipsoidal/rhumb latitude-domain clipping and adaptive projection](./api-reference/latitude-geographic-cuts.md) |
| `@math.gl/geospatial` | [Geographic tile queries](./api-reference/geographic-tiles.md) and [tile-matrix utilities](./api-reference/tile-matrix.md) |
| `@math.gl/geospatial/workers` | [Map setup and bulk projection in workers](../core/developer-guide/workers.md) |

## Classes

| Class                   | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `Ellipsoid`             | Implements ellipsoid math and cartographic/Cartesian conversions.           |
| `Ellipsoid.WGS84`       | An `Ellipsoid` instance initialized with Earth radii per WGS84.             |
| `LocalReferenceFrame` | Reusable local frames, geographic poses, and velocity-aligned orientations. |
| `EllipsoidTangentPlane` | Projects WGS84 Cartesian positions into a local east-north plane.           |
| `LngLatRectangle`       | Represents a longitude-latitude rectangle, including antimeridian crossing. |

## Geographic tile queries

import GeographicTiles from '@site/src/components/geographic-tiles';

<GeographicTiles inline height={500} />

[Geographic tile helpers](./api-reference/geographic-tiles.md) address degree coordinates
and cover geographic regions with compact tile ranges, including antimeridian crossings.
Expand the infobox to explore query regions and levels.

## Functions

| Function            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `makeOBBFromRegion` | Creates a conservative oriented bounding box for a longitude–latitude–height region, including antimeridian and polar regions. |

## Usage

Determine the Cartesian representation of a Cartographic position on a WGS84 ellipsoid.

```js
import {Ellipsoid} from '@math.gl/geospatial';
const cartographicPosition = [21, 78, 5000]; // [longitude, latitude, height]
const cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(cartographicPosition);
```

Determine the Cartographic representation of a Cartesian position on a WGS84 ellipsoid.

```js
import {Ellipsoid} from '@math.gl/geospatial';
const cartesianPosition = [17832.12, 83234.52, 952313.73];
const cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
```

Get the transform from a local east-north-up frame at a point on the WGS84 ellipsoid to Earth's fixed frame.

```js
import {Ellipsoid, eastNorthUpToFixedFrame} from '@math.gl/geospatial';
const cartesianOrigin = Ellipsoid.WGS84.cartographicToCartesian([21, 78, 0]);
const transformMatrix = eastNorthUpToFixedFrame(Ellipsoid.WGS84, cartesianOrigin);
```

## Framework Independence

Input coordinates can be numeric arrays; callers do not need to construct core vectors.

- Coordinate inputs and outputs use three-component numeric arrays. Check each method's result parameter before supplying reusable storage.

## History

This library was initially created as part of a bigger collaboration between the vis.gl and Cesium teams to provide framework-independent, portable support for the 3D Tiles specification, however it has been designed to provide generic support for WGS84 and ellipsoidal math.

## Attribution

Selected classes and three-radius ellipsoid kernels derive from Cesium under Apache-2.0. Shared spheroid conversion kernels also retain proj4js MIT provenance. Source headers and distributed notices identify the applicable credits and terms.

See [References and credits](../../references-and-credits.md) for the project-wide source inventory and acknowledgments.

## Globe queries

[EllipsoidOccluder and globe horizon bounds](./api-reference/globe-queries.md) provide
true ray intersections, elevated-point occlusion, exact limb ellipses and wrapped
conservative imagery coverage without a viewport or rendering dependency.

## Globe mesh subdivision

[subdivideGlobeMesh](./api-reference/subdivide-globe-mesh.md) refines triangulated longitude/latitude meshes onto a sphere or oblate ellipsoid, preserving shared edges and attribute provenance. Import it and `SubdivideGlobeMeshOptions` from `@math.gl/geospatial`.

## Tile matrices

[Tile matrix types and utilities](./api-reference/tile-matrix.md) describe supplied rectangular
grids in any coordinate system. Import from `@math.gl/geospatial` for a lightweight
entry point with no runtime dependencies. Helpers provide bounds, coordinate lookup, compact
extent-to-tile ranges, coverage checks and resolution-based level selection.

Use the geographic tile helpers above for the built-in equal-angle longitude/latitude quadtree
and antimeridian-aware queries. Explicit matrix queries use half-open edges and never wrap.

## Local frames and poses

[LocalReferenceFrame](./api-reference/local-reference-frame.md) separates point and vector transformations,
composes geographic heading/pitch/roll poses, and builds velocity-aligned orientations. Import it
from `@math.gl/geospatial`. Local distances use the ellipsoid axis units; pose angles use radians.

## Geodesic path sampling

[GeodesicPath](./api-reference/geodesic-path.md) reuses a shortest geodesic line for fraction/distance
sampling. [subdivideGeodesicPolyline](./api-reference/subdivide-geodesic-polyline.md) adaptively maps
those paths through a supplied transform with original-edge provenance and optional surface-distance
limits. Source angles are degrees, output tolerance uses target units, and longitude unrolling does
not split projection seams. Import the sampler from `/ellipsoid` and subdivision from `/globe`.

[Local-frame qualification and G7 benchmark baselines](./api-reference/local-frame-qualification.md)
document the supported numerical profile and independent/native evidence.

### Wider-domain and triaxial geodesics

- [EllipsoidGeodesicExact](./api-reference/ellipsoid-geodesic-exact.md): optional
  elliptic direct/inverse revolution geodesics and reusable distance/arc lines.
- [TriaxialEllipsoid](./api-reference/triaxial-geometry.md): three surface coordinate
  systems, direction conversions and reusable Cartesian geodesic trajectories.
- [G8/G9 qualification and support limits](./api-reference/geodesic-g89-qualification.md).

Optional [coordinate utilities](./api-reference/coordinate-utilities.md) provide
angle text and WGS84 UTM/UPS/MGRS cells. [Packed line sampling](./api-reference/geodesic-line-buffer.md)
adds reusable geodesic/rhumb output storage. Triaxial geometry also supports
[area-uniform surface points](./api-reference/triaxial-geometry.md#area-uniform-surface-sampling).
