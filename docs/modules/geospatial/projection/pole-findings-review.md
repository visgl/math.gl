# Review of all 49 retained PROJ findings

Every configuration with a finding at revision `64b7fe33` is listed below. The review found real accuracy gaps in **seven kernels**: LAEA, stereographic, oblique stereographic, spherical AEQD, QSC, Mollweide and polyconic. **22 of the 49 configurations receive a numerical fix.** Some have both a fixed math.gl error and a separate retained oracle/domain difference.

The unchanged native PROJ audit still has **44 configurations with discrepancies** over 144 configurations / 5,579 probes. This is a discrepancy count, not an unfixed-bug count. Every retained configuration has a reviewed disposition; none is promoted into an accuracy pass. The baseline gate still rejects new coordinates, changed rejection policies and worsened measured errors. Cross-engine near-pole allowances are consumed one-to-one, so one baseline finding cannot permit failures to spread across meridians. Albers and equidistant conic retain unweighted longitude wherever their exact pole maps to an arc; only collapsed pole geometry permits cosine weighting. Updated ceilings record the reviewed formula corrections; the independent precision gates prevent a blanket relaxation.

## Independent numerical evidence

The offline generator evaluates original equations with **mpmath 1.3.0 at 80 decimal digits**, alongside **pyproj 3.7.2 / PROJ 9.5.1**. Runtime packages and CI need neither tool. No package dependency is added. Native raw-operation controls omit the engine-only `datum=none` policy and specify WGS84 axes explicitly where needed; each oracle operation is recorded. All inverse expectations start from the **exact stored binary64 x/y**, independently of math.gl; forward inputs are the stored geographic controls. Native coordinates remain in the fixtures and reports. The generator and review/source hashes are checked in CI.

The 303 precision controls include exact and near poles in both hemispheres, ordinary controls, the original retained numerical probes, and the existing native Mollweide controls. Some inputs repeat to preserve their provenance. The old runtime is measured from `64b7fe33`. Values below are maxima over these controls, not global error bounds. Forward errors are metres; inverse errors are latitude degrees. Additional tests check physical longitude contribution, Float64 XYZM preservation, all four equatorial QSC face centres and polyconic/orthographic reprojection residuals.

| Method | Controls | Forward: before / after / PROJ | Inverse latitude: before / after / PROJ |
| --- | --- | --- | --- |
| laea | 100 | 1.872e-1 / 9.313e-9 / 2.250e-1 | 8.500e-7 / 1.279e-13 / 2.020e-7 |
| stere | 22 | 7.451e-9 / 7.451e-9 / 2.235e-8 | 1.000e-6 / 1.421e-14 / 1.000e-6 |
| aeqd | 26 | 1.863e-9 / 1.863e-9 / 5.588e-9 | 2.074e-7 / 1.421e-14 / 8.538e-7 |
| moll | 140 | 1.186e+1 / 1.976e-7 / 1.252e+1 | 1.462e-7 / 1.609e-11 / 1.462e-7 |
| qsc | 8 | 2.145e-2 / 1.315e-9 / 2.145e-2 | 1.519e-7 / 1.421e-14 / 1.519e-7 |
| sterea | 7 | 1.490e-8 / 1.490e-8 / 7.451e-9 | 1.000e-6 / 1.421e-14 / 4.763e-7 |

For the pole-conditioned Mollweide controls, the ordinary native-reference test now checks the unchanged forward tolerance against the **tighter independent 80-digit expectation**. It retains the original PROJ coordinates for independent inverse testing and the audit. The separate precision tests enforce a 0.2 micrometre forward ceiling; no native tolerance is widened to make an oracle artifact pass.

## Corrections made

