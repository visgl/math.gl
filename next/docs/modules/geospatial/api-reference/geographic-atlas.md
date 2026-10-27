# Oblique ellipsoidal visibility and cut graphs

An orthographic map can show an ellipsoid from any direction. Its visible surface ends where the outward normal is perpendicular to the viewing direction. Clipping only latitude works for a polar view; an oblique view needs a curved horizon and correct polygon closure along that horizon.

`@math.gl/geospatial/geographic-atlas` adds this visibility consumer and a finite, shared cut graph for multi-chart maps. Source edges retain their declared linear, ellipsoidal geodesic or rhumb geometry. The optional entry adds no dependencies.

## Orthographic visibility[​](#orthographic-visibility "Direct link to Orthographic visibility")

```
import {createOrthographicCutAtlas} from '@math.gl/geospatial/geographic-atlas';



const {atlas, project, right, up} = createOrthographicCutAtlas({

  edgeModel: 'geodesic',

  viewDirection: [1, 2, 3] // ECEF Cartesian direction toward the distant observer

});

const inputs = [{positions: [-120, -40, 40, -40, 40, 70, -120, 70]}];

const projected = atlas.clipPolygon(inputs).map(p => p.rings.map(ring =>

  atlas.subdivideRing(inputs, ring, {

    transform: project, tolerance: 10, maxSegmentLength: 100000

  })

));
```

The projection returns surface coordinates in ellipsoid axis units (metres for WGS84), in the returned Cartesian `right`/`up` basis. These vectors and `viewDirection` are independent copies. The horizon is a true ellipsoidal silhouette, not a sphere substituted for the ellipsoid. Generated horizon curves are sampled as those curves, rather than endpoint geodesics.

This is parallel-ray **surface** visibility. It does not compute perspective camera horizons, elevated-object visibility, terrain occlusion or atmospheric refraction. The third source coordinate, if supplied, is an interpolated attribute; it does not change the visibility surface.

## Shared cut graph[​](#shared-cut-graph "Direct link to Shared cut graph")

Each boundary is a circle in **unit surface-normal space**: `dot(normalized(boundary.normal), surfaceNormal) = offset`. The offset defaults to zero. On an ellipsoid, its surface image is generally a curved geographic boundary. Orthographic horizons have offset zero; parallels are another special case. These are geodetic normals, not geocentric directions.

```
import {GeographicCutAtlas} from '@math.gl/geospatial/geographic-atlas';



const atlas = new GeographicCutAtlas({

  boundaries: [{id: 'split', normal: [0, 1, 0]}],

  charts: [

    {id: 'west', center: [1, -1, 0], cuts: [{boundary: 'split', side: -1}]},

    {id: 'east', center: [1, 1, 0], cuts: [{boundary: 'split', side: 1}]}

  ]

}, {edgeModel: 'rhumb'});
```

A chart intersects its oriented cuts (`side * (dot(normal, n) - offset) >= 0`) with an implicit closed hemisphere centered on `center`. Multiple charts cover broader geographic domains. Every pair of charts must have an oppositely oriented shared separator: this supplies a conservative certificate of disjoint interiors. Chart collections without that certificate reject, including overlapping views.

Use the same boundary ID on both sides of a shared cut. Duplicate coincident boundary definitions reject. IDs are nonempty, at most 128 characters; `@` is reserved for implicit hemispheres. The profile allows up to 64 declared cuts and 64 charts, each with up to 64 declared incidences. Offsets are finite, strictly between -1 and 1, with circle radius `sqrt(1-offset²) >= 1e-6` in normal space.

`atlas.graph` returns a reconstructible copy of the declared graph; `boundaryDefinitions` also includes implicit hemispheres referenced by output edges. `adjacency` lists candidate positive/negative chart incidences per shared declared boundary. It is not a claim that every pair in those lists shares a nonempty arc: the other chart constraints determine the retained arc extents.

This finite circle-boundary graph supports user-defined regional cells and faceted atlases. It does not accept arbitrary implicit-function callbacks, repair invalid polygon networks or supply projection formulas/net layouts for every interrupted map. Unresolved multiple junctions, near-coincident cuts and grazing configurations fail explicitly rather than receiving a guessed topology.

## A faceted-map consumer[​](#a-faceted-map-consumer "Direct link to A faceted-map consumer")

```
import {createOctahedralCutAtlas} from '@math.gl/geospatial/geographic-atlas';



const map = createOctahedralCutAtlas({edgeModel: 'geodesic'});

const pieces = map.atlas.clipPolygon(inputs);

const projected = pieces.map(p => ({

  chart: p.chart,

  rings: p.rings.map(r => map.atlas.subdivideRing(inputs, r, {

    transform: point => map.project(p.chart, point),

    tolerance: 0.0001

  }))

}));
```

The eight octants cover the entire normal sphere. Each face uses dimensionless normal-sphere gnomonic coordinates, with a finite denominator throughout its cell. This is a Gauss-map faceted projection; it does not replace an ellipsoid geodesic with a spherical great circle. `frames` supplies copied center/right/up vectors. Placement, rotation and scaling of the individual faces belong to the caller. `createOctahedralCutGraph()` supplies the plain graph for customization.

