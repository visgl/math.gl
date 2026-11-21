# EllipsoidMetrics

Metrics and auxiliary latitudes for a sphere or an oblate/prolate ellipsoid of revolution. This separate class keeps new geometry out of Cartesian-only bundles.

```
import {EllipsoidMetrics} from '@math.gl/geospatial/ellipsoid';



const metrics = new EllipsoidMetrics({

  semiMajorAxis: 6378137,

  semiMinorAxis: 6356752.314245179

});

const area = metrics.surfaceArea; // square metres

const distance = metrics.meridianDistance(40); // equator to 40° north, metres

const chi = metrics.latitudeToAuxiliary(40, 'conformal');

const phi = metrics.latitudeFromAuxiliary(chi, 'conformal');
```

`semiMajorAxis` is the equatorial radius and `semiMinorAxis` the polar radius, including prolate shapes where the latter is larger. Axes must be finite and positive with **0.5 ≤ b/a ≤ 2**. The constructor rejects results whose area, volume or quarter meridian overflows or underflows to zero. The instance is an immutable snapshot. No CRS/datum or global angle configuration is inferred.

| Member                                     | Meaning and units                                                 |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `surfaceArea`                              | Total area, squared axis units                                    |
| `volume`                                   | Volume, cubed axis units                                          |
| `quarterMeridian`                          | Equator-to-pole meridian length, axis units                       |
| `meridianDistance(latitude)`               | Signed equator-to-latitude distance, axis units                   |
| `meridionalCurvatureRadius(latitude)`      | North/south normal curvature radius, axis units                   |
| `transverseCurvatureRadius(latitude)`      | East/west (prime vertical) radius, axis units                     |
| `normalCurvatureRadius(latitude, azimuth)` | Normal-section radius at clockwise-from-north azimuth, axis units |
| `latitudeToAuxiliary(latitude, kind)`      | Geographic to auxiliary latitude, degrees                         |
| `latitudeFromAuxiliary(latitude, kind)`    | Auxiliary to geographic latitude, degrees                         |

The six `AuxiliaryLatitude` kinds are `geocentric`, `parametric` (reduced), `rectifying`, `authalic`, `conformal`, and `isometric`. **Isometric latitude is also in degrees** (the usual dimensionless Mercator ordinate multiplied by 180/π), matching GeographicLib Ellipsoid. Ordinary geographic and auxiliary latitudes must be finite and in \[-90, 90]. Isometric latitude is unbounded and has ±Infinity at geographic poles; its inverse accepts those infinities. Signed zero and exact finite poles are preserved. Invalid arguments throw.

The implementation uses original dimensionless integrals and bounded Gaussian quadrature, not GeographicLib's auxiliary-latitude series. Inversion is a bounded monotone solve, with complementary degree angles retained near poles. See the [G3–G4 qualification](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/geographiclib-g34-qualification.md) for the sampled domain, independent controls and accuracy budgets. Wider flattenings and bulk/performance APIs remain separate roadmap work.