- **LAEA:** evaluate the authalic pole complement without subtracting nearly equal integrals; retain its cosine; invert the exact authalic integral with bounded Newton steps instead of the truncated inverse series. Use the same stable latitude in rendering bounds.
- **Stereographic, oblique stereographic and spherical AEQD:** recover inverse latitude with a full Cartesian rotation and `atan2`, retaining the horizontal components that `asin` discards near a pole.
- **QSC:** evaluate face-centre distances with half angles, preserve sine components in the inverse, and use `atan2` for spherical/geodetic latitude. Independent analytic axis tests cover all four equatorial faces; the precision corpus covers both polar faces.
- **Mollweide:** solve a stable pole-complement equation, retain small latitude offsets even when `sin(latitude)` rounds to one, use exact mathematical constants, and reject inverses outside the map ellipse. Only the exact pole collapses to zero relative easting.
- **Polyconic:** use the polar tangent-plane inverse limit to remove centimetre-scale residuals, share meridional-radius quadrature to remove the old truncated meridian series, and tighten bounded inverse convergence. A bounded eight-update refinement of the original northing at fixed easting verifies the planar residual after the angular solve, avoiding false rejection or acceptance when angular updates stall at binary64 roundoff. Native forward coordinates that PROJ cannot invert must still reproject within a millimetre in our evidence tests.

These corrections are original math.gl arithmetic around the existing attributed ports. Existing proj4js/PROJ SPDX credits and packaged licenses remain; no additional upstream implementation is copied in this review.

## Why the other discrepancies remain

