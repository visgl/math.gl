# Solar-system bodies

**🧪 Experimental** — The `@math.gl/earth/celestial` subpath and all its exported functions, classes, constants, and types are experimental.

Rotation models, radii, gravitational parameters and approximate positions of the Sun, the
planets and the Moon. The functions are pure. They include no ephemeris file, no kernel and no
download. Each function takes a `JulianDate` in the TT scale.

```ts
import {
  JulianDate,
  getApproximatePlanetPosition,
  getBodyFixedFrame,
  getBodySubsolarPoint
} from '@math.gl/earth/celestial';

const tt = JulianDate.fromUnixMilliseconds(Date.now(), ttMinusUtc, 'TT');

// ICRF to the body-fixed frame of Mars, with its rate per second.
const frame = getBodyFixedFrame('mars', tt);

// The Sun as seen from Mars: the negative of the heliocentric position of Mars.
const [x, y, z] = getApproximatePlanetPosition('mars', tt);
const subsolar = getBodySubsolarPoint('mars', tt, [-x, -y, -z]);
```

## Bodies

`SolarSystemBody` is `'sun'`, `'mercury'`, `'venus'`, `'earth'`, `'moon'`, `'mars'`,
`'jupiter'`, `'saturn'`, `'uranus'` or `'neptune'`. `SOLAR_SYSTEM_BODIES` lists them.

### 🧪 getBodyRadii(body)

Returns `{equatorialRadius, polarRadius}` in metres. The values are those of the IAU WGCCRE 2015
report (Archinal et al. 2018, Tables 4 and 5) as NAIF `pck00011.tpc` gives them. The Earth values
(6378136.6 m and 6356751.9 m) are the IAU values, not WGS84.

### 🧪 getBodyGravitationalParameter(body)

Returns GM in m³/s², without the satellites of the body. The source is NAIF `gm_de440.tpc`: the
DE440 values (Park et al. 2021) for the Sun, Mercury, Venus, the Earth and the Moon, and the JPL
satellite ephemeris solutions for Mars to Neptune.

## Rotation

### 🧪 getBodyRotationElements(body, tt)

Returns `{poleRightAscension, poleDeclination, primeMeridian}` in degrees: α0 and δ0 of the north
pole in the ICRF, and the angle W of the prime meridian. α0 and W are in [0, 360). The models are
the IAU WGCCRE 2015 models, with the periodic terms of Mercury, the Moon, Mars, Jupiter and
Neptune.

### 🧪 getBodyFixedFrame(body, tt)

Returns a `CelestialFrameTransform` from `'ICRF'` to `'IAU_<BODY>'` (for example `'IAU_MARS'`).
The rotation is `Rz(W) Rx(90° − δ0) Rz(90° + α0)`, where each factor rotates the frame. The rate
includes the derivatives of α0, δ0 and W, so `transformState` gives body-fixed velocities.

The supported dates are 1900-01-01T12:00 TT to 2100-01-01T12:00 TT. Other dates throw `RangeError`.

Limits:

- The IAU Earth model is linear. It has no nutation and no polar motion, and it uses TT in place
  of UT1. Its error in W is of the order of 0.1 degree. Use an Earth orientation model for precise
  work on the Earth.
- The IAU Moon model approximates the mean Earth/polar axis frame. It is not the principal axis
  frame of a lunar ephemeris.
- The IAU models use TDB. The functions use TT in place of TDB; the two differ by less than 2 ms. At
  the same physical instant, that moves W by up to about 1e-5 degrees for Jupiter.

## Approximate planet positions

### 🧪 getApproximatePlanetPosition(planet, tt, options?)

