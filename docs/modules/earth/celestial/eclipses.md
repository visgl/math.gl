# Eclipses

Pure functions for the light that reaches a point when a body hides all or part of the Sun. They
give umbra, penumbra and antumbra without a shadow map, and the shadow of a ring system. They
take positions from any ephemeris: this module has no lunar or satellite ephemeris.

```ts
import {getSunVisibleFraction} from '@math.gl/earth/celestial';

// Geocentric, Earth-fixed vectors in km: a point on the ground, the Sun and the Moon, each
// light-time corrected.
const fraction = getSunVisibleFraction(point, sun, 695700, {center: moon, radius: 1737.4});
// 0: total eclipse. 1: no eclipse.
```

## getDiscVisibleFraction(occluderRadius, separation)

Returns the visible fraction of a uniform light disc of radius 1 when an opaque disc of radius r
has its center at distance d from the center of the light disc. Both lengths are in units of the
radius of the light disc.

| Case | Condition | Result |
| --- | --- | --- |
| No overlap | d ≥ 1 + r | 1 |
| Umbra (total) | d ≤ r − 1 | 0 |
| Antumbra (annular) | d ≤ 1 − r | 1 − r² |
| Penumbra (partial) | otherwise | 1 − A / π |

A is the area of the lens where the two circles overlap:

A = acos((d² + 1 − r²) / (2d)) + r² acos((d² + r² − 1) / (2dr)) − ½ √((−d + 1 + r)(d + 1 − r)(d − 1 + r)(d + 1 + r))

The discs are flat. On the sky this is the small-angle limit. For the Sun seen from the Earth
(0.27 degrees) the relative error is of the order of 1e−5. Limb darkening is not modeled.

## getSunVisibleFraction(point, sunCenter, sunRadius, occluder)

Returns the visible fraction of the solar disc at `point`. `occluder` is
`{center, radius, polarScale?}`. All positions and radii use one frame and one length unit.

The angular radius of the Sun is s = asin(R☉ / |sun − point|) and that of the occluder is
r = asin(R / |occluder − point|). The angular separation θ is the angle between the two
directions. The result is `getDiscVisibleFraction(r / s, θ / s)`.

- An occluder that is farther away than the Sun hides nothing.
- A point inside the occluder gets 0.
- `polarScale` is the equatorial radius divided by the polar radius of an oblate occluder. The
  polar axis is the z axis of the frame. The function multiplies z by `polarScale`, so that the
  occluder becomes a sphere, and takes both directions in that space. This approximates the projected solar disc. Accuracy near contact depends on flattening and viewing geometry.

Use the positions of the Sun and the occluder at the times when the light that reaches the
point passed them: light-time corrected, without aberration. For the Moon's shadow on the Earth,
the light time of the Sun (499 s) moves the shadow by about 38 km.

For a lunar eclipse, give the Earth a larger radius for its atmosphere. The NASA eclipse
catalogs use Danjon's rule, the Earth's radius times 1.01.

## getRingTransmission(point, sunCenter, bands)

Returns exp(−τ / |μ|) along the ray from `point` toward the center of the Sun. τ is the normal
optical depth of the band that the ray crosses, and μ is the sine of the elevation of the Sun
above the ring plane, as seen from the point. `bands` is a list of
`{innerRadius, outerRadius, opticalDepth}`. The rings are in the z = 0 plane of the frame,
centered on the origin, for example the body-fixed frame of Saturn.

The Sun is a point here. Its disc spans about 50 km at the distance of Saturn's rings. A ray
that does not cross the plane toward the Sun, or a ray in the plane, gives 1. Outside all bands
τ is 0. The function does not supply ring data.

## Qualification

The tests use JPL Horizons vectors (DE441, light-time corrected) as stored inputs, and the NASA
eclipse predictions of F. Espenak as expected values. No ephemeris library is a dependency.

| Event | Check | Result |
| --- | --- | --- |
| Total solar eclipse, 2024-04-08 | Shadow axis on the IAU ellipsoid at greatest eclipse, Earth frame of `getBodyFixedFrame`, against NASA 25°17.2'N, 104°08.3'W | 0.003 degrees in latitude, 0.075 degrees in longitude |
| Total solar eclipse, 2024-04-08 | Totality 60 km to each side of the axis, partial at 160 km (path width 198 km) | pass |
| Total lunar eclipse, 2025-03-14 | Umbral contacts U1 and U2 against NASA, Danjon enlargement | within 10 s (vectors every 10 s); the stored test checks ±2 min |

The longitude error of the solar eclipse comes from the IAU Earth rotation model, which is linear
in TT and has no nutation and no UT1.

### Positions from `getApproximatePlanetPosition`

The module has no lunar ephemeris, so it cannot predict eclipse times by itself. The direction of
the Earth-Moon barycenter from `getApproximatePlanetPosition` was 7.4 and 14.9 arcseconds from
DE441 on the two dates above. At the distance of the Moon, 15 arcseconds moves a shadow by
about 28 km, or about 30 s of eclipse time. Eclipse geometry also needs the Earth, not the
Earth-Moon barycenter: the two are about 4700 km apart.

## References

- F. Espenak, NASA GSFC, "Total Solar Eclipse of 2024 Apr 08: path of the eclipse",
  https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2024Apr08Tpath.html.
- F. Espenak, NASA GSFC, "Catalog of lunar eclipses: 2001 to 2100",
  https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html.
- JPL Horizons, https://ssd.jpl.nasa.gov/horizons/, with the DE441 ephemeris (Park et al. 2021).
