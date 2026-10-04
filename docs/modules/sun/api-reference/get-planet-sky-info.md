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
- `options.visibility`: conditions for the current twilight visibility estimate; see below.

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
| `magnitude` | Planet visual magnitude from Astronomy Engine's empirical photometry, before atmospheric extinction; Lambert approximation for moons. |
| `visibility` | Current approximate naked-eye detectability, limiting/extincted magnitudes and rendering fade; `null` for moons. |
| `jupiterOffset` | Apparent moon-center offset from Jupiter in ENU kilometers; `null` for planets. |
| `occultation` | `'none'`, `'partial'` or `'total'` obscuration of a moon by Jupiter's spherical disk. |
| `transiting` | Moon overlaps Jupiter's projected disk on its near side. |
| `inJupiterShadow` | Moon center sees a completely obscured solar disk. |
| `sunlitFraction`, `visibleDiskFraction` | Unblocked Sun and unocculted satellite disk fractions. |
| `apparentMagnitude` | Satellite magnitude including eclipse/occultation; null at zero flux. |

Sky directions point **towards** each body. Existing `getSunDirection` and
`getMoonDirection` describe incoming light and point the other way. At the zenith,
`direction` is `[0, 0, 1]`. Preserve that distinction when positioning objects.
The equatorial direction shares the J2000 asset axes used by `getStarfieldRotation`.
Use the returned ENU direction directly for the most consistent local placement;
the star-field's mean-frame approximation omits the nutation included here.

For unresolved planets, visual magnitude provides relative point-source brightness:
`10 ** (-0.4 * magnitude)`, on an arbitrary magnitude-zero scale. This is not solar
or lunar light intensity. Use exposure and tone mapping in the renderer. Moon magnitudes now use an approximate Lambert phase law and NASA geometric
albedos, with eclipse and occultation attenuation reported separately. No RGB colors or surface textures are supplied.

## When planets become visible

A planet rising above the horizon and becoming detectable against the twilight sky
are separate events. Brighter planets can emerge earlier in dusk and remain visible
later in dawn. Every planet now includes a current `visibility` estimate:

- `visible`: whether brightness, altitude and Sun separation meet the heuristic thresholds.
- `fade`: a smooth 0–1 rendering blend around those thresholds, not a probability.
- `limitingMagnitude`: approximate faintest magnitude detectable against the sky.
- `extinctedMagnitude`: catalog magnitude plus visual atmospheric extinction.
- `brightnessMargin`: limiting minus extincted magnitude; positive is brighter than the threshold.
- `sunAltitude`: geometric Sun altitude in radians.

The standalone `getPlanetVisibility(magnitude, altitude, sunAltitude, sunSeparation, options?)`
uses radians for all angle arguments. It is a pure rendering helper and does not
calculate ephemerides. For example, with an altitude of 30 degrees, Sun altitude of
-2 degrees and adequate solar separation, a magnitude -4 planet passes the default
threshold while a magnitude +1 planet does not.

### Visibility conditions

The same options are accepted by `getPlanetVisibility`, `options.visibility` in
`getPlanetSkyInfo`, and `getPlanetVisibilityTimes`:

| Option | Default | Meaning |
| --- | --- | --- |
| `darkSkyLimitingMagnitude` | 6 | Faintest extincted magnitude at a fully dark sky; lower it for light pollution or poorer observing conditions. |
| `extinction` | 0.2 | Visual magnitudes lost per air mass; range 0–5. |
| `minimumAltitude` | 5 degrees in radians | Geometric planet altitude threshold; range 0–PI/2. |
| `minimumSunSeparation` | 10 degrees in radians | Planet/Sun angular-separation threshold; range 0–PI. |

The twilight curve uses **original illustrative anchors**, not a published fitted
visibility algorithm: Sun altitude 0/-6/-12 degrees corresponds to limiting magnitude
-4/+1/+4.5. The curve interpolates to the configured dark-sky limit at -18 degrees
and is capped by that limit throughout. Atmospheric extinction uses the independently
implemented [Kasten–Young air mass equation](https://doi.org/10.1364/AO.28.004735).

This is an **uncalibrated rendering heuristic**, not a prediction of an individual's
first sighting. The [Tousey–Koomen visibility study](https://doi.org/10.1364/JOSA.43.000177)
provides context for the dependence on twilight, atmospheric transmission and eye
sensitivity; its model and charts are not implemented or copied here. Sky brightness
varies with direction, and haze, clouds, lunar glare, dark adaptation and eyesight
are not modeled. Sun separation is a simple cutoff, rather than a glare model.
Daylight detection is conservatively disabled even though Venus can sometimes be
seen during the day. Select the optional [contrast model](./sky.md) for directional
sky brightness, clouds, haze and daylight detection. Galilean moon visibility remains
`null` because Jupiter's glare and viewing optics are not modeled. Neptune normally has no naked-eye
visibility interval with the default dark-sky limit; telescope detection is not modeled.

### Rise/set and visibility windows

Use a separate event search when you need times, rather than doing this work every frame:

```typescript
import {getPlanetVisibilityTimes} from '@math.gl/sun/planets';

const events = getPlanetVisibilityTimes(Date.now(), 37.7749, -122.4194, {
  durationHours: 24,
  darkSkyLimitingMagnitude: 5
});
const venus = events.find(body => body.name === 'Venus');
const firstWindow = venus?.visibleIntervals[0];
if (firstWindow) console.log(new Date(firstWindow.start));
```

`getPlanetVisibilityTimes(timestamp, latitude, longitude, options?)` returns seven
planet records. It searches **forward from the supplied instant**, rather than
assuming local midnight. `durationHours` defaults to 24, must be greater than zero
and cannot exceed 72. `elevation` uses the same meters and range as `getPlanetSkyInfo`.
Both ends of the window must remain within the supported observation years.

| Field | Meaning |
| --- | --- |
| `name` | Planet name. Galilean moons are not included in this naked-eye event search. |
| `riseTime`, `setTime` | Next conventional rise and set within the window, in Unix milliseconds; `null` if no corresponding event occurs. |
| `visibleAtStart` | Whether the heuristic is already satisfied at the start. |
| `visibleIntervals` | Array of estimated intervals with `start`, `end`, `startClipped` and `endClipped`. Empty means none were found. |

Interval endpoints are Unix milliseconds. Starts are inclusive and ends exclusive.
A clipped start means the planet was already considered visible at the requested
start, so that endpoint is **not** its original appearance time. A clipped end means
the interval continues through the search boundary. Format timestamps in the caller's
time zone. Polar observations can have no rise/set event yet have a visible interval,
or have no visibility interval at all.

Rise/set uses Astronomy Engine's conventional refracted horizon and elevation
handling. Visibility uses geometric altitude and the configurable minimum altitude,
so it will typically start after rise and end before set. These are different criteria.
The visibility search samples once per minute and bisects detected transitions to a
five-second bracket. That numerical refinement does not imply five-second accuracy
of the visibility estimate. Brief or grazing intervals between samples can be missed.
The options are constant throughout the window; changing weather is not forecast.

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
eclipse geometry. `sunlitFraction` includes partial solar-disk eclipse at the **moon
center**, and `visibleDiskFraction` includes limb overlap. Resolved surface penumbrae
and shadows on Jupiter's surface are not calculated.
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
