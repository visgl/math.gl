# Overview

`@math.gl/sun` is a tiny JavaScript library for calculating sun position for the given location and time.

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

## Moon and star field

The module also provides [moon position, direction, phase and direct moonlight](./api-reference/moon.md), plus a [star-field rotation](./api-reference/get-starfield-rotation.md) for orienting an equatorial cubemap at the observer’s location and time.

## Planets

The optional [planet sky API](./api-reference/get-planet-sky-info.md) returns positions, disk sizes, phases and planet magnitudes, including the four Galilean moons. It also estimates twilight visibility and searches rise/set and visible time windows. Install `astronomy-engine` and import from `@math.gl/sun/planets`.

## Attribution

This module is a fork of @mourner's [SunCalc](https://github.com/mourner/suncalc) under BSD 2-clause license.

The adapted lunar code and numeric reference samples use SunCalc 1.9.0 under BSD-2-Clause. The full notice is shipped in `LICENSE-SUNCALC`, and SPDX comments record the original owner and provenance. Original moonlight and star-field calculations use math.gl’s MIT license.
