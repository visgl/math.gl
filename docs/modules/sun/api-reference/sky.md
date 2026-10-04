{/* SPDX-License-Identifier: MIT */}

# Sky snapshots, Moon visibility and globe rendering

`getSkySnapshot` puts the Sun, Moon, seven planets, Galilean moons and a J2000
star-field orientation into one consistent **geometric topocentric ENU frame**.
Install the optional MIT-licensed `astronomy-engine` peer. The main entry point
retains the lightweight SunCalc position APIs without importing that peer.

```ts
import {createSkyObserver} from '@math.gl/sun';
import {getSkySnapshot, createSkyContext} from '@math.gl/sun/astronomy';

const observer = createSkyObserver({latitude: 37.8, longitude: -122.4, elevation: 0});
const sky = getSkySnapshot(Date.now(), observer, {
  atmosphere: {cloudCover: 0.3, aerosolOpticalDepth: 0.1},
  renderingDistance: 10_000_000
});
// Use moon.appearance.fade for disk visibility, lighting.moon.illuminance for light.
```

Angles are radians, body distances/ring radii are kilometers, observer elevation
and rendering distance are meters. Observer latitude/longitude are degrees.
Azimuth increases from south towards west. `direction` points **outwards**;
`incomingDirection` points towards the observer for lighting. All rotation matrices
are column-major 3×3 matrices. No refraction is applied. Dates are Unix milliseconds
or JavaScript Dates; the planetary adapter supports 1900–2100.

## Moon brightness through the day

`getMoonAppearance(moonAltitude, sunAltitude, options)` is available from the main
entry point. Required options are `phaseAngle` (0 full, PI new) and
`sunSeparation` (Moon/Sun angle); optional `distance` defaults to 384400 km.
Atmosphere options below, `observerFactor` (default 2), and `horizonAltitude`
(default 0) configure conditions.

| Result | Meaning |
| --- | --- |
| `illuminance` | Direct lunar illuminance in lux, on a surface facing the Moon. |
| `horizontalIlluminance` | Direct lux on a horizontal surface. |
| `diskLuminance`, `backgroundLuminance` | Mean lit-disk and directional sky luminance, cd/m². |
| `contrast`, `contrastThreshold` | Lunar excess luminance divided by sky luminance, and estimated human threshold. |
| `visible`, `fade` | Detectability estimate and smooth 0–1 rendering fade. |
| `illuminatedFraction`, `visibleDiskFraction` | Phase and horizon coverage, independently of contrast. |

The same lunar phase can be easy to see at night and faint in daylight, while its
direct illumination remains the same. A high quarter Moon can remain visible in
daylight; a thin crescent near the Sun can disappear into glare. The model uses
illuminated angular area, phase-dependent flux, distance, extinction, cloud
transmission, local background luminance and an extended-target contrast threshold.
It does **not** impose a daytime cutoff. `fade` is an artistic transition around
the threshold, not a probability. Phase-dependent albedo patterns, opposition
brightening, eye adaptation history and lunar eclipses are not modeled.

## Atmosphere and photometry

`createSkyAtmosphere` validates shared options: `pressure` (hPa, default 1013.25),
`aerosolOpticalDepth` at 550 nm (default 0.1), `cloudCover` (0–1, default 0),
`cloudOpticalDepth` (default 10), `darkSkyLuminance` (cd/m², default 0.0002),
and `lightPollutionLuminance` (cd/m², default 0).

`getSkyLuminance(sunAltitude, viewAltitude, sunSeparation, atmosphere)` returns
cd/m². Its zenith V-band twilight fit follows Patat et al. for Sun altitudes −5°
to −15°; pressure 743 hPa reproduces the published Paranal fit. It connects
continuously to the configured night background by −18°. Daylight, directional
glare, cloud reflection and horizon extrapolations are **original rendering
approximations**, not calibrated extensions of the paper. Covered sky becomes more
isotropic. `getSkyTransmission` gives V-band direct-beam transmission and
`getSkyAirMass` uses Kasten–Young. Cloud cover represents averaged conditions,
not the position of individual clouds.