## Source geometry and output[​](#source-geometry-and-output "Direct link to Source geometry and output")

Constructor options follow the [latitude-cut profile](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/latitude-geographic-cuts.md), without `latitudeRange` or `seamLongitude`. WGS84 is the default; geodesics use `0.99 <= b/a <= 1.01`, rhumbs `0.5 <= b/a <= 2`, and axes are in `[1e-60, 1e60]`. `linearLongitude` retains supplied/shortest semantics. Input longitude limits, explicit polar-cap selection, simple outer-plus-contained-hole rings, winding, closure and work limits retain the [seam contracts](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geographic-seams.md). Global caps are explicit; arbitrary complements and polygon repair are not inferred.

`clipPolygon(inputs)` returns `{chart, rings}` components. Rings have:

* `positions`: explicitly closed packed longitude/latitude/attribute coordinates.
* `normals`: canonical unit normals, stride three, including closure.
* `vertexIds`: shared across charts **within this operation**.
* `edges`: one descriptor per consecutive vertex pair.

Descriptors are either `source` with original ring/edge indices and distance fractions, or `boundary` with its boundary ID and start/end circle angles in radians. Reversed edges have decreasing intervals. Source descriptors omit longitude shifts: geographic output coordinates use canonical longitude, and charts operate in normal space. Do not connect their geographic endpoints with straight chords.

Shared intersections are computed once for the whole operation. Matching IDs have identical normal coordinates across charts, and shared generated arcs retain the same circle parameterization with opposite orientation. This is per-feature atlas consistency, not persistent IDs or dataset-wide shared-border reconciliation across separate calls. Outer orientation follows the original input; holes have opposite orientation. Holes meeting a cut become notches; concave inputs can split into multiple components. Nested retained islands become separate components, with holes assigned to their immediate containing component. A chart completely covered by the input receives a generated closed boundary even when no original edge enters it.

`clipPolyline(positions, {longitudeTurns?})` retains source order and intervals, including repeated wound crossings. A coincident line is owned by the first eligible chart in declaration order; polygon boundaries retain their filled side. Isolated contacts emit no segment. A retained single point has no edges.

For `size > 2`, supply `boundaryAttributes` with exactly `size - 2` finite values. Original source attributes follow their original parameterization. Generated junction/auxiliary vertices use the declared boundary values, and generated arcs interpolate between their endpoints. These values do not model terrain heights.

## Resampling and numerical boundaries[​](#resampling-and-numerical-boundaries "Direct link to Resampling and numerical boundaries")

Use `subdivideRing(originalInputs, ring, options)` or `subdividePolyline(originalPositions, part, {...options, longitudeTurns})` on the same atlas that clipped the feature. The adapters support source sizes 2/3 and reuse the existing adaptive engine, preserve composed source intervals, and sample generated circle boundaries directly. Transforms must be finite and continuous on the selected chart. A canonical-longitude array alone does not provide a continuous Mercator chart across the dateline.

`maxSegmentLength` uses a conservative surface-distance bound in axis units, including for linear angular curves; it is not necessarily constant-speed distance on a generated boundary. `tolerance` remains the existing quarter/mid/three-quarter sampled target error criterion, not a certified bound for arbitrary transforms. Inputs, graph/options and descriptors are snapshots; callbacks cannot mutate an operation's saved source geometry. Output arrays and metadata copies are caller-owned.

Circle roots use stable discriminants/chord identities near small caps. Contacts certifiably outside the finite source arc are excluded before full-circle conditioning checks. Other curves use bounded normal speeds and second derivatives to exclude empty intervals and establish monotone root brackets. Solver error and conditioning still matter: this is not arbitrary finite-domain certification. Source circles indistinguishable from a boundary within 64 machine epsilons in normal-space geometry use coincident ownership; unresolved near-coincident crossings reject. Distinct cut events below `1e-12` radians, unresolved tangencies, inconsistent attributes or exhausted work reject with `GeographicSeamError`. No partial output is returned.

The shared qualification runs 480 pinned native GeographicLib 2.7 interval controls, two independent spherical area-conservation/shared-vertex controls and four independent ellipsoidal silhouette controls and twelve small-cap controls and one nested-island topology control and two finite-arc contact controls and one graph-incidence control in Node and Chromium/Firefox/WebKit. Native comparisons retain the existing `2e-12 * semiMajorAxis` along-track and `1e-10` degree latitude/conditioned-longitude gates. Independent area and silhouette residuals have `2e-12` gates. Additional regressions cover small caps, winding, coincidence, ownership, work limits and attribute snapshots.

Native compilation is offline only. CI verifies stored provenance; it installs no native library. Existing accuracy and bundle ceilings are unchanged; the new optional atlas entry has a separate 90 kB minified / 32 kB gzip ceiling. The clipping code and tests are original MIT math.gl work. GeographicLib/PROJ SPDX credits and packaged solver licenses remain intact; no runtime dependency is added.
