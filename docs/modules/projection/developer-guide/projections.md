---
slug: /modules/projection/projections
---

# Projection catalogue

A projection chooses how a curved Earth becomes a flat map. The choice affects
shape, area, distance and direction; no global flat map preserves all four.
`@math.gl/projection` supplies a catalogue of algorithms, while a CRS supplies
their parameters, ellipsoid, datum, axes and units.

Use this page to choose a family and find its import. The
[engine API](../api-reference/projection-transform.md#current-coverage) specifies accepted
parameters and strict validation. PROJ's
[projection reference](https://proj.org/en/stable/operations/projections/index.html)
provides additional mathematical background; its larger catalogue and parameter
set should not be assumed to be available here.

## What should the map preserve?

| Property | Meaning | Useful families |
| --- | --- | --- |
| Conformal | Preserves local angles and infinitesimal shapes; area and scale vary | Mercator, Transverse Mercator, Lambert conformal conic, stereographic |
| Equal area | Preserves area ratios; shapes are distorted | Albers, Lambert azimuthal equal area, cylindrical equal area, Equal Earth, Mollweide |
| Equidistant | Preserves distances along particular lines or from a chosen center | Equidistant cylindrical/conic, azimuthal equidistant |
| Perspective | Represents a view from a specified viewpoint | Orthographic, geostationary, tilted perspective |
| Compromise | Balances visual distortion without an exact area or angle guarantee | Robinson, Miller, van der Grinten |

“Equidistant” does not mean every pair of points has the correct planar distance.
A map suitable for display is not automatically suitable for measuring length or
area. Use the declared projection's useful region, and avoid treating Web Mercator
pixel or meter differences as ground distances.

## Imports and loading

The tables below give the **ID** used in both the PROJ string (`+proj=<id>`) and
public import path (`@math.gl/projection/projections/<id>`), followed by the named
export. Geographic coordinates are built into `/core`.

```typescript
import {ProjectionTransform} from '@math.gl/projection/core';
import {albersEqualArea} from '@math.gl/projection/projections/aea';

const regionalAreas = new ProjectionTransform({
  to: '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +datum=WGS84',
  projections: [albersEqualArea]
});
regionalAreas.project([-100, 40]);
```

An algorithm's ID is not an EPSG code. Many CRSs use the same algorithm with different
origins, scale, false offsets and datums. For an established CRS, use its authoritative
definition instead of constructing parameters from the projection's name.

For deferred imports, use `/projections/lazy/<id>` and the corresponding `lazy…`
export. `LazyProjection` at `/projections/lazy` supplies the whole descriptor catalogue.
Async coordinate methods load requested algorithms; synchronous methods require
`preload()` to have completed. See the
[loading guide](projection-engine.md#load-less-used-projections-on-demand) for the exact contract.

## Cylindrical and transverse projections

| Algorithm | ID | Export | Geometry and useful domain |
| --- | --- | --- | --- |
| Mercator | `merc` | `mercator` | Sphere or ellipsoid; conformal, poles undefined |
| Equidistant cylindrical | `eqc` | `equidistantCylindrical` | Spherical equations; simple longitude/latitude map with chosen true-scale parallel |
| Legacy equirectangular | `equi` | `equirectangular` | Spherical equations; `lat_0` is the true-scale parallel, unlike `eqc`'s latitude-origin convention |
| Cylindrical equal area | `cea` | `cylindricalEqualArea` | Sphere or ellipsoid; area-preserving rectangular world maps |
| Transverse Mercator | `tmerc` | `transverseMercator` | Ellipsoidal extended series by default; useful near its central meridian |
| Extended Transverse Mercator | `etmerc` | `extendedTransverseMercator` | Extended series; same default numerical family as `tmerc` |
| Universal Transverse Mercator | `utm` | `universalTransverseMercator` | Standard zone/hemisphere parameterization of TM |
| Gauss-Schreiber Transverse Mercator | `gstmerc` | `gaussSchreiberTransverseMercator` | Regional conformal algorithm; match the intended CRS parameters |
| Oblique Mercator | `omerc` | `obliqueMercator` | Conformal mapping along an oblique corridor; Hotine variants have different offset conventions |
| Swiss Oblique Mercator | `somerc` | `swissObliqueMercator` | Regional conformal mapping; supply the appropriate Swiss datum and parameters |
| Cassini-Soldner | `cass` | `cassiniSoldner` | Sphere or ellipsoid; local maps near the central meridian; ellipsoidal series has a limited useful domain |

[Mercator](https://proj.org/en/stable/operations/projections/merc.html) preserves
local angles, not area. Its scale grows toward the poles. Select `EPSG:3857` for
Web Mercator basemaps; `+proj=merc +datum=WGS84` instead selects ellipsoidal
Mercator. They are not interchangeable northing conventions.

TM and UTM are good regional choices around a central meridian. The default extended
algorithm requires an ellipsoid; an explicit `+approx` permits the older spherical
or ellipsoidal approximation. This flag trades the algorithm's domain and accuracy;
it should not be used as a general performance switch without validation.

```typescript
import {Projection} from '@math.gl/projection';

const utm31North = new Projection({to: 'EPSG:32631'});
utm31North.project([3, 50]);
```

UTM zones must be integers 1–60. `+south` chooses the southern hemisphere's false
northing. UTM fixes central meridian, scale and offsets; use `tmerc` for custom
parameters. Zone selection belongs to the application. A WKT UTM definition often
names the Transverse Mercator method, so a selective WKT engine needs
`transverseMercator` rather than just the `utm` shorthand plugin.

## Conic and regional projections

| Algorithm | ID | Export | Geometry and useful domain |
| --- | --- | --- | --- |
| Lambert conformal conic | `lcc` | `lambertConformalConic` | Sphere or ellipsoid; conformal regional maps, often with east–west extent |
| Albers equal area | `aea` | `albersEqualArea` | Sphere or ellipsoid; regional thematic maps preserving area |
| Equidistant conic | `eqdc` | `equidistantConic` | Sphere or ellipsoid; preserves selected meridional/parallel distances |
| Bonne | `bonne` | `bonne` | Sphere or ellipsoid; equal-area pseudoconic map; requires nonzero `lat_1` |
| Polyconic | `poly` | `polyconic` | Sphere or ellipsoid; regional mapping with individually constructed parallels |
| Krovak | `krovak` | `krovak` | Specialized regional conformal projection; fixed cone parameters and orientation conventions |
| New Zealand Map Grid | `nzmg` | `newZealandMapGrid` | Specialized regional polynomial projection; requires explicit origin and matching CRS geometry |

Conics use standard parallels to control distortion. They are not simply the top
and bottom limits of the map. `lat_1` is required for LCC, Albers and EQDC; `lat_2`
defaults to it. Opposite parallels or parallels at a pole are rejected. Consult the
[Lambert conformal conic reference](https://proj.org/en/stable/operations/projections/lcc.html)
for the one- and two-standard-parallel forms.

```typescript
const regionalShapes = new Projection({
  to: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +datum=WGS84'
});
regionalShapes.project([-100, 40]);
```

This example illustrates a projection choice. It does not identify a national grid
or an authoritative transformation from a regional datum. Krovak, Swiss grids and
NZMG particularly require the correct ellipsoid, datum and axis conventions; their
algorithm defaults do not define a complete CRS.

## Azimuthal and polar projections

| Algorithm | ID | Export | Geometry and useful domain |
| --- | --- | --- | --- |
| Lambert azimuthal equal area | `laea` | `lambertAzimuthalEqualArea` | Sphere or ellipsoid; area-preserving maps centered on a region |
| Stereographic | `stere` | `stereographic` | Sphere or ellipsoid; conformal, including polar aspects |
| Oblique stereographic | `sterea` | `obliqueStereographic` | Regional conformal alternative; requires a non-polar origin |
| Azimuthal equidistant | `aeqd` | `azimuthalEquidistant` | Sphere or ellipsoid; centered-distance use, with ellipsoidal qualifications below |
| Gnomonic | `gnom` | `gnomonic` | Spherical equations; great-circle paths are straight lines, horizon excluded |
| Orthographic | `ortho` | `orthographic` | Spherical equations; globe-like hemisphere view, invisible points rejected |

Choose the center deliberately. Distortion increases away from it, and an antipodal
point or projection horizon may be undefined. Polar stereographic is useful for
high-latitude mapping; UPS aliases `EPSG:5041` and `EPSG:5042` provide the WGS84
north/south definitions.

```typescript
const polarMap = new Projection({to: 'EPSG:5041'});
polarMap.project([0, 85]);

const centeredAreas = new Projection({
  to: '+proj=laea +lat_0=52 +lon_0=10 +datum=WGS84'
});
centeredAreas.project([12, 55]);
```

[Azimuthal equidistant](https://proj.org/en/stable/operations/projections/aeqd.html)
is useful for distances from a chosen center. The math.gl ellipsoidal implementation
retains the proj4js regional series; it is not the modern PROJ geodesic solution.
Do not infer global geodesic accuracy from the name. For polar and far-from-center
coordinates, check the [independent accuracy profile](../independent-validation.md)
and your own required tolerance.

## World maps and cube faces

| Algorithm | ID | Export | Geometry and useful domain |
| --- | --- | --- | --- |
| Equal Earth | `eqearth` | `equalEarth` | Equal area; includes authalic-latitude treatment for an ellipsoid |
| Mollweide | `moll` | `mollweide` | Spherical equal-area pseudocylindrical world map |
| Sinusoidal | `sinu` | `sinusoidal` | Sphere or ellipsoid; equal area, distortion toward outer meridians |
| Eckert VI | `eck6` | `eckertVI` | Spherical equal-area pseudocylindrical world map |
| Robinson | `robin` | `robinson` | Spherical compromise world map; tabulated interpolation |
| Miller cylindrical | `mill` | `millerCylindrical` | Spherical compromise cylindrical world map |
| van der Grinten I | `vandg` | `vanDerGrinten` | Spherical compromise world map in a circular outline |
| Quadrilateralized Spherical Cube | `qsc` | `quadrilateralizedSphericalCube` | Equal-area cube-face mapping with ellipsoid-to-sphere handling |

Equal-area maps are useful when comparing regional areas or thematic totals.
Compromise maps favor a balanced visual appearance. An algorithm described as
“spherical” may accept an ellipsoidal CRS but still use only a radius in its
projection equations. See [ellipsoid concepts](coordinate-systems.md#ellipsoids-the-shape-model).

```typescript
const worldAreas = new Projection({to: '+proj=eqearth +datum=WGS84'});
worldAreas.project([12, 55]);
```

[Equal Earth](https://proj.org/en/stable/operations/projections/eqearth.html) is a
useful starting point for area-preserving world maps. A projection converts points;
it does not choose polygon seam splits or tessellation. Use
[`@math.gl/polygon`](../../polygon/api-reference/polygon.md) for the relevant geometric
operations. Cube-face selection and tiling likewise belong to the application.

## Satellite views and rotated maps

| Operation | ID | Export | Parameters and limits |
| --- | --- | --- | --- |
| Geostationary satellite view | `geos` | `geostationary` | Sphere or ellipsoid; positive satellite height `h`, sweep axis `x` or `y`; invisible points rejected |
| Tilted perspective | `tpers` | `tiltedPerspective` | Spherical view; positive `h`, tilt and azimuth; finite visibility domain |
| General oblique transformation | `ob_tran` | `obliqueTransformation` | Rotates the geographic basis around an explicitly supplied child algorithm |
| Geocentric conversion | `geocent` | `geocentric` | Converts geographic longitude/latitude/height to Cartesian X/Y/Z; not a planar projection |

The oblique factory lets an application choose a rotated world map without a global
algorithm registry:

```typescript
import {ProjectionTransform} from '@math.gl/projection/core';
import {obliqueTransformation} from '@math.gl/projection/projections/ob_tran';
import {mollweide} from '@math.gl/projection/projections/moll';

const rotated = new ProjectionTransform({
  to: '+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90 +R=6371000 +datum=none',
  projections: [obliqueTransformation(mollweide)]
});
rotated.project([12, 55]);
```

The child is supplied directly; nested oblique and geocentric children are rejected.
Use `obliqueTransformation('longlat')` for a rotated geographic coordinate system.
See the [factory reference](../api-reference/projection-transform.md#remaining-projection-catalogue)
for accepted rotation parameter sets.

## Parameters and accuracy

`lon_0` and `lat_0` define an origin; `x_0` and `y_0` are false easting and northing
in meters; `k`/`k_0` are scale factors. Not every algorithm accepts every parameter.
`lat_ts` means a true-scale latitude where supported. Projection geometry is
separate from datum conversion, height and coordinate epoch; see the
[coordinate-system guide](coordinate-systems.md).

Construction checks supported parameters and prepares the operations. Coordinate
calls can still fail at singularities or outside grid coverage. Successful output
is not an area-of-use certificate. The [support contract](support.md) and
[independent references](../independent-validation.md) describe tested regions,
known numerical limits and intentional differences from upstream.