`getSkyLighting(sunAltitude, moonAltitude, options)` shares the atmosphere and
requires `moonPhaseAngle` and `moonSunSeparation`, with optional `moonDistance`.
It returns `sun.illuminance`, `moon.illuminance`, horizontal direct illuminances,
and `diffuseSkyIlluminance` (including `diffuseMoonIlluminance`), all in lux. Diffuse solar/twilight/night illumination
uses numerical integration of sky luminance and remains continuous at sunset.
Normalized linear RGB is supplied separately. `diffuseSkyColor` is an illustrative
blue twilight tint that becomes neutral under cloud; it is not spectral photometry.
Existing relative `getSunLight` and `getMoonLight` scales remain unchanged.
Solar direct lux uses the existing sea-level Hošek–Wilkie table, CIE Y weights
and 683 lm/W; pressure changes do not recompute that solar table. The AOD-to-table
turbidity mapping `1 + 20*AOD` (capped at 10) is approximate. These components
are not a single energy-conserving radiative-transfer solver; ground reflection,
cloud geometry and multiple scattering are not resolved.

`getScatteredMoonLuminance(phaseAngle, moonAltitude, viewAltitude, separation,
options)` returns scattered lunar cd/m² using Krisciunas–Schaefer. `distance` and
an explicit V-band `extinction` in magnitudes/airmass may override defaults.
The snapshot adds this directional lunar background to planet contrast estimates.
Its cloud factor is an approximation; the underlying model is empirical clear sky.

`getPlanetVisibility` accepts `model: 'contrast'` to use the Crumey point-source
threshold with directional luminance and shared extinction; daylight detection is
then possible. `additionalSkyLuminance` adds a directional background in cd/m².
The default `'legacy'` preserves previous twilight behavior. Snapshots select
`'contrast'`. `getPlanetSkyInfo` also accepts a terrain `horizon(azimuth)` callback
returning radians; its minimum altitude still applies.
Snapshots accept `horizonProfile: [{azimuth, altitude}, ...]`, interpolated
periodically in radians, for Moon and planet detectability. The main entry point
also exports `getSkyHorizonAltitude(azimuth, profile)` for custom searches.

## deck.gl GlobeView

GlobeView supports LNGLAT layer coordinates. Each snapshot body supplies
`globePosition: [longitudeDegrees, latitudeDegrees, altitudeMeters]` at
`renderingDistance` **along the original observer sightline**. This is a render
shell, not a body's geographic subpoint or physical distance from Earth.
The same conversion works for user-supplied star directions:

```ts
import {getSkyGlobePosition, skyDirectionToGlobe, skyRotationToGlobe} from '@math.gl/sun';
const position = getSkyGlobePosition(localStarDirection, observer, 10_000_000);
const globeLightDirection = skyDirectionToGlobe(incomingLightDirection, observer);
const globeCubemapRotation = skyRotationToGlobe(localCubemapRotation, observer);
```

```ts
new ScatterplotLayer({
  id: 'sky-disks',
  coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
  data: [sky.moon, ...sky.planets],
  getPosition: body => body.globePosition,
  getRadius: body => 10_000_000 * Math.tan(
    ('angularDiameter' in body ? body.angularDiameter : 2 * Math.asin(1737.4 / body.distance)) / 2
  ),
  getFillColor: body => [240, 240, 240, 255 *
    ('appearance' in body ? body.appearance.fade : body.visibility?.fade ?? 1)],
  billboard: true
});
```

Supply imports from `@deck.gl/core` and `@deck.gl/layers` in the application.
Galilean satellites retain `visibility: null`: the point-source naked-eye model
does not account for Jupiter's overwhelming adjacent glare. For magnified views,
use their magnitudes and eclipse/occultation fractions rather than this default fade.

`globeDirection`, `globeStarfieldRotation`, Moon `globeRotation`, planet
`orientation.globeRotation` and ring
`globeNormal` use deck.gl globe axes: +X at 90°E, −Y at Greenwich, +Z north.
They are directions/rotations for custom globe shaders, **not WGS84 ECEF**, and
not raw CARTESIAN positions for stock GlobeView layers. Common-space positions
use a sphere of radius 256; conversion here uses deck.gl's spherical Earth radius
6370972 m, independently implemented from its documented/source projection.
Generic local ENU matrices cannot be used unchanged on the globe. For textured
disks, rings or a cubemap use these orientations in a custom layer's common-space
shader; LNGLAT disk markers are the simpler stock-layer option above.

