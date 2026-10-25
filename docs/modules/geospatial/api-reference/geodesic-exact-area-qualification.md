# Exact geodesic edge-area and polygon qualification

`EllipsoidGeodesicExact` now optionally computes `S12`; `GeodesicPolygonExact`
combines those edges with the existing compensated perimeter/area accumulator.
The explicit elliptic solver profile remains `0.25 ≤ b/a ≤ 4`, axes in
`[1e-60, 1e60]`, input longitude magnitude at most `1e6` degrees, and signed
line arcs through two auxiliary-sphere circuits. Point insertion selects an
inverse shortest-path candidate; a cut locus does not imply route uniqueness.

## Controls and unchanged budgets

- **2,464 native rows** pin GeographicLib 2.7, binary64 precision, the source
  archive SHA, API driver, builder and generator. Direct/arc/inverse edges and
  polygons cover seven shapes at four scales, poles, antipodes, dateline
  crossings, signed distances, complete circuits, self-intersections, reversal,
  unsigned complements and repeated vertices. An additional 1,400 deterministic
  inverse inputs include the prolate/polar conditioning regressions.
- **77 independent controls** use 120-digit Decimal arithmetic, without the
  production quadrature or native implementation: exact full-circuit polar
  identities, ellipsoidal equator/pole
  patches from analytic surface area, exact spherical right triangles, and tiny
  equatorial triangle/short-direct-edge limits. For the small ellipsoidal cases,
  the local metric gives `b² δ² / 2` for the triangle and `s² / 4` for a 45-degree
  edge. The omitted relative terms are order `δ²` with shape bounded by this
  profile; inputs at most `1e-4` degree keep them well below the relative gate.
- Existing G4 area ceilings stay unchanged: ordinary edge area `5e-14 a²`,
  polygon area `5e-14 a² × max(1, inserted count)`, and tiny area `2e-8` relative
  with floors `1e-28 a²` for edges and `1e-27 a²` for polygons. Short direct
  edges use the relative gate without a floor; independent sphere areas retain
  the `1e-29 a²` floor. Length remains
  `4e-13 a` per edge. A repeated 1,000-loop tiny triangle tests accumulation.
- Unsigned area is a value modulo the full surface. At an exactly zero,
  self-cancelling boundary, last-bit errors can select zero or a value just below
  the full surface. Those zero-reference unsigned controls compare modulo the
  surface; signed cancellation still has its ordinary absolute gate. This does
  not replace the independent relative gates for tiny nonzero polygons.

The formula decomposition credits GeographicLib's `I4` correction and stable
azimuth difference. Original adaptive integration evaluates the smooth correction;
a derivative integral avoids a nearly equal divided-difference subtraction.
Short-edge longitude uses cross/dot differences instead of subtracting near-pi
phases, pure meridians preserve exact longitude jumps, and area-requested inverse
refinement accounts for distance scale and angular roundoff. Inverse area is
evaluated from the more polar endpoint to avoid amplifying terminal-bearing
roundoff near prolate poles. No flattening series
is used for the area correction. Existing non-area and G8/G9 controls remain gates.

## Reproduce

Ordinary CI uses stored controls and provenance checks, with no native build or
network download. Qualification runs in Node, Chromium, Firefox and WebKit, with
per-field errors/budgets and provenance retained as artifacts.

```sh
python3 modules/geospatial/scripts/generate-exact-area-reference.py --check
python3 modules/geospatial/scripts/generate-exact-area-independent.py --check
node modules/geospatial/scripts/qualify-exact-area.mjs --output /tmp/exact-area.json
node modules/geospatial/scripts/check-g89-package.mjs
```

Offline native regeneration uses the same pinned archive as G8/G9:

```sh
python3 modules/geospatial/scripts/build-exact-area-native.py \
  --archive /path/to/geographiclib-r2.7.tar.gz --output /tmp/exact-area-native
python3 modules/geospatial/scripts/generate-exact-area-reference.py \
  --native /tmp/exact-area-native
```

This is sampled qualification, not a guarantee for every binary64 input or every
nearly cancelling polygon. General near-zero-area conditioning, arbitrary-length
edges, extreme shapes outside the profile, and global triaxial inverse geometry
remain separate. Existing selective size budgets are unchanged. No new package
dependency, runtime native code or model download is introduced. GeographicLib
SPDX acknowledgements and packaged MIT terms cover the formula adaptations.
