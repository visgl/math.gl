# Ellipsoidal and rhumb latitude cuts

A map can accept only part of a geographic shape. A finite Mercator map needs a
latitude limit before projection; a north-polar orthographic view of a surface
retains the northern hemisphere. Cutting first prevents invisible geometry from
joining across the visible boundary.

The optional `@math.gl/geospatial/geographic-cuts` entry clips declared linear,
ellipsoidal geodesic or rhumb edges to a closed latitude band and a configurable
360-degree longitude chart. It preserves original curve intervals, holes and
components, and labels the generated parallel and meridian boundaries explicitly.
It adds no runtime dependencies. For oblique ellipsoidal horizons and finite shared circle-boundary graphs, use the
[geographic atlas](./geographic-atlas.md). Those capabilities remain separate from
this latitude-band API.

```ts
import {
  clipGeographicPolygon,
  subdivideGeographicCutRing
} from '@math.gl/geospatial/geographic-cuts';

const inputs = [{positions: [-60, -20, 60, -20, 60, 60, -60, 60]}];
const options = {
  edgeModel: 'geodesic' as const,
  latitudeRange: [0, 90] as const
};
const polygons = clipGeographicPolygon(inputs, options);

// North-polar orthographic projection of the WGS84 surface.
const a = 6378137;
const b = 6356752.314245179;
const e2 = 1 - (b / a) ** 2;
const transform = ([longitude, latitude]: readonly number[]) => {
  const phi = latitude * Math.PI / 180;
  const lambda = longitude * Math.PI / 180;
  const radius = Math.abs(latitude) === 90 ? 0 :
    a * Math.cos(phi) / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  return [radius * Math.sin(lambda), -radius * Math.cos(lambda)];
};
const projected = polygons.map(p => p.rings.map(ring =>
  subdivideGeographicCutRing(inputs, ring, {
    ...options, transform, tolerance: 10, maxSegmentLength: 100000
  })
));
```

For a finite Mercator map, choose a symmetric band such as `[-85, 85]` and provide
the intended Mercator transform instead. A geodesic may enter a band even when
both endpoints lie outside it: the implementation splits at latitude extrema
before finding intersections. Pre-projecting only the original vertices misses
these visible arcs.

## Input and domain

`GeographicClipOptions` requires `edgeModel: 'linear' | 'geodesic' | 'rhumb'` and
`latitudeRange: readonly [south, north]`, with `-90 <= south < north <= 90` in degrees.
`ellipsoid: {semiMajorAxis, semiMinorAxis}` defaults to WGS84. Both axes must be
finite and in `[1e-60, 1e60]`; the qualified geodesic shape is `0.99 <= b/a <= 1.01`
and the rhumb shape is `0.5 <= b/a <= 2`. Solvers are constructed from these axes,
so source and generated curves use a consistent surface.

The remaining options follow [geographic seams](./geographic-seams.md):
`size` (2–64), `seamLongitude` (default 180), `linearLongitude`, `maxVertices`,
`maxWork` and `maxIterations`. Geographic coordinates are `[longitude, latitude,
...attributes]`; finite attributes interpolate by original curve distance fraction.
Exact poles are accepted for geodesics/linear edges; original rhumb endpoints at
poles are rejected by the rhumb solver. Input longitude and unrolled endpoints
are bounded by 65536 degrees in magnitude.

Polygon inputs are one simple outer ring followed by contained, disjoint holes,
using the same implicit/explicit closure, winding and declared polar-cap contracts
as the seam API. `longitudeTurns` belongs to each polygon ring; lines accept it
in the options. A polar ring must declare `pole` and, for extra attributes,
`poleAttributes`. Nonpolar polygons must fit one unrolled longitude chart.
Self-intersection repair, touching/overlapping holes, multiply winding polygon
complements and arbitrary ellipsoidal global topology are not supported.

## Output and provenance

