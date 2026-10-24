# Projection catalog

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Use the same rendering pipeline for a Robinson world map, an interrupted map,
a satellite view, or a polyhedral net. `MapEngine` owns geographic coverage,
seam splitting, inverse candidates, viewport fitting and globe transitions.

```typescript
import {MapEngine, MAP_PROJECTIONS} from '@math.gl/geospatial/discontinuous';

const map = new MapEngine({
  version: 1,
  id: 'interrupted-sinu-mollweide',
  definition: {type: 'projection', projection: 'interrupted-sinu-mollweide'}
});
const pieces = map.projectPolygon([coastline]);
const viewport = map.fit({width: 960, height: 600, padding: 24});
```

`MAP_PROJECTIONS` contains 95 names: all **94 named default constructors** in
**d3-geo-projection 4.0.0**, plus uninterrupted quartic authalic. Ice Age Explorer's
**Projection catalog** group exposes every entry. This is projection-family and
named-preset coverage, not a drop-in replacement for D3's JavaScript API.

## Catalog API

<span class="badge">From v5.0 · Experimental</span>

- `MapProjection`: the union of catalog names.
- `MAP_PROJECTIONS`: the frozen, readonly list of those names.
- `ProjectionMapOptions`: `{projection: MapProjection, radius?: number}`.
- `createProjectionMap(options)`: returns a lower-level `DiscontinuousMap`.
- `MapDefinition`: `{type: 'projection', projection: MapProjection}` selects the
  same preset in `MapEngine`; output scale comes from `MapDescription.radius`.

Inputs are spherical longitude/latitude in degrees. Outputs use north-positive y
and a positive radius scale, not D3's pixel translation, screen-y reflection,
`.center()` or `.angle()` display settings. Use `fit()` for display placement.
Polyhedral nets may differ by a rigid planar orientation; HEALPix retains
math.gl's radian-based scale. These do not change geographic coverage or shape.