**Native inverse quirks.** [Albers' native inverse](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/aea.cpp) uses a fixed authalic pole cutoff that snaps the retained ±89.99° controls to ±90°. [CEA](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/cea.cpp) and [LAEA](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/laea.cpp) combine rounded authalic values with an inverse series. Equal Earth also returns pole latitudes several microdegrees short. Mollweide's pole iteration leaves a nonzero easting at exact poles. [Robinson's native inverse](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/robin.cpp) has interval/knot discrepancies at the retained 5° knots. We retain exact-pole/knot mathematics rather than reproduce those artifacts; their original native outputs remain inspectable.

**Rounded boundaries.** At the opposite-pole LAEA disk edge and the equatorial orthographic limb, a tiny change in projected coordinates can produce a large inverse angular change. In some stored northings the pole offset is below one ulp. No algorithm can reconstruct information absent from the input. Tests retain bounded ulp acceptance and forward residuals, with no uniform inverse-angle guarantee at these boundaries.

**Native inverse failures.** PROJ rejects some of its own near-pole polyconic and visible orthographic forward values. The review tests verify the geographic controls and forward residuals for math.gl's accepted inverses. This is separate from the polyconic residual bug fixed above.

**Intentional singularity/visibility policy.** Mercator poles and stereographic antipodes have infinite projected radius; a finite value from floating-point `pi/2` is not the mathematical limit. The AEQD antipode has no unique azimuth, so math.gl rejects it rather than assign a longitude-dependent ring convention. [Native spherical GEOS](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/geos.cpp) omits the visibility inequality enforced by its ellipsoidal branch. The retained sphere probes lie behind the horizon: their native inverses move by more than ten latitude degrees to the visible intersection. An independent satellite dot-product test verifies our rejection.

**QSC selected face.** [PROJ's QSC documentation](https://proj.org/en/stable/operations/projections/qsc.html) defines a projection onto one selected cube side. The original retained inverse findings are at its opposite pole, outside the selected square. That raw extension remains ill-conditioned; no new rejection is introduced. New own-face forward differences are the independently verified correction to native cosine cancellation, not an accuracy regression. For the already recorded opposite-pole inverse probes only, the cross-engine gate uses an explicit sqrt(32 × binary64 epsilon) angular ceiling plus a 64 × epsilon × semi-major-axis reprojection ceiling. A percentage of one JavaScript engine’s ill-conditioned angular error is not reproducible; no new coordinate, own-face allowance or rejection change is accepted.

## Configuration-by-configuration disposition

“Findings” counts coordinate/direction disagreements before and after this review; one configuration may have more disagreements after a mathematically verified correction. The complete original probes, definitions, dispositions and fix identifiers are in `pole-audit-review.json`; measured current differences are in `pole-audit-findings.json`.

| Configuration | Findings before → after | Accuracy fix | Disposition | Evidence and decision |
| --- | --- | --- | --- | --- |
| `aea-north` | 6 → 6 | No new formula change | native-pole-cutoff | PROJ inverse snaps ±89.99° to ±90°; math.gl retains the roundoff-sized cutoff and recovers the original latitude. |
| `aea-south` | 6 → 6 | No new formula change | native-pole-cutoff | PROJ inverse snaps ±89.99° to ±90°; math.gl retains the roundoff-sized cutoff and recovers the original latitude. |
| `aea-tangent` | 6 → 6 | No new formula change | native-pole-cutoff | PROJ inverse snaps ±89.99° to ±90°; math.gl retains the roundoff-sized cutoff and recovers the original latitude. |
| `laea-0-ellipsoid` | 6 → 9 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea-45-ellipsoid` | 6 → 9 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea--45-ellipsoid` | 6 → 9 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea-90-ellipsoid` | 3 → 6 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea-90-sphere` | 1 → 1 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea--90-ellipsoid` | 3 → 6 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `laea--90-sphere` | 1 → 1 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `stere-45-ellipsoid` | 1 → 0 | Yes | accuracy-fixed | Cartesian spherical/conformal inverse rotation removes the avoidable asin pole cancellation. |
| `stere-45-sphere` | 2 → 0 | Yes | accuracy-fixed | Cartesian spherical/conformal inverse rotation removes the avoidable asin pole cancellation. |
| `stere--45-ellipsoid` | 1 → 0 | Yes | accuracy-fixed | Cartesian spherical/conformal inverse rotation removes the avoidable asin pole cancellation. |
| `stere--45-sphere` | 2 → 0 | Yes | accuracy-fixed | Cartesian spherical/conformal inverse rotation removes the avoidable asin pole cancellation. |
| `stere-90-ellipsoid` | 3 → 3 | No new formula change | singular-antipode | The exact opposite pole has infinite stereographic radius. Native finite ~1e23 metre outputs are a floating-point artifact; math.gl deliberately rejects the singularity. |
| `stere--90-ellipsoid` | 3 → 3 | No new formula change | singular-antipode | The exact opposite pole has infinite stereographic radius. Native finite ~1e23 metre outputs are a floating-point artifact; math.gl deliberately rejects the singularity. |
| `aeqd-45-sphere` | 3 → 3 | Yes | native-pole-roundoff | The exact geographic pole has no unique longitude. Native inverse returns a displaced latitude and arbitrary longitude; independent 80-digit inversion checks the exact stored planar coordinates. |
| `aeqd--45-sphere` | 3 → 3 | Yes | native-pole-roundoff | The exact geographic pole has no unique longitude. Native inverse returns a displaced latitude and arbitrary longitude; independent 80-digit inversion checks the exact stored planar coordinates. |
| `aeqd-90-ellipsoid` | 3 → 3 | No new formula change | nonunique-antipode | At the antipode the azimuth is nonunique. Native chooses a longitude-dependent ring convention; math.gl deliberately rejects it. |
| `aeqd--90-ellipsoid` | 3 → 3 | No new formula change | nonunique-antipode | At the antipode the azimuth is nonunique. Native chooses a longitude-dependent ring convention; math.gl deliberately rejects it. |
| `stere-true-scale-north` | 3 → 3 | No new formula change | singular-antipode | The exact opposite pole has infinite stereographic radius. Native finite ~1e23 metre outputs are a floating-point artifact; math.gl deliberately rejects the singularity. |
| `stere-true-scale-south` | 3 → 3 | No new formula change | singular-antipode | The exact opposite pole has infinite stereographic radius. Native finite ~1e23 metre outputs are a floating-point artifact; math.gl deliberately rejects the singularity. |
| `sterea-ellipsoid` | 3 → 0 | Yes | accuracy-fixed | Cartesian inverse rotation retains the small horizontal component instead of applying asin to a rounded pole sine. |
| `cea-ellipsoid` | 6 → 6 | No new formula change | native-pole-roundoff | Native authalic inverse is a truncated series and can return 89.99999879797518° at the pole. Rounded binary64 northings cannot reliably distinguish the closest pole probes; math.gl retains exact-pole handling. |
| `eqearth-ellipsoid` | 12 → 12 | No new formula change | native-pole-roundoff | PROJ inverse Newton/asin arithmetic returns a pole latitude about 6.7 microdegrees short. math.gl preserves exact map-pole handling with a bounded ulp clamp; nearby northings can be indistinguishable in binary64. |
| `eqearth-sphere` | 12 → 12 | No new formula change | native-pole-roundoff | PROJ inverse Newton/asin arithmetic returns a pole latitude about 6.7 microdegrees short. math.gl preserves exact map-pole handling with a bounded ulp clamp; nearby northings can be indistinguishable in binary64. |
| `moll-ellipsoid` | 6 → 12 | Yes | native-pole-iteration | Native iteration leaves nonzero easting at exact poles and also loses nearby latitude offsets when sin(latitude) rounds to one. An original pole-complement solve preserves those offsets and exact constants; a bounded inverse rejects points outside the map. |
| `moll-sphere` | 6 → 12 | Yes | native-pole-iteration | Native iteration leaves nonzero easting at exact poles and also loses nearby latitude offsets when sin(latitude) rounds to one. An original pole-complement solve preserves those offsets and exact constants; a bounded inverse rejects points outside the map. |
| `robin-ellipsoid` | 66 → 66 | No new formula change | native-inverse-knot | All findings are at exact 5° table knots. math.gl retains exact-knot inverse corrections to the same PROJ forward coefficient table; PROJ inverse can select/refine the adjacent cubic interval incorrectly. |
| `robin-sphere` | 22 → 22 | No new formula change | native-inverse-knot | All findings are at exact 5° table knots. math.gl retains exact-knot inverse corrections to the same PROJ forward coefficient table; PROJ inverse can select/refine the adjacent cubic interval incorrectly. |
| `poly-ellipsoid` | 7 → 16 | Yes | native-inverse-failure | PROJ rejects its own near-pole forward values. math.gl also had centimetre-scale inverse residuals: an original polar tangent-plane limit fixes them, and shared quadrature removes the truncated meridian series. Geographic controls and submillimetre forward residuals verify the accepted inverses. |
| `poly-sphere` | 12 → 13 | Yes | native-inverse-failure | PROJ rejects its own near-pole forward values. math.gl also had centimetre-scale inverse residuals: an original polar tangent-plane limit fixes them, and shared quadrature removes the truncated meridian series. Geographic controls and submillimetre forward residuals verify the accepted inverses. |
| `ortho-ellipsoid` | 2 → 2 | No new formula change | native-inverse-failure | PROJ inverse fails at some finite visible polar forward values. math.gl uses an ellipsoid-ray intersection; the equatorial limb also needs a bounded ulp discriminant tolerance. |
| `geos-x-true` | 18 → 18 | No new formula change | hidden-hemisphere | These near-pole points fail the independent satellite visibility inequality. Native spherical forward returns the hidden intersection, whose inverse moves to the visible hemisphere; math.gl intentionally rejects it. |
| `geos-y-true` | 18 → 18 | No new formula change | hidden-hemisphere | These near-pole points fail the independent satellite visibility inequality. Native spherical forward returns the hidden intersection, whose inverse moves to the visible hemisphere; math.gl intentionally rejects it. |
| `qsc-4` | 4 → 5 | Yes | native-face-roundoff | Original inverse findings are at the opposite pole outside the selected cube face, where the raw extension is ill-conditioned. Corrected own-face forward values also differ because native 1-cos(phi) cancels near the centre. Original half-angle/atan2 corrections are independently qualified; no new raw rejection is introduced. |
| `qsc-5` | 4 → 7 | Yes | native-face-roundoff | Original inverse findings are at the opposite pole outside the selected cube face, where the raw extension is ill-conditioned. Corrected own-face forward values also differ because native 1-cos(phi) cancels near the centre. Original half-angle/atan2 corrections are independently qualified; no new raw rejection is introduced. |
| `merc-ellipsoid` | 6 → 6 | No new formula change | singular-pole | Mercator tends to infinity at ±90°. Native finite ~242 million metre outputs arise from evaluating the floating approximation to π/2. math.gl deliberately rejects exact poles. |
| `merc-sphere` | 6 → 6 | No new formula change | singular-pole | Mercator tends to infinity at ±90°. Native finite ~242 million metre outputs arise from evaluating the floating approximation to π/2. math.gl deliberately rejects exact poles. |
| `laea-dense-domain` | 6 → 9 | Yes | native-pole-roundoff | Native authalic subtraction and inverse disk-edge arithmetic lose pole information. Original pole-complement and Cartesian inverse fixes are independently checked at 80 digits; opposite-pole disk inversion remains ill-conditioned. |
| `merc-edge-domain` | 4 → 4 | No new formula change | singular-pole | Mercator tends to infinity at ±90°. Native finite ~242 million metre outputs arise from evaluating the floating approximation to π/2. math.gl deliberately rejects exact poles. |
| `moll-edge-domain` | 4 → 8 | Yes | native-pole-iteration | Native iteration leaves nonzero easting at exact poles and also loses nearby latitude offsets when sin(latitude) rounds to one. An original pole-complement solve preserves those offsets and exact constants; a bounded inverse rejects points outside the map. |
| `eqearth-edge-domain` | 8 → 8 | No new formula change | native-pole-roundoff | PROJ inverse Newton/asin arithmetic returns a pole latitude about 6.7 microdegrees short. math.gl preserves exact map-pole handling with a bounded ulp clamp; nearby northings can be indistinguishable in binary64. |
| `robin-axis-regression` | 1 → 1 | No new formula change | native-inverse-knot | All findings are at exact 5° table knots. math.gl retains exact-knot inverse corrections to the same PROJ forward coefficient table; PROJ inverse can select/refine the adjacent cubic interval incorrectly. |
| `ortho-issue-269` | 5 → 5 | No new formula change | native-inverse-failure | PROJ inverse fails at some finite visible polar forward values. math.gl uses an ellipsoid-ray intersection; the equatorial limb also needs a bounded ulp discriminant tolerance. |
| `ortho-scale` | 3 → 3 | No new formula change | native-inverse-failure | PROJ inverse fails at some finite visible polar forward values. math.gl uses an ellipsoid-ray intersection; the equatorial limb also needs a bounded ulp discriminant tolerance. |
| `ortho-audit--42-ellps=WGS84` | 14 → 14 | No new formula change | native-inverse-failure | PROJ inverse fails at some finite visible polar forward values. math.gl uses an ellipsoid-ray intersection; the equatorial limb also needs a bounded ulp discriminant tolerance. |
| `ortho-audit-0-ellps=WGS84` | 16 → 16 | No new formula change | rounded-limb | The projected binary64 northing is at the equatorial ellipse limb; 1 microdegree pole offsets enter northing only quadratically and can round away. The explicit bounded-ulp ellipse tolerance is retained; there is no uniform inverse angular accuracy at this limb. |
| `ortho-audit-42-ellps=WGS84` | 14 → 14 | No new formula change | native-inverse-failure | PROJ inverse fails at some finite visible polar forward values. math.gl uses an ellipsoid-ray intersection; the equatorial limb also needs a bounded ulp discriminant tolerance. |

## Regeneration

Use a separate pinned oracle environment with networking disabled by the scripts:

```sh
python modules/geospatial/projection/scripts/generate-pole-precision.py
node modules/geospatial/projection/scripts/audit-pole-precision.mjs
node modules/geospatial/projection/scripts/audit-pole-boundaries.mjs modules/geospatial/projection/test/fixtures/pole-audit-findings.json
node modules/geospatial/projection/scripts/generate-pole-review.mjs
node modules/geospatial/projection/scripts/check-native-reference.mjs
```

Changing a review disposition or numerical baseline requires reviewing the independent evidence, not merely regenerating the file. The ordinary PROJ corpus, all 49 review evidence tests, and the high-precision forward/inverse gates remain separate checks.