`clipGeographicPolyline(positions, options)` returns the existing
`GeographicSeamPolyline[]`: packed positions, original `world` index, and source
edge intervals. Positive-length arcs on the band boundary are retained. An
isolated endpoint/tangent contact emits no line segment. A single point is retained
when it lies inside the closed band.

`clipGeographicPolygon(rings, options)` returns `GeographicCutPolygon[]`. Each
polygon has explicitly closed `rings`; each ring has packed `positions` and one
`edges[i]` descriptor for the edge from vertex i to i+1:

| Kind | Meaning |
| --- | --- |
| `source` | Original `source: {ringIndex, edgeIndex, startFraction, endFraction, longitudeShift}`; decreasing fractions represent reversed orientation. |
| `parallel` | Generated constant `latitude` boundary, not an endpoint geodesic. |
| `meridian` | Generated constant `longitude` chart closure. |
| `pole` | Coordinate connector at `latitude: -90 | 90`; zero surface length. |

Holes meeting a cut become notches; other holes remain holes. Concave inputs may
produce disconnected polygons. Boundary-coincident polygon edges survive only on
the retained filled side. Inputs/options are snapshots and output arrays are owned
by the caller. No partial result is returned on failure.

## Adaptive projection

Pass each output ring, **the same original input rings**, model and axes to
`subdivideGeographicCutRing`. It resamples the original source interval and keeps
generated parallels constant in latitude. Treating every generated boundary as a
geodesic would bow a parallel away from the requested band.

This helper supports source and target coordinate sizes 2 or 3. It reuses the
existing generic subdivision engine, including `tolerance`, `maxDepth`,
`maxVertices`, and `maxSegmentLength`. Segment lengths are in ellipsoid axis units
for geodesic/rhumb geometry; for linear geometry they are Euclidean distances in
the supplied coordinate/attribute units. Generated meridians use physical meridian
distance and generated parallels use rhumb distance. Generated boundary attributes
interpolate between retained endpoints; this does not model terrain.

The result includes projected `positions`, geographic `sourcePositions`, generic
segment indices/fractions, and one composed `GeographicCutEdge` per sampled edge.
Source fractions still refer to the original input edge. The helper snapshots
inputs, descriptors, axes and settings before invoking the transform callback.

Tolerance is a quarter/mid/three-quarter sampled target-space criterion, not a
certified bound for arbitrary transforms. The caller must provide a finite,
continuous projection on each cut chart and suitable segment/depth limits.
Surface latitude cuts do not compute elevated, oblique or terrain visibility.

## Accuracy and qualification

Roots use monotone source-curve brackets and the existing seam convergence gates;
only computed cut endpoints are assigned the exact requested boundary coordinate.
Unrelated nearby vertices are not welded. Ambiguous graph topology, unresolvable
precision and exhausted work reject using `GeographicSeamError` (`input`,
`precision`, `topology`, `limit`); underlying solver errors propagate.

The shared Node/Chromium/Firefox/WebKit qualification has 300 pinned native
GeographicLib 2.7 controls, five independent linear filled-area controls, three
spherical great-circle latitude identities, and two polar orthographic closure
controls. Native interval endpoints have a `2e-12 * semiMajorAxis` along-track
gate and `1e-10` degree latitude / physically conditioned longitude gates. The
native root discovery uses a separate dense sign-change search; it is a comparison
matrix, not a proof of global intersection completeness. Analytic circle radii and
sagitta checks test the generated parallel through projection independently.

Native compilation is offline only. CI verifies stored fixture provenance and
runs the controls without installing GeographicLib or PROJ. Original MIT clipping
and adapter code reuses the existing attributed solvers; their GeographicLib/PROJ
SPDX acknowledgements and packaged licenses are retained. Existing accuracy and
selective bundle budgets remain unchanged. The optional cut-plus-subdivision entry
has its own 80 kB minified / 29 kB gzip ceiling.

For global **spherical** complements and interrupted map layouts, see
[global spherical cuts](./global-geographic-cuts.md).
