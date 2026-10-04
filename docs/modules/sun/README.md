{/* SPDX-License-Identifier: MIT */}

# Overview

`@math.gl/sun` is a tiny JavaScript library for calculating sun position for the given location and time, and estimating direct sunlight color and intensity.

## Installation

```bash
npm install @math.gl/sun
```

## Usage

```js
import {getSunDirection} from '@math.gl/sun';
const latitude = 37.7749;
const longitude = -122.4194;
const sunDir = getSunDirection(Date.now(), latitude, longitude);
```

## Sunlight

Use [getSunLight](./api-reference/get-sun-light.md) with the altitude returned by `getSunPosition` to estimate normalized linear RGB and relative direct-light intensity. The Hošek–Wilkie model supplies sun and diffuse sky illumination with configurable turbidity. A separate cloud approximation redistributes direct sunlight into diffuse lighting.

Use [getCloudLighting](./api-reference/cloud-lighting.md) for elevated cloud samples: spherical Earth shadowing, spectral dawn/dusk sunlight, approximate ambient/scattered colors and explicit Sun/view ray depths. High clouds can remain illuminated after ground sunset.

## Moon and star field

The module also provides [moon position, direction, phase and direct moonlight](./api-reference/moon.md), plus a [star-field rotation](./api-reference/get-starfield-rotation.md) for orienting an equatorial cubemap at the observer’s location and time.

## Planets

The optional [planet sky API](./api-reference/get-planet-sky-info.md) returns positions, disk sizes, phases and planet magnitudes, including the four Galilean moons. It also estimates twilight visibility and searches rise/set and visible time windows. Install `astronomy-engine` and import from `@math.gl/sun/planets`.

## Attribution

See [sky snapshots, daylight Moon visibility and globe rendering](./api-reference/sky.md)
for a shared observer/atmosphere, lux-based lighting, planet and lunar orientations,
globe coordinates, reusable contexts and visibility searches.

Sunlight lookup data is derived from the [Hošek–Wilkie 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/) under BSD-3-Clause. The full notice is shipped in `LICENSE-HOSEK-WILKIE`; see the [API documentation](./api-reference/get-sun-light.md) for model provenance and limits.

The solar position calculation is a fork of @mourner's [SunCalc](https://github.com/mourner/suncalc) under BSD 2-clause license.

The adapted lunar code and numeric reference samples use SunCalc 1.9.0 under BSD-2-Clause. The full notice is shipped in `LICENSE-SUNCALC`, and SPDX comments record the original owner and provenance. Original moonlight and star-field calculations use math.gl’s MIT license.

The optional [`@math.gl/sun/stars`](./api-reference/stars.md) entry point contains 7,000 bright stars, projected proper motions, distance-aware motion and brightness where measurements exist, an illustrative Galactic orbit model, and a procedural Milky Way background. Numeric Julian epochs support long animations independently of the observer’s rendering date.

See the [six-tranche sun and sky roadmap](./roadmap.md) for delivered features and remaining qualification work.
