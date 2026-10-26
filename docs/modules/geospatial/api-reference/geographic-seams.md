# Geographic line and polygon seams

A longitude seam is a discontinuity in the map chart, not a gap in the globe.
Longitude unrolling keeps a route continuous numerically, but does not split it
into drawable pieces on either side of that discontinuity.

`splitGeographicPolyline` and `splitGeographicPolygon` split declared geographic
edges into a configurable 360-degree longitude chart. They use the selected
curve's seam intersections, rather than replacing curved edges with straight
longitude/latitude chords.

```ts
import {splitGeographicPolyline, splitGeographicPolygon} from '@math.gl/geospatial/globe';

const route = splitGeographicPolyline([170, 30, -170, 30], {
  edgeModel: 'geodesic'
});

const land = splitGeographicPolygon([
  {positions: [170, -20, 190, -20, 190, 20, 170, 20]},
  {positions: [175, -5, 185, -5, 185, 5, 175, 5]} // hole crossing the seam
], {edgeModel: 'linear'});
// The hole opens into notches in the two output components; it is not filled.
```

## Choose the edge model explicitly

| `edgeModel` | Semantics |
| --- | --- |
| `linear` | Straight longitude/latitude edges. `linearLongitude: 'supplied'` (default) preserves wide cell extents; `'shortest'` unwraps each edge along the shortest interval. |
| `geodesic` | Shortest endpoint geodesics, using WGS84 or the supplied `geodesic` solver. Antipodes follow that solver's deterministic choice. |
| `rhumb` | Constant-bearing edges, using WGS84 or the supplied `rhumb` solver. Optional `longitudeTurns` requests explicit winding. Exact poles are rejected by the rhumb solver. |

A closed coordinate array does not identify its edge semantics. In particular,
a full-world cell boundary must not silently become a narrow dateline polygon.

`seamLongitude` is the right edge of the output chart, default `180`. The chart
is `[seamLongitude - 360, seamLongitude]`. For example, `360` selects `[0,360]`;
a shifted projection's central meridian can select its corresponding seam.

`size` defaults to 2 and may be 2–64. The first two components are explicit
longitude/latitude degrees. Remaining finite scalar attributes interpolate by
original surface-distance fraction for geodesics/rhumbs, or linear fraction for
linear edges. Inputs and options are snapshots; output storage belongs to the
caller. Input longitudes and unrolled source endpoints are limited to `|longitude| <= 65536`
degrees in this numerical profile. Solver shape/accuracy restrictions still apply.

## Lines and provenance

Each line part has packed `Float64Array` `positions`, an `edges` array and its
original unrolled `world` index. Parts preserve source order. Seam-coincident
lines use the chart's left boundary. Exact geodesic pole passages are split into
incoming and outgoing meridian endpoints; pole longitude is a chart convention.

Each original output edge has this source descriptor:

```ts
{
  ringIndex, edgeIndex,
  startFraction, endFraction,
  longitudeShift
}
```

Fractions are in the original edge's parameterization. Add `longitudeShift` to
that independently unrolled source edge when resampling it in the output chart.
Polygon reversal can produce decreasing source intervals. Inserted polygon latitude
extrema retain the same original edge identity. Line `ringIndex` is zero.

These are curved-edge descriptors: two emitted vertices alone do not turn a
geodesic or rhumb into a linear longitude/latitude segment. Subdivide through the
chosen continuous projection after cutting. A fragment-local fraction `u` composes
as `startFraction + (endFraction - startFraction) * u`; retain the original
`edgeIndex` and `ringIndex` when interpolating external attributes. The adaptive
adapters use 2D/3D positions; carry additional attributes through these source
fractions rather than passing a larger stride to those adapters.

## Polygon topology and poles

Supply one outer ring followed by disjoint, contained holes. Rings may be
implicitly or explicitly closed. Output polygons contain an outer ring followed
by its holes, with explicitly closed packed positions. Outer orientation follows
the input; holes are oriented oppositely. Concave boundaries and repeated seam
crossings may produce multiple disconnected components. Holes crossing a seam
join its boundary as notches.

`edges[i]` describes the edge from vertex `i` to vertex `i+1`. A `null` entry marks
a generated seam or pole connector, not an invented original edge. Seam-aligned
source edges are assigned to the filled side; full-width periodic aliases cancel
in the interior, including meridians away from the selected seam and partially
overlapping source intervals. Original-edge attributes are preserved; generated edges connect
retained endpoints and have no original-edge fraction.

