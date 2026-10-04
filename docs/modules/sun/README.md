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

## Moon and star field

The module also provides [moon position, direction, phase and direct moonlight](./api-reference/moon.md), plus a [star-field rotation](./api-reference/get-starfield-rotation.md) for orienting an equatorial cubemap at the observer’s location and time.

## Attribution

Sunlight lookup data is derived from the [Hošek–Wilkie 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/) under BSD-3-Clause. The full notice is shipped in `LICENSE-HOSEK-WILKIE`; see the [API documentation](./api-reference/get-sun-light.md) for model provenance and limits.

The solar position calculation is a fork of @mourner's [SunCalc](https://github.com/mourner/suncalc) under BSD 2-clause license.

The adapted lunar code and numeric reference samples use SunCalc 1.9.0 under BSD-2-Clause. The full notice is shipped in `LICENSE-SUNCALC`, and SPDX comments record the original owner and provenance. Original moonlight and star-field calculations use math.gl’s MIT license.