Returns the heliocentric position of a planet in au, from the Keplerian elements of E. M. Standish
and J. G. Williams ([JPL, "Approximate Positions of the Planets"](https://ssd.jpl.nasa.gov/planets/approx_pos.html)).
`planet` is `'mercury'`, `'venus'`, `'earth-moon-barycenter'`, `'mars'`, `'jupiter'`, `'saturn'`,
`'uranus'` or `'neptune'`. The Earth is the Earth-Moon barycenter. `options.frame` is
`'equatorial'` (ICRF axes, the default) or `'ecliptic'` (mean ecliptic and equinox of J2000).

The function uses Table 1 from 1800 to 2050, and Tables 2a and 2b from 3000 BC to 3000 AD outside
that interval. At 2050-01-01T12:00 TT the position thus changes by a small step. Other dates throw
`RangeError`. The position is geometric: it has no light time and no aberration.

JPL states these nominal errors of Table 1: longitude and latitude in arcseconds, distance in
1000 km. The measured column is the largest heliocentric error against DE440 from 1850 to 2050,
in steps of 97.3 days. JPL calls its figures nominal, and the measured errors are larger for some
planets. The tests store DE440 positions every 1000 days and use gates a little above the measured
values.

| Planet | JPL nominal, Table 1 | Measured against DE440 | JPL nominal, Table 2 |
| --- | --- | --- | --- |
| Mercury | 15, 1, 1 | 29, 4, 2 | 20, 15, 1 |
| Venus | 20, 1, 4 | 26, 2, 6 | 40, 30, 8 |
| Earth-Moon barycenter | 20, 8, 6 | 22, 6, 7 | 40, 15, 15 |
| Mars | 40, 2, 25 | 93, 3, 38 | 100, 40, 30 |
| Jupiter | 400, 10, 600 | 516, 11, 640 | 600, 100, 1000 |
| Saturn | 600, 25, 1500 | 739, 30, 2811 | 1000, 100, 4000 |
| Uranus | 50, 2, 1000 | 122, 4, 1552 | 2000, 30, 8000 |
| Neptune | 10, 1, 200 | 60, 2, 1605 | 400, 15, 4000 |

For Uranus and Neptune, most of the heliocentric error is the motion of the Sun about the
barycenter of the solar system. Against barycentric DE440 positions the Neptune errors are 11, 0.5
and 299, near the JPL figures.

For the Moon, or for better accuracy, supply positions from an ephemeris of your choice.

## Lighting

### 🧪 getBodySunDirection(body, tt, sunPosition)

Returns the unit vector to the Sun in the body-fixed frame. `sunPosition` is the vector from the
center of the body to the Sun in ICRF axes, in any unit, from any ephemeris.

### 🧪 getBodySubsolarPoint(body, tt, sunPosition)

Returns the planetocentric `{longitude, latitude}` of the subsolar point in degrees, longitude east
positive in (−180, 180]. The terminator is the great circle 90 degrees from this point, without
refraction.

## Qualification

`modules/earth/scripts/celestial/generate-body-reference.py` writes the stored controls. It uses
CSPICE N0067 (SpiceyPy 8.4.0) with NAIF `pck00011.tpc` and `de440s.bsp`, pinned by SHA-256, and an
independent Python evaluation of the JPL element tables, parsed from the JPL table text. It does
not run the TypeScript code. Ordinary CI uses only the stored controls.

The rotation, frame and subsolar gates state agreement with CSPICE at the same numerical
ephemeris-time argument. The generator gives CSPICE the TT seconds from J2000.0 as TDB seconds, so
the controls test the rotation models, not the TT-to-TDB conversion. At the same physical instant
the TT−TDB difference (less than 2 ms) moves W by up to about 1e-5 degrees for Jupiter. A
same-instant accuracy claim needs a TT-to-TDB conversion and its own controls.

| Function | Control | Gate |
| --- | --- | --- |
| `getBodyRotationElements` | CSPICE `pxform` and `m2eul`, 10 bodies, 9 dates, same time argument | 1e-8 degrees |
| `getBodyFixedFrame` | CSPICE `pxform` and `sxform`, same time argument | 1e-10 (matrix), 1e-14 per second (rate) |
| `getBodySubsolarPoint` | CSPICE frame, DE440 Sun position, same time argument | 1e-8 degrees |
| `getApproximatePlanetPosition` | Python evaluation of the JPL tables, 12 dates from 3000 BC to 3000 AD | 1e-10 au |
| `getApproximatePlanetPosition` | DE440, 1850 to 2050 | the measured gates above |

The angle gates come from binary64: W reaches 3e7 degrees for Jupiter in 2100.

## References

- B. A. Archinal et al. (2018), "Report of the IAU Working Group on Cartographic Coordinates and
  Rotational Elements: 2015", Celest. Mech. Dyn. Astr. 130:22, doi:10.1007/s10569-017-9805-5.
- NAIF `pck00011.tpc` and `gm_de440.tpc`, https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/.
- R. S. Park et al. (2021), "The JPL Planetary and Lunar Ephemerides DE440 and DE441", Astron. J.
  161:105, doi:10.3847/1538-3881/abd414.
- E. M. Standish and J. G. Williams, "Approximate Positions of the Planets", JPL Solar System
  Dynamics, https://ssd.jpl.nasa.gov/planets/approx_pos.html.

Use `{model: 'long'}` for continuous playback across 1800 or 2050. The default automatic switch between independent fits jumps about 5.9 and 3.9 million km respectively for Saturn. The short model rejects dates outside its interval.