Catalog names use lowercase hyphenated names: `natural-earth2`, `van-der-grinten3`,
`modified-stereographic-alaska`, `two-point-equidistant-usa`, and so on. The three
polyhedral names are `butterfly`, `collignon-butterfly`, and `waterman`.
See [world maps](./README.md#world-maps) for the 64 ordinary formula names.

## Coverage and configuration

| Family | Named catalog presets | Configuration / limits |
| --- | --- | --- |
| Ordinary world formulas | 64, including Aitoff, Bertin 1953, Eckert I–VI, Gilbert, rectangular Gringorten, Hammer, Hufnagel, Hyperelliptical, Robinson and Wagner variants | `createWorldMap` / `type: 'world'` exposes formula parameters and a central meridian. These are spherical formulas, separate from the scalar ellipsoidal CRS API. |
| Regional cap-clipped maps | `airy`, `craig`, `littrow`, `satellite` | The cap applies to points, lines, polygons, picking and layout. A satellite's back hemisphere is excluded. |
| Modified stereographic | `modified-stereographic-alaska`, `modified-stereographic-gs48`, `modified-stereographic-gs50`, `modified-stereographic-miller`, `modified-stereographic-lee` | Native geographic aspects and default D3 caps. GS50 can fold near the edge of its cap; inverse positions need not recover the original branch there. |
| Control-point maps | `chamberlin-africa`, `two-point-azimuthal-usa`, `two-point-equidistant-usa` | Generic control-point versions are available through `createRegionalMap`. |
| Specialized domains | `armadillo`, `hammer-retroazimuthal`, `wiechel` | Armadillo clips its curved visible domain instead of drawing D3's displaced hidden coordinates. Hammer retains separate sides of its hemisphere cuts. |
| Interrupted maps | `interrupted-sinusoidal`, `interrupted-mollweide`, `interrupted-homolosine`, `interrupted-boggs`, `interrupted-sinu-mollweide`, `interrupted-quartic-authalic`, `interrupted-mollweide-hemispheres` | Catalog entries use D3's native lobe layouts and aspects. Sinu-Mollweide cuts begin at 35° N and 10° S in its oblique frame. Older direct `interrupted-*` definitions retain their documented layouts for compatibility. |
| Segmented and star maps | `guyou`, `peirce-quincuncial`, `gringorten-quincuncial`, `berghaus`, `gingery`, `healpix` | Catalog quincuncials and Gingery use D3's native geographic aspects; existing direct definitions retain their equatorial aspects. |
| Polyhedral maps | `butterfly`, `collignon-butterfly`, `waterman` | Default nets. Exact Gray–Fuller, Petroff, Snyder and myriahedral maps remain available through their existing MapEngine definitions. |
| Generic D3 builders | `geoInterrupt`, `geoPolyhedral`, `geoQuincuncial` are not catalog entries | Use configurable interruptions, custom charts or myriahedral meshes. Arbitrary D3 callbacks and arbitrary per-lobe interruption latitudes are not imported. |
| D3 utilities and core d3-geo | `geoProject`, `geoQuantize`, `geoStitch`, streaming and CLI tools are not catalog entries | This catalog targets d3-geo-projection, not all d3-geo APIs. It does not provide drop-in D3 streams or deck.gl geographic-layer compatibility. |

## Regional API

<span class="badge">From v5.0 · Experimental</span>

`createRegionalMap(options)` and `{type: 'regional', ...options}` expose regional
configuration. `RegionalProjection`, `RegionalMapOptions`, and the readonly
`REGIONAL_PROJECTIONS` preset list are exported from the discontinuous entrypoint.
The engine takes radius from its description; the lower-level factory accepts
`radius` directly. Unsupported option keys and invalid values throw.

| Projection | Options |
| --- | --- |
| `airy` | `beta: 90` degrees, strictly between 0 and 180; this corresponds to D3's Airy radius accessor, not output radius. Optional `center: [longitude, latitude]`. |
| `craig` | `parallel: 0`, strictly between −90 and 90; optional `center`. The exact horizon is not uniquely invertible. |
| `littrow` | Optional `center`; cap 89.999°. Distortion grows sharply near the horizon. |
| `satellite` | `distance: 2` in Earth radii, greater than 1; `tilt: 0` degrees; optional `center`. Tilt is restricted to keep the horizon away from the camera plane. |
| `armadillo` | `parallel: 20`, strictly between 0 and 90°. |
| `hammer-retroazimuthal` | `parallel: 45`, strictly between −90 and 90°. |
| `modified-stereographic` | Required `coefficients: [[real, imaginary], ...]`, 1–32 finite pairs; optional `center`; cap 90°. Arbitrary polynomials may fold. |
| `chamberlin` | Required three distinct, nondegenerate `controlPoints`, in longitude/latitude degrees; cap 90°. |
| `two-point-azimuthal` | Required two distinct, non-antipodal `controlPoints`; finite cap 89.999°. |
| `two-point-equidistant` | Required two distinct, non-antipodal `controlPoints`; cap 90°. |

Named regional presets retain their native parameters and control frames. Use the
generic variants when configuring coefficients or control points. An inverse
returns valid chart candidates, not a guarantee of a globally one-to-one formula.
At collapsed horizons or polynomial folds, a candidate can differ from the
original source. Preserve `sourceCoordinates` for rendering and animation.

## Geometry and numerical limits

Edges are minor great-circle arcs. Polygon inputs must fit an open hemisphere;
split larger polygons first. Clipped horizon curves are sampled, and returned
polygons stay closed with matching source coordinates. Sampling has a bounded
work limit; an impractically tight tolerance throws instead of running indefinitely.
Some formulas stretch a geographic pole into an edge: retain directional polar
longitude and draw the returned pieces independently.

`DiscontinuousMap.getRegionOutlines(regionId, sampling?)` returns sampled visible
coverage rings or edge parts for that chart. Layout fitting uses it so regional
caps contribute their actual outline rather than an unclipped computational
triangle. It is also new in v5.0 and experimental.

## References and attribution

The catalog follows [d3-geo-projection 4.0.0](https://github.com/d3/d3-geo-projection/tree/v4.0.0)
and its [projection descriptions and historical references](https://github.com/d3/d3-geo-projection/blob/v4.0.0/README.md).
Credit **Mike Bostock and the D3 contributors**, including the authors credited
within individual source files. Their implementation work is distinct from the
historical cartographers after whom the projections are named.

Numerical kernels are adapted under the retained ISC license. Spherical cap
clipping is adapted from [d3-geo 3.1.1](https://github.com/d3/d3-geo/tree/v3.1.1/src/clip),
also ISC; math.gl adds bounded sampling, source correspondence, chart trimming,
regional layout integration and inverse safeguards. Adaptive Simpson integration
retains **Ricky Reusser's** MIT attribution. See the packaged
[third-party inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md)
for file-level notices and modifications. There is no D3 runtime dependency.

Reference fixtures are generated from separate, version-pinned upstream installs.
Tests cover every named default constructor's forward shape and native aspect,
plus coverage, inverse residuals, cuts, poles, polygon clipping and renderer meshes.
These tests establish the documented numerical contract, not bitwise equivalence
or support for every D3 accessor combination. Nico Belmonte's application code is
not used.