Increase the view's far plane to include the render shell, render an opaque Earth
for occlusion, and configure culling/depth for the sky layer. Recalculate when
the observer changes; the visibility model describes the observer's sky, not the
external globe camera. Shell distance is chosen for the scene's precision and
clipping budget; scaling disk radius with it preserves angular size.
See [GlobeView limitations](https://deck.gl/docs/api-reference/core/globe-view).

## Appearance, accuracy and reuse

The Moon supplies a body-fixed rotation and geocentric optical/physical libration
longitude/latitude. Planet orientations map body-fixed +X (prime meridian), +Y
(90° east) and +Z (north) to ENU/globe using Astronomy Engine's IAU rotation-axis
model. Saturn supplies a ring normal and C-to-A ring radii 74658–136780 km.
Rotations use the body's estimated light-emission time, including rotation during light travel.
Galilean moons have Lambertian visual magnitudes using NASA geometric albedos,
`sunlitFraction` for partial solar-disk eclipse at the satellite center,
`visibleDiskFraction` for Jupiter occultation, and `apparentMagnitude` including
both (null at zero flux). Jupiter remains spherical; satellite surface penumbrae,
mutual events, limb darkening and oblateness are not resolved.

The core SunCalc APIs are the smallest, approximate tier. The optional astronomy
snapshot tier uses Astronomy Engine and consistent precession/nutation; it does
not become an astrometric observing product. Existing independent JPL fixtures
test planetary directions within 1 arcminute and relative satellite offsets
within 2 arcseconds for the sampled dates. These are tested tolerances, not a
guarantee over 1900–2100. Daytime Moon detection remains an approximation, not
an observation-calibrated visibility forecast.

`timeScales: {ut1MinusUtc, ttMinusUtc}` accepts explicit offsets in seconds.
UT1−UTC defaults to 0; absent TT−UTC uses Astronomy Engine's delta-T model.
Explicit offsets survive light-travel iterations. No process-wide delta-T function
is changed. No JPL kernel/provider is included.

`createSkyContext(observer, options)` exposes `getSnapshot`, `getSnapshots`,
`clearCache` and `getStatistics`. The observer/configuration are copied and an LRU
cache holds at most `cacheSize` snapshots (default 32, 0 disables caching).
Results are independent copies, so mutations cannot poison later calls.
Run `node modules/sun/scripts/benchmark-sky.mjs` after building to measure cold
and cached throughput on your own hardware.
Generate the local-sky/globe comparison demo with
`node modules/sun/scripts/create-sky-demo.mjs /absolute/path/sky.html`.
The standalone page uses the MIT deck.gl 9.1.9 CDN bundle; all ephemerides are
precomputed locally and require no service at runtime.

`searchSkyVisibility(start, end, predicate, {sampleSeconds: 30, transitionSeconds: 1})`
searches Moon or any body predicate and adaptively bisects detected transitions.
It returns intervals with window-clipping flags and evaluation counts. For a
terrain horizon or grazing crescent choose a smaller sample step. Intervals
shorter than the sample step can be missed; refinement tolerance is numerical,
not physical prediction accuracy. Searches reject more than 100000 base samples.

```ts
import {searchSkyVisibility} from '@math.gl/sun';
const context = createSkyContext(observer);
const now = Date.now();
const moonWindows = searchSkyVisibility(now, now + 86400000,
  time => context.getSnapshot(time).moon.appearance.visible,
  {sampleSeconds: 30, transitionSeconds: 1}
);
```

## References and licenses

All new adapters and equations are independently written TypeScript under MIT;
SPDX comments identify source papers and API provenance. No C code, external
source code, paper figures or paper prose are incorporated.

- [Patat, Ugolnikov & Postylyakov (2006)](https://arxiv.org/abs/astro-ph/0604128): V-band twilight fit, Table 1.
- [Crumey (2014)](https://arxiv.org/abs/1405.4209): photometric conversions and Blackwell point/extended-target contrast thresholds.
- [Krisciunas & Schaefer (1991)](https://doi.org/10.1086/132921): lunar phase photometry and scattered moonlight.
- [Kasten & Young (1989)](https://doi.org/10.1364/AO.28.004735): direct optical air mass.
- [Astronomy Engine 2.1.19, MIT](https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js): optional ephemerides, libration and IAU axes.
- [NASA Galilean facts](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) and [ring dimensions](https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html): numeric physical facts.
- [deck.gl GlobeViewport, MIT](https://github.com/visgl/deck.gl/blob/master/modules/core/src/viewports/globe-viewport.ts): axis/scale compatibility reference; coordinate equations independently implemented.

Existing Hošek–Wilkie BSD-3-Clause derived tables and SunCalc BSD-2-Clause
notices remain shipped in `LICENSE-HOSEK-WILKIE` and `LICENSE-SUNCALC`.
