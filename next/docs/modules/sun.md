# Overview

![From v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)

`@math.gl/sun` provides solar and lunar lighting, planetary sky information, bright-star data and shared sky/rendering coordinates.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/sun
```

## Entry points[​](#entry-points "Direct link to Entry points")

| Import                   | Contents                                                         | Additional dependency |
| ------------------------ | ---------------------------------------------------------------- | --------------------- |
| `@math.gl/sun`           | Sun, Moon, lighting, observer, atmosphere and globe helpers.     | None                  |
| `@math.gl/sun/planets`   | Planet/Galilean-moon positions and visibility searches.          | `astronomy-engine`    |
| `@math.gl/sun/astronomy` | Consistent sky snapshots and reusable cached contexts.           | `astronomy-engine`    |
| `@math.gl/sun/stars`     | 7,000-star catalog, motion, layer data and Milky Way background. | None                  |

For the optional ephemerides, run `npm install astronomy-engine`. Import these entry points explicitly; their APIs are not re-exported from the main module. All new Moon, planet, star and sky APIs are available from v5.0.

## Coordinates and units[​](#coordinates-and-units "Direct link to Coordinates and units")

Observer latitude/longitude are degrees; solar/lunar altitude and azimuth are radians. Local vectors use east/north/up axes. Solar and lunar light directions point inward; sky-body directions point outward. Light colors are linear RGB. `getSunLight` and `getMoonLight` return relative intensity, while `getSkyLighting` returns illuminance in lux. Globe positions are `[longitudeDegrees, latitudeDegrees, altitudeMeters]`.

## Usage[​](#usage "Direct link to Usage")

```
import {getSunDirection} from '@math.gl/sun';

const latitude = 37.7749;

const longitude = -122.4194;

const sunDir = getSunDirection(Date.now(), latitude, longitude);
```

## Sunlight[​](#sunlight "Direct link to Sunlight")

Use [getSunLight](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sun.md#getsunlight) with the altitude returned by `getSunPosition` to estimate normalized linear RGB and relative direct-light intensity. The Hošek–Wilkie model supplies sun and diffuse sky illumination with configurable turbidity. A separate cloud approximation redistributes direct sunlight into diffuse lighting.

Use [getCloudLighting](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sun.md#cloud-lighting) for elevated cloud samples: spherical Earth shadowing, spectral dawn/dusk sunlight, approximate ambient/scattered colors and explicit Sun/view ray depths. High clouds can remain illuminated after ground sunset.

## Moon and star field[​](#moon-and-star-field "Direct link to Moon and star field")

The module also provides [moon position, direction, phase and direct moonlight](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/moon.md), plus a [star-field rotation](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md#getstarfieldrotation) for orienting an equatorial cubemap at the observer’s location and time.

## Planets[​](#planets "Direct link to Planets")

The optional [planet sky API](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/get-planet-sky-info.md) returns positions, disk sizes, phases and planet magnitudes, including the four Galilean moons. It also estimates twilight visibility and searches rise/set and visible time windows. Install `astronomy-engine` and import from `@math.gl/sun/planets`.

## Sky[​](#sky "Direct link to Sky")

See [sky snapshots, daylight Moon visibility and globe rendering](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md) for a shared observer/atmosphere, lux-based lighting, planet and lunar orientations, globe coordinates, reusable contexts and visibility searches.

## Attribution[​](#attribution "Direct link to Attribution")

Sunlight lookup data is derived from the [Hošek–Wilkie 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/) under BSD-3-Clause. The full notice is shipped in `LICENSE-HOSEK-WILKIE`; see the [API documentation](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sun.md#getsunlight) for model provenance and limits.

The solar position calculation is a fork of @mourner's [SunCalc](https://github.com/mourner/suncalc) under BSD 2-clause license.

The adapted lunar code and numeric reference samples use SunCalc 1.9.0 under BSD-2-Clause. The full notice is shipped in `LICENSE-SUNCALC`, and SPDX comments record the original owner and provenance. Original moonlight and star-field calculations use math.gl’s MIT license.

The optional [`@math.gl/sun/stars`](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/stars.md) entry point contains 7,000 bright stars, projected proper motions, distance-aware motion and brightness where measurements exist, an illustrative Galactic orbit model, and a procedural Milky Way background. Numeric Julian epochs support long animations independently of the observer’s rendering date.
