---
title: Overview
sidebar_label: Overview
---

{/* SPDX-License-Identifier: MIT */}

# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From v3.1" />
</p>

`@math.gl/earth/sun` provides solar and lunar lighting, planetary sky information, bright-star data and shared sky/rendering coordinates.

## Feature support

A modern observational-sky checklist; delivered models and remaining scientific qualification are separate.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Sun/Moon positions and Earth-fixed directions | ✅ Implemented | [Solar](./api-reference/sun.md), [lunar](./api-reference/moon.md) and [terminator geometry](./api-reference/get-sun-terminator.md) use explicit coordinate conventions. |
| Solar/lunar lighting and sky atmosphere | ✅ Implemented | Relative RGB lighting, lux-based sky lighting, atmospheric transmission and published-model approximations. |
| Cloud illumination | ✅ Implemented | [Cloud lighting](./api-reference/cloud-lighting.md) includes spherical Earth shadow, spectral dawn/dusk and explicit ray-depth approximations. |
| Planetary positions and appearance | ✅ Implemented | [Planet sky information](./api-reference/get-planet-sky-info.md), disk/phase/magnitude and lunar/Galilean orientation/event helpers. |
| Shared observer, horizon and visibility search | ✅ Implemented | [Sky APIs](./api-reference/sky.md) accept terrain horizons and explicit atmosphere settings; searches retain sampling/refinement limits. |
| UT1/TT, reusable contexts and snapshots | ✅ Implemented | Explicit time scales and bounded reusable contexts support batch sky evaluation. |
| Bright-star catalog and motion | ✅ Implemented | [Stars](./api-reference/stars.md) include optional catalog data, proper motion, distance-aware motion and explicitly illustrative Galactic backgrounds/orbits. |
| Shared atmospheric visibility for stars | ◐ Partial | Catalog/rendering data exist; the shared contrast/daylight/atmosphere integration remains [tranche 5 work](https://github.com/visgl/math.gl/blob/master/dev-docs/sun-roadmap.md). |
| Observationally calibrated visibility and event guarantees | ◐ Partial | Models and bounded searches exist; grazing/short events and observational uncertainty require broader independent qualification. |
| Published accuracy/performance tier budgets | ❌ Not implemented | Timing controls and benchmarks exist; formal tier-wide numerical/date/performance budgets remain [tranche 6 work](https://github.com/visgl/math.gl/blob/master/dev-docs/sun-roadmap.md). |
| Full physical radiative-transfer or surface rendering engine | ❌ Not implemented | The API supplies approximate lighting/appearance data, not resolved planetary surface/ring rendering or a general spectral transport solver. |

## Installation

```bash
npm install @math.gl/earth
```

## Entry points

The named Sun, Moon, sky, planet and star functions are exported from
`@math.gl/earth` and `@math.gl/earth/sun`. The data catalog remains
available from `@math.gl/earth/sun/stars`. `astronomy-engine` is a declared
runtime dependency; bundlers can remove it for unrelated named imports.

## Coordinates and units

Observer latitude/longitude are degrees; solar/lunar altitude and azimuth are
radians. Local vectors use east/north/up axes. Solar and lunar light directions
point inward; sky-body directions point outward. Light colors are linear RGB.
`getSunLight` and `getMoonLight` return relative intensity, while
`getSkyLighting` returns illuminance in lux. Globe positions are
`[longitudeDegrees, latitudeDegrees, altitudeMeters]`.

## Usage

```js
import {getSunDirection} from '@math.gl/earth/sun';
const latitude = 37.7749;
const longitude = -122.4194;
const sunDir = getSunDirection(Date.now(), latitude, longitude);
```

## Sunlight

Use [getSunLight](./api-reference/sun.md#getsunlight) with the altitude returned by `getSunPosition` to estimate normalized linear RGB and relative direct-light intensity. The Hošek–Wilkie model supplies sun and diffuse sky illumination with configurable turbidity. A separate cloud approximation redistributes direct sunlight into diffuse lighting.

Use [getCloudLighting](./api-reference/sun.md#cloud-lighting) for elevated cloud samples: spherical Earth shadowing, spectral dawn/dusk sunlight, approximate ambient/scattered colors and explicit Sun/view ray depths. High clouds can remain illuminated after ground sunset.

## Moon and star field

The module also provides [moon position, direction, phase and direct moonlight](./api-reference/moon.md), plus a [star-field rotation](./api-reference/sky.md#getstarfieldrotation) for orienting an equatorial cubemap at the observer’s location and time.

## Planets

The optional [planet sky API](./api-reference/get-planet-sky-info.md) returns positions, disk sizes, phases and planet magnitudes, including the four Galilean moons. It also estimates twilight visibility and searches rise/set and visible time windows. Import from `@math.gl/earth/sun`.

## Sky

See [sky snapshots, daylight Moon visibility and globe rendering](./api-reference/sky.md)
for a shared observer/atmosphere, lux-based lighting, planet and lunar orientations,
globe coordinates, reusable contexts and visibility searches.

## Attribution

Sunlight lookup data is derived from the [Hošek–Wilkie 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/) under BSD-3-Clause. The full notice is shipped in `LICENSE-HOSEK-WILKIE`; see the [API documentation](./api-reference/sun.md#getsunlight) for model provenance and limits.

The solar position calculation is a fork of @mourner's [SunCalc](https://github.com/mourner/suncalc) under BSD 2-clause license.

The adapted lunar code and numeric reference samples use SunCalc 1.9.0 under BSD-2-Clause. The full notice is shipped in `LICENSE-SUNCALC`, and SPDX comments record the original owner and provenance. Original moonlight and star-field calculations use math.gl’s MIT license.

The [star catalog](./api-reference/stars.md) contains 7,000 bright stars, projected proper motions, distance-aware motion and brightness where measurements exist, an illustrative Galactic orbit model, and a procedural Milky Way background. Numeric Julian epochs support long animations independently of the observer’s rendering date.
