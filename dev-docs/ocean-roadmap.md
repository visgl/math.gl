{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Ocean roadmap

Status updated November 19, 2026. Discussion: [RFC #613](https://github.com/visgl/math.gl/issues/613).

`@math.gl/earth/ocean` is an optional entry point with no datasets, no runtime imports and
no downloads. Each function declares its input domain, throws `RangeError` outside it, and
has a pinned reference, stored controls and a declared error gate.

| Tranche | Scope | Status / qualification gate |
| --- | --- | --- |
| **O1: Seawater state** | TEOS-10 subset: Reference and Absolute Salinity, Conservative Temperature, density, freezing temperature, sound speed, pressure ↔ height | Implemented. GSW-C 3.06.16 check casts and edge controls at the GSW check tolerances. No atlas. |
| **O2: Classic sound speed** | Chen–Millero (UNESCO), Del Grosso, Mackenzie | Implemented. UNESCO and APL-UW check values; independent 40-digit evaluation; published agreement bands. |
| **O3: Absorption** | Francois–Garrison 1982, Ainslie–McColm 1998 | Implemented. APL-UW TR 9407 Table 2 values; independent 40-digit evaluation. |
| **O4: Harmonic tide prediction** | Height from caller-supplied constituents; astronomical arguments and node factors | Future. NOAA CO-OPS published predictions. Uses the `JulianDate` of PR #284. |
| **O5: Rays and waves (optional)** | Rays in a layered sound-speed profile; linear wave dispersion | Future. Analytic cases and an independent integrator. |

## Example

The bathymetry example shows the sound-speed profile from the surface to the seafloor at a
selected point, marks the depth of minimum sound speed, and shows absorption at a selected
frequency.

## Not in scope

- The full GSW library: the SAAR atlas, sea ice and the exact Gibbs-function sound speed.
- Tidal constituent datasets and station catalogues.
- Ocean models, tide models and navigation-grade depth.
- Vertical datum conversion; `@math.gl/earth/geoid` stays the height-conversion foundation.
