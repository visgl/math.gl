{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Bright stars and Milky Way

`@math.gl/sun/stars` is an optional entry point with 7,000 real bright-star sources and proper motion. It has no Astronomy Engine dependency. Importing the main `@math.gl/sun` entry does not include this catalog.

```typescript
import {STAR_CATALOG, getStarPositions, createMilkyWayBackground} from '@math.gl/sun/stars';
import {getStarfieldRotation} from '@math.gl/sun';

// Simulation epoch is a Julian year, not a JavaScript Date.
const epochYear = 2000 + 1_000_000;
// Viewer orientation is independent: use a modern date for Earth's rotation/precession.
const rotation = getStarfieldRotation(new Date('2026-10-04T00:00:00Z'), 37.8, -122.4);
const stars = getStarPositions(epochYear, {model: 'galactic', rotation});
const milkyWay = createMilkyWayBackground(epochYear);
```

## Catalog

`STAR_CATALOG` is an immutable array sorted by visual magnitude, then Harvard Revised (HR) identifier. The subset contains the brightest 7,000 sources with J2000 coordinates and visual magnitudes in the Yale Bright Star Catalog's fifth revised edition. The faintest selected sources have V = 6.30; the fixed 7,000 count cuts through that magnitude tie. It is neither every naked-eye star nor a uniform magnitude-limited sample.

A catalog source can represent a multiple system. Some are variables. These are catalog-era measurements, not modern Gaia astrometry. Their apparent brightness and visibility also depend on atmosphere, light pollution and the renderer's exposure. Selection stays fixed during animation: stars initially outside the subset do not enter it later.

Each `StarRecord` includes:

| Field | Meaning |
| --- | --- |
| `id`, `designation` | HR identifier and original Bayer/Flamsteed designation, which may be empty |
| `epochYear` | Julian reference epoch, 2000.0 for bundled records |
| `rightAscension`, `declination` | Radians in fixed equatorial J2000 axes |
| `magnitude`, `colorIndex` | Apparent visual magnitude and observed B-V; missing B-V is `null` |
| `properMotionRA` | **cos(declination) × d(RA)/dt**, in milliarcseconds per Julian year |
| `properMotionDec` | d(Dec)/dt, in milliarcseconds per Julian year |
| `parallax` | Milliarcseconds, `null` when absent; zero/negative measurements retained |
| `radialVelocity` | km/s, positive receding; `null` when absent |
| `dynamicalParallax` | Catalog parallax is flagged dynamical rather than trigonometric |
| `radialVelocityFlags` | Original flags, such as spectroscopic binaries or variable velocities |

All 7,000 selected sources have projected proper motions. **2,797** have positive parallaxes, of which **2,796** also have radial velocities. Positive parallax is inverted directly to estimate distance; this is not a statistically corrected distance estimate. Small or dynamical parallaxes and binary velocities can produce unreliable extrapolations. Missing values are never fabricated. `STAR_CATALOG_INFO` exposes selection counts and the pinned source revision.

## Motion and brightness

`getStarPosition(star, epochYear, options?)` propagates one source. `getStarPositions(epochYear, options?, catalog = STAR_CATALOG)` propagates a batch and shares the Solar orbit integration. Both accept numeric Julian years within ±10 million years of J2000. Custom records must be within the same interval of their reference epoch. Galactic motion requires J2000 input records.

`options.model` defaults to `'rectilinear'`:

- For positive parallax, construct a Cartesian position and velocity from distance, projected tangent motion and radial velocity, then evaluate `position + velocity × elapsedYears`. This includes perspective effects. Missing radial velocity is assumed zero and marked by `radialVelocityAssumed`.
- For missing, zero or negative parallax, normalize `direction + tangentAngularVelocity × elapsedYears`. This has no distance or radial-motion inference; output `motionModel` is `'angular'`, distance is `null`, and magnitude stays unchanged. It is not constant angular-speed great-circle motion.
- `'galactic'` integrates measured-distance stars and the Sun through the same illustrative, static disk/bulge/halo potential. Unknown-distance stars retain the explicitly labelled angular fallback. The leapfrog step defaults to at most 10,000 years; `maximumStepYears` may reduce it. Integration rejects more than 100,000 steps.

The Galactic model uses the potential equations and parameter values in the [Johnston, Spergel & Hernquist 1995 arXiv draft](https://arxiv.org/abs/astro-ph/9502005): disk mass 10¹¹ solar masses, bulge mass 3.4 × 10¹⁰, disk scales 6.5/0.26 kpc, bulge scale 0.7 kpc, halo scale 12 kpc, and **halo parameter 212 km/s as printed in that draft**. This is a historical illustrative potential, not a fitted modern Milky Way model. The halo parameter is not the local circular speed. Solar initial position is [-8000, 0, 20] pc; velocity combines the model's circular speed with [Schönrich, Binney & Dehnen 2010](https://doi.org/10.1111/j.1365-2966.2010.16253.x) peculiar motion [11.1, 12.24, 7.25] km/s. Galactic axes use the J2000 pole/node angles described by [Liu, Zhu & Zhang 2011](https://doi.org/10.1051/0004-6361/201014961).

`integrateGalacticOrbit(position, velocity, elapsedYears, maximumStepYears?)` is also available for custom experiments: position is pc, velocity pc/Myr. `getGalacticAcceleration(position)` returns pc/Myr²; `getGalacticPotential(position)` returns specific potential in pc²/Myr². The potential has a cusped bulge; acceleration at the exact origin is assigned zero, so orbits through the cusp are not physically resolved.

Each result has `star`, `equatorialDirection`, rotated `direction`, equatorial angles, `distanceParsecs`, `magnitude`, `relativeFlux`, `color`, `motionModel`, and `radialVelocityAssumed`. With known distance, magnitude changes by `5 × log10(newDistance / initialDistance)` while intrinsic luminosity stays fixed. `relativeFlux = 10^(-0.4 × magnitude)` is relative to magnitude zero, not lux. Binary orbits, stellar evolution, variable luminosity, changing extinction, uncertainty propagation, and light travel time are omitted. Long animations illustrate model assumptions; they are **not accurate predictions millions of years into the future or past**.

`getStarColor(colorIndex)` returns an immutable approximate linear RGB tint with peak channel one. It uses [Ballesteros 2012](https://arxiv.org/abs/1201.1809) B-V temperature estimation (clamped to B-V [-0.4, 2]) and three Planck spectral samples at 680/550/440 nm. Missing B-V uses white. These samples provide a qualitative warm/cool tint, not calibrated sRGB or temperature estimates corrected for reddening.

## Rendering and deck.gl GlobeView

Fixed equatorial J2000 axes are +X = RA 0/Dec 0, +Y = RA 6h/Dec 0, +Z = north celestial pole. The optional `rotation` is a column-major 3×3 proper rotation applied to output `direction`. The equatorial angles and `equatorialDirection` stay in their original frame. `getStarfieldRotation` supplies local east/north/up directions for a modern observer date. Do not evaluate its short-term Earth precession formula at million-year simulation epochs; keep viewer orientation separate from stellar evolution time.

Use the shared globe adapters to turn the observer's local sky ray into a deck.gl LNGLAT rendering position:

```typescript
import {getStarPositions} from '@math.gl/sun/stars';
import {createSkyObserver, getStarfieldRotation, getSkyGlobePosition} from '@math.gl/sun';

const observer = createSkyObserver({latitude: 37.8, longitude: -122.4});
const rotation = getStarfieldRotation(Date.now(), observer.latitude, observer.longitude);
const stars = getStarPositions(2000, {rotation});
const data = stars.map(star => ({
  ...star,
  position: getSkyGlobePosition(star.direction, observer, 10_000_000)
}));
// Use data.position in a GlobeView layer with LNGLAT coordinates.
```

### Ready-to-use ScatterplotLayer data

`getStarLayerData(stars, options)` converts propagated stars into `StarLayerDatum[]`: `id`, `position`, byte RGBA `color`, `radiusPixels`, local `altitude`, `magnitude` and the original `source`. It reads `equatorialDirection` so an existing rotation on `stars.direction` cannot accidentally be applied twice. It has no deck.gl dependency.

`coordinates` defaults to `'globe'` (LNGLAT). `'local'` returns ENU Cartesian shell points, and `'equatorial'` returns J2000 Cartesian shell points. Globe/local require `observer`; their rotation uses a separate modern `timestamp` (default now), or an explicit J2000-to-ENU `rotation` such as a shared sky snapshot's matrix. The latter overrides timestamp. `distance` defaults to 10 million meters, or arbitrary units for equatorial views. `maximumMagnitude` optionally filters current apparent magnitude. `clipHorizon` optionally removes negative local geometric elevations; its default is false so a full star sphere is available. Terrain, atmospheric refraction, daylight visibility, camera clipping and picking are renderer concerns.

`radiusScale` (default 4) is the pixel radius of a magnitude-zero source. Radius scales with square root of relative flux, clamped by `minimumRadiusPixels`/`maximumRadiusPixels` (default 0.5/6). Alpha preserves faint-source flux below the minimum radius; bright sources saturate at the maximum. Color tints are converted from approximate linear RGB to gamma-encoded byte RGB. This provides practical display styling rather than calibrated pixel photometry.

```typescript
import {ScatterplotLayer} from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {getStarPositions, getStarLayerData} from '@math.gl/sun/stars';

const data = getStarLayerData(getStarPositions(2000), {
  observer: {latitude: 37.8, longitude: -122.4, elevation: 0},
  timestamp: Date.now(), coordinates: 'globe', distance: 10_000_000,
  clipHorizon: true
});
const starLayer = new ScatterplotLayer({
  id: 'stars', data,
  coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
  getPosition: d => d.position,
  getFillColor: d => d.color,
  getRadius: d => d.radiusPixels,
  radiusUnits: 'pixels', billboard: true, stroked: false, pickable: true
});
// Add starLayer to a deck.gl GlobeView alongside your globe/sky layers.
// For local/equatorial positions, use CARTESIAN with a suitable sky/OrbitView.
```

The shell distance is a rendering choice, independent of physical stellar distance. Use `skyRotationToGlobe(rotation, observer)` for a custom globe-space sky shader; do not feed globe-space directions back to the ENU position adapter. Depth, exposure and sky visibility remain rendering decisions. For cubemaps, sample J2000 directions with the transpose of the rendering rotation, just as in [getStarfieldRotation](./get-starfield-rotation.md).

## Milky Way background

7,000 bright sources can trace parts of the Galactic plane but do not reproduce its faint diffuse glow. `createMilkyWayBackground(epochYear = 2000, maximumStepYears = 10000)` provides an **original procedural rendering approximation**, separate from the observed catalog. Its `sample(equatorialDirection)` returns relative `intensity` and a warm linear `color`; neither is calibrated luminance. A broad Gaussian band, central bulge and narrow dust lane make the plane recognizable. It has no observed texture, spiral arms, resolved faint stars or changing dust distribution.

The object exposes J2000 `centerDirection` and `northDirection`. Its Galactic center follows the model's Solar orbit; the plane normal stays fixed. Sample the background in equatorial space, then rotate the foreground and background together. The background uses Galactic Solar motion even when foreground propagation is rectilinear; choose `'galactic'` for a consistent observer-orbit animation.

## Provenance, license and regeneration

Data: Hoffleit & Warren's **Yale Bright Star Catalog, fifth revised edition (1991)**, through [Bretton Wade's MIT-licensed export](https://github.com/brettonw/YaleBrightStarCatalog/tree/abffb3b7223ae37e879b0a3ff5b49ad06aed5576). The export's Copyright (c) 2016 Bretton Wade notice and full MIT permission text are redistributed in `modules/sun/LICENSE-BRIGHT-STARS`, included in the npm package. Generated data carries both that copyright and SPDX MIT comments. [NASA HEASARC's catalog description](https://heasarc.gsfc.nasa.gov/W3Browse/star-catalog/bsc5p.html) and the upstream [format description](https://github.com/brettonw/YaleBrightStarCatalog/blob/abffb3b7223ae37e879b0a3ff5b49ad06aed5576/bsc5.readme.txt) describe the measurements, including projected RA motion.

Algorithms are original TypeScript implementations of the cited mathematical equations. No third-party implementation, C source, paper text, texture, or noncommercial/share-alike dataset is redistributed. Published equation references appear in source SPDX comments as well as this documentation. The procedural background is original MIT code.

To reproduce the exact catalog, download the pinned `bsc5-orig.json` from that source revision, then run:

```sh
node modules/sun/scripts/generate-stars.mjs /absolute/path/bsc5-orig.json
# Verify an existing generated file without rewriting it:
node modules/sun/scripts/generate-stars.mjs /absolute/path/bsc5-orig.json --check
```

The generator verifies input SHA-256 `28cb835cbd2d72ced9ef9d20d9b5d92f05f649dfd39a509b1cf82dbd3c5f2fb9`, selects and sorts the 7,000 sources deterministically, and converts source arcseconds/year to milliarcseconds/year. No network request is part of building or using the module. Angles are rounded to 10 decimal places in radians, finer than the source coordinate precision.

For a standalone comparison demo after building the package, run `node modules/sun/scripts/create-stars-demo.mjs /absolute/path/stars.html`. It shows the full equatorial sky beside a deck.gl GlobeView and includes a ±1 million-year slider. The catalog is bundled; the globe panel loads MIT-licensed deck.gl 9.1.9 from a CDN. Increase GlobeView’s `farZMultiplier` if the chosen star shell lies beyond the camera’s far clipping plane. `node modules/sun/scripts/benchmark-stars.mjs` measures 7,000-source propagation and GlobeView data conversion.
