# Moon

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

```
import {getMoonPosition, getMoonDirection, getMoonIllumination, getMoonLight} from '@math.gl/sun';



const date = new Date();

const latitude = 37.7749;

const longitude = -122.4194;

const position = getMoonPosition(date, latitude, longitude);

const illumination = getMoonIllumination(date);

const direction = getMoonDirection(date, latitude, longitude);

const {color, intensity} = getMoonLight(position.altitude, {

  phaseAngle: illumination.phaseAngle,

  distance: position.distance,

  cloudCover: 0.4

});
```

## getMoonPosition(timestamp, latitude, longitude)[​](#getmoonpositiontimestamp-latitude-longitude "Direct link to getMoonPosition(timestamp, latitude, longitude)")

`timestamp` is a `Date` or milliseconds since Unix epoch. Latitude and longitude are in degrees, north and east positive. Latitude must be in `[-90, 90]`; finite longitudes wrap.

Returns:

* `altitude`: Geometric, topocentric elevation in radians. Zero is the horizon. Atmospheric refraction is omitted, matching the geometric convention of `getSunPosition`.
* `azimuth`: Radians from south toward west, matching `getSunPosition`.
* `distance`: Observer-to-Moon distance in kilometers, using a spherical Earth of radius 6378.14 km at sea level.
* `parallacticAngle`: Approximate orientation of the celestial north direction relative to the local vertical, in radians. The bright-limb angle minus this angle approximates the illuminated disk's orientation relative to the observer's vertical.

The low-order lunar ephemeris is adapted from SunCalc 1.9.0. Unlike that version's geocentric, refraction-corrected output, this API uses USNO mean sidereal time and subtracts the sea-level observer's position to correct horizontal parallax. It is for visualization, not eclipse prediction or precision navigation. It omits higher-order lunar perturbations, observer height, Earth flattening, atmospheric refraction, and nutation. Use near modern dates (approximately 1900–2100); no precision guarantee is made.

## getMoonDirection(timestamp, latitude, longitude)[​](#getmoondirectiontimestamp-latitude-longitude "Direct link to getMoonDirection(timestamp, latitude, longitude)")

Returns a unit **incoming light** direction in local east/north/up coordinates, using exactly the convention of `getSunDirection`: an overhead Moon gives `[0, 0, -1]`. Negate it to get the outward sky direction used to draw the Moon.

## getMoonIllumination(timestamp)[​](#getmoonilluminationtimestamp "Direct link to getMoonIllumination(timestamp)")

Returns geocentric lunar illumination geometry:

* `fraction`: Illuminated disk fraction in `[0, 1]`. This is not relative brightness.
* `phase`: Cycle position: `0` new, `0.25` first quarter, `0.5` full, `0.75` last quarter.
* `phaseAngle`: Sun–Moon–Earth angle in radians: `0` full, `Math.PI` new.
* `angle`: Bright-limb position angle in radians, from celestial north toward east.

`phase` and `phaseAngle` use different conventions. Pass **phaseAngle** to `getMoonLight`.

## getMoonLight(altitude, options)[​](#getmoonlightaltitude-options "Direct link to getMoonLight(altitude, options)")

`altitude` is geometric elevation in radians, in `[-Math.PI / 2, Math.PI / 2]`.

Options:

| Option                | Default  | Meaning                                                             |
| --------------------- | -------- | ------------------------------------------------------------------- |
| `phaseAngle`          | `0`      | Sun–Moon–Earth angle in `[0, Math.PI]`; default is full moon.       |
| `distance`            | `384400` | Observer-to-Moon distance in km, at least 1737.4 km (lunar radius). |
| `aerosolOpticalDepth` | `0.1`    | Nonnegative optical depth at 550 nm.                                |
| `cloudCover`          | `0`      | Average cloud coverage in `[0, 1]`.                                 |
| `cloudOpticalDepth`   | `10`     | Nonnegative vertical cloud optical depth.                           |

Returns `{color, intensity}`. Color is normalized linear RGB in `[0, 1]`, with maximum component one when lit. Multiply color by intensity to recover relative RGB light. Intensity is relative to **unattenuated full moon at 384400 km**, not lux and not the sunlight API's scale. It can exceed one at smaller distances. Set your renderer's full-moon brightness separately; do not give moon and sun lights the same base intensity.

Brightness uses the empirical lunar magnitude relation in Krisciunas and Schaefer (1991), Equation 9, plus inverse-square distance scaling. A quarter moon is substantially less than half as bright as a full moon. For extreme crescents, brightness is capped by the illuminated fraction to give a continuous zero at new moon; this is an additional rendering approximation. Opposition brightening, earthshine and eclipses are omitted.

The color approximation starts with neutral white moonlight and applies Beer–Lambert attenuation at representative wavelengths of 680, 550 and 440 nm, using Kasten–Young air mass, Rayleigh extinction and a fixed 1.3 Angstrom aerosol exponent. It is not spectral integration or a lunar surface reflectance model. Perceived blue moonlight from human night vision is not modeled.

Clouds attenuate the averaged direct beam neutrally. A distance-dependent uniform-disk horizon fade vanishes when the whole lunar disk is below the horizon. This fade ignores the crescent's orientation and surface brightness distribution. Diffuse moonlit sky, twilight and clouds' spatial geometry are not computed.

All APIs reject invalid/nonfinite numeric inputs with `RangeError`.

## Daytime visibility and sky brightness[​](#daytime-visibility-and-sky-brightness "Direct link to Daytime visibility and sky brightness")

The main entry point also exports `getMoonAppearance(moonAltitude, sunAltitude, options)` from v5.0. Unlike direct moonlight, apparent disk visibility depends on solar glare and the sky background. It returns physical lighting quantities plus `visible` and a smooth `fade` for rendering. See the complete [daytime Moon appearance reference](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md#moon-brightness-through-the-day) for required phase/separation options, result fields and limitations.

For the Moon's contribution to the surrounding sky, use [`getScatteredMoonLuminance`](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md#photometry-helper-reference). For intervals when the disk is detectable, use [`searchSkyVisibility`](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md#visibility-search-reference) with an appearance predicate or a cached sky snapshot.

## References and licenses[​](#references-and-licenses "Direct link to References and licenses")

* [SunCalc 1.9.0](https://github.com/mourner/suncalc/tree/v1.9.0) provides the adapted lunar ephemeris and illumination calculations. `moon.ts` and numeric reference fixtures carry **BSD-2-Clause** SPDX identifiers, Vladimir Agafonkin's original copyright, and source provenance. The full unchanged upstream notice is shipped in `LICENSE-SUNCALC`.
* [Krisciunas and Schaefer (1991), A Model of the Brightness of Moonlight](https://doi.org/10.1086/132921).
* [Kasten and Young (1989), Revised optical air mass tables and approximation formula](https://doi.org/10.1364/AO.28.004735).
* [USNO approximate sidereal time](https://aa.usno.navy.mil/faq/GAST).

The moonlight and star-field code independently implements published mathematical equations; no code from those papers or from SOFA is copied. These original files retain math.gl's MIT SPDX/copyright headers. The MIT package declaration does not relicense the BSD lunar code.
