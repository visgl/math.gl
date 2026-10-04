{/* SPDX-License-Identifier: MIT */}

# getPlanetSkyInfo

Returns sky positions and disk geometry for Mercury, Venus, Mars, Jupiter, Saturn,
Uranus and Neptune, plus Jupiter's Galilean moons: Io, Europa, Ganymede and Callisto.

This optional entry point requires the MIT-licensed JavaScript package
[Astronomy Engine](https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js).
Install it explicitly; the main `@math.gl/sun` entry point does not load it.

```bash
npm install @math.gl/sun astronomy-engine
```

```typescript
import {getPlanetSkyInfo} from '@math.gl/sun/planets';

const bodies = getPlanetSkyInfo(new Date(), 37.7749, -122.4194);
for (const body of bodies) {
  if (body.altitude <= 0 || body.occultation === 'total') continue;
  // Place a sphere or billboard on the sky using body.direction.
  // Full angular diameter is body.angularDiameter, in radians.
  // Shade its disk using body.sunDirection; darken eclipsed moons.
}
```

## Parameters

`getPlanetSkyInfo(timestamp, latitude, longitude, options?)`

- `timestamp`: valid `Date` or Unix milliseconds, within calendar years 1900–2100.
- `latitude`: geodetic latitude in degrees, from -90 to 90.
- `longitude`: degrees east, finite; values wrap around 360 degrees.
- `options.elevation`: meters above sea level, default 0; range -1000 to 100000.
- `options.galileanMoons`: include the four moons, default `true`.

The result lists seven planets in order from Mercury to Neptune, followed by the
four moons in order from Io to Callisto. It includes objects below the horizon.
Earth, the Sun, Earth's Moon, dwarf planets and other satellites are not included.

## Rendering data

| Field | Meaning |
| --- | --- |
| `name`, `parent` | Body name; `parent` is `'Jupiter'` for the moons and `null` for planets. |
| `direction` | Outward observer-to-body unit vector in local east/north/up (ENU). |
| `equatorialDirection` | Outward unit vector in J2000 equatorial axes: +X RA 0, +Y RA 6h, +Z north pole. |
| `altitude`, `azimuth` | Radians; altitude above geometric horizon, azimuth from south towards west, matching `getSunPosition`. |
| `distance` | Observer-to-center distance in kilometers. |
| `angularDiameter` | Full disk diameter in radians; uses a spherical mean radius. |
| `phaseAngle`, `illuminatedFraction` | Sun/body/observer angle in radians and sunlit fraction of the disk; angle 0 is full phase. |
| `sunDirection` | Body-to-Sun unit vector in the observer's local ENU axes, for shading. |
| `magnitude` | Planet visual magnitude from Astronomy Engine's empirical photometry, before atmospheric extinction; `null` for moons. |
| `jupiterOffset` | Apparent moon-center offset from Jupiter in ENU kilometers; `null` for planets. |
| `occultation` | `'none'`, `'partial'` or `'total'` obscuration of a moon by Jupiter's spherical disk. |
| `transiting` | Moon overlaps Jupiter's projected disk on its near side. |
| `inJupiterShadow` | Moon center lies in Jupiter's approximate conical umbra. |

Sky directions point **towards** each body. Existing `getSunDirection` and
`getMoonDirection` describe incoming light and point the other way. At the zenith,
`direction` is `[0, 0, 1]`. Preserve that distinction when positioning objects.
The equatorial direction shares the J2000 asset axes used by `getStarfieldRotation`.
Use the returned ENU direction directly for the most consistent local placement;
the star-field's mean-frame approximation omits the nutation included here.

For unresolved planets, visual magnitude provides relative point-source brightness:
`10 ** (-0.4 * magnitude)`, on an arbitrary magnitude-zero scale. This is not solar
or lunar light intensity. Use exposure and tone mapping in the renderer. Magnitudes
for the moons are deliberately unavailable; their reflectance and eclipse photometry
are not modeled by this adapter. No RGB colors or surface textures are supplied.

## Accuracy and limitations

Astronomy Engine evaluates planetary ephemerides and its Galilean satellite model.
Every target is independently backdated for photon travel from its position to the
surface observer. This is especially useful for Io, which moves significantly during
Jupiter's tens-of-minutes light delay. Observer position includes the Earth's
ellipsoidal shape, elevation, rotation, precession and nutation. Angular coordinates
are astrometric: annual/diurnal aberration, atmospheric refraction and relativistic
light deflection are omitted. UTC is used as UT1, with Astronomy Engine's Delta-T
model for terrestrial time.

These calculations support sky rendering, rather than precision event timing.
Planetary position accuracy follows Astronomy Engine's approximate ephemerides.
The enforced date range limits extrapolation; it does not guarantee uniform accuracy
throughout the range. Reference tests compare independent JPL Horizons astrometric
positions and relative satellite offsets.

Jupiter is treated as a sphere with its mean radius for occultations, transits and
umbra geometry. `inJupiterShadow` tests the **moon center**; it does not calculate
partial eclipse brightness, penumbra, limb overlap or shadows on Jupiter's surface.
No mutual moon eclipses or occultations are evaluated. A transit is not an occultation:
render the moon in front of Jupiter. Use angular size and depth to handle partial disk
coverage. Saturn's rings, oblateness, rotational surface orientation and texture
mapping require renderer-specific handling. Saturn's empirical magnitude includes
ring effects, while its angular diameter here describes the planet's spherical disk.

The function performs ephemeris calculations; reuse results across rendering frames
when simulated time and observer location are unchanged.

## Sources and licenses

- [Astronomy Engine 2.1.19 JavaScript API](https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js):
  planetary positions, Galilean satellite vectors, light-time solver, frame rotations
  and planetary photometry. Its [MIT license](https://github.com/cosinekitty/astronomy/blob/v2.1.19/LICENSE)
  remains with the separately installed dependency. No upstream source is copied into
  math.gl, and no native compiler is required.
- [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)
  and [satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/): mean radii
  in kilometers used for disk sizes and spherical Jupiter geometry.
- [IAU 2015 Resolution B3](https://www.iau.org/static/resolutions/IAU2015_English.pdf):
  nominal solar radius for the conical-umbra approximation.
- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/): independently queried numeric
  reference positions. Fixture comments record the observer, coordinate frame and units.

The adapter is original MIT-licensed TypeScript. SPDX comments identify its license,
math.gl copyright and the referenced package/model. The optional peer dependency
keeps ephemeris code separate from consumers using only the main sunlight/moon APIs.