A once-winding polar ring must explicitly select `pole: 'north'` or `'south'`.
The ring must wind monotonically in longitude, and must not touch the selected
pole on its boundary. This chooses the cap/complement deliberately rather than
using a latitude-sign heuristic. For `size > 2`, supply `poleAttributes` (exactly
`size - 2` values) for generated pole vertices. Polar holes can exclude a pole
and produce a band without a fictitious pole edge.

```ts
const cap = splitGeographicPolygon([{
  positions: [-135, 60, -45, 60, 45, 60, 135, 60],
  pole: 'north'
}], {edgeModel: 'rhumb'});
```

Nonpolar rings must fit a single unrolled 360-degree chart. Multiply winding
polygons, non-monotone polar winding, self-intersecting input, touching/overlapping
holes and arbitrary global complements are outside this profile. The caller must
supply simple valid rings; this API is not a global validity checker or repair
operation. Detected graph ambiguities, inconsistent closing attributes and
unresolvable degeneracies reject instead of silently changing topology.

This tranche covers periodic meridian seams. Arbitrary interrupted-chart networks
remain with [MapEngine](../projection/api-reference/map-engine.md) and its explicit clipping
profiles. Projection-domain clipping and terrain following are separate from seam
splitting; choosing a seam does not make an invalid projection latitude valid.

## Accuracy, conditioning and work limits

Roots are bracketed on curve pieces monotone in latitude and longitude. The
selected numerical curve must converge to a fraction interval of at most four
machine epsilons, with latitude span and physical longitude span (longitude times
cosine latitude) each no greater than `1e-10` degrees. Exact sampled roots and
original endpoints are retained directly, apart from chart representation of
declared full-width longitude aliases. For a binary64 extent of exactly 360°,
the two aliases use one chart representation within bounded translation
roundoff (and the same angular budget). This normalizes a declared meridian;
unrelated nearby vertices are not snapped together. This is not a universal
physical-error certificate for every source solver/domain.

Near-meridional geodesics have ill-conditioned longitude intersections: nanometre
transverse differences between solvers can move a root farther along the seam.
Native controls therefore retain the existing 1 µm transverse physical-error
budget, measured with independently stored native azimuths. Ordinary roots also
have absolute `2e-10` degree latitude and `2e-13` fraction gates. Near-pole longitude
is assessed physically, rather than treating its coordinate singularity as a
large positional error. Native comparisons share the geodesic algorithm family;
spherical great-circle identities, solid angles, rhumb integrals, planar areas
and filled-set controls provide independent checks.

`maxVertices` (default 65536) bounds working/output vertices; `maxWork` (default
1000000, maximum 100000000) bounds edge visits and root/solver evaluations.
`maxIterations` defaults to 64, maximum 128. Limits apply across the operation,
including all polygon holes. Features without an interior resolvable above the
angular topology budget reject. If chart translation erases a nonzero seam
separation, it also rejects. No partial output or input mutation occurs on failure.

`GeographicSeamError` extends `RangeError` and has `reason: 'input' | 'precision' |
 'topology' | 'limit'`. Underlying solver domain errors, including
`RhumbDomainError`, propagate. No threshold is relaxed when a limit is exhausted.

The implementation and native workloads are original MIT math.gl code. Existing
PROJ/GeographicLib SPDX acknowledgements and packaged licenses are retained.
Native source compilation is offline only; CI uses stored, provenance-checked
controls. A shared 317-case matrix runs in Node, Chromium, Firefox and WebKit:
100 native rhumb adapter cases, 100 native rhumb seam cases, 110 interior
geodesic seam cases and seven independent sphere/topology controls. Qualification
reports retain per-case error budgets, source hashes and runtime versions.
No runtime package dependency is added.

## Global spherical map polygons

For directed spherical polygons that do not fit in one open hemisphere, use
[global spherical cuts](./global-geographic-cuts.md). They partition hemispheres,
complements and holes before the existing map engine's lobe/face/cap clipping.
This profile uses minor great-circle edges; the ellipsoidal/rhumb meridian seam
APIs above retain their own explicit edge semantics.
