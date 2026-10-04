{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Sun and sky roadmap

Status updated October 4, 2026. The original six tranches remain the organizing plan.
The shared sky implementation in [PR #188](https://github.com/visgl/math.gl/pull/188)
and the separate bright-star implementation in [PR #189](https://github.com/visgl/math.gl/pull/189)
are merged. Delivered APIs should be distinguished from their remaining qualification work.

| Tranche | Status | Delivered | Remaining work |
| --- | --- | --- | --- |
| **1. Consolidate the foundation** | Delivered | Shared observer and geometric topocentric ENU snapshots; explicit units and direction conventions; J2000 rotations; deck.gl GlobeView adapters; provenance and accuracy-limit documentation; comparison demos and reference tests | Maintain frame consistency and independent regression coverage as APIs expand |
| **2. Improve visibility** | Implemented; calibration remains | Published twilight and contrast equations; directional sky brightness, solar glare, scattered moonlight, haze and light pollution; configurable terrain horizons; daylight Moon disk contrast and fade; configurable visibility-window searches | Validate against an observational/reference corpus, publish error bounds, and strengthen searches for grazing events and intervals shorter than the sampling step |
| **3. Unify atmospheric lighting** | Delivered with documented approximations | Shared atmosphere for solar/lunar lighting and extinction; cloud direct/diffuse redistribution; twilight/night background; photometric lux and cd/m²; continuous visibility transitions; altitude-aware cloud lighting with spherical Earth shadowing, spectral sunlight, phase scattering and explicit ray-depth shading | Qualify cloud illumination against radiance references and improve empirical daytime/glare/cloud terms and test energy behavior against spectral irradiance references; cloud cover alone does not describe individual clouds |
| **4. Improve celestial appearance** | Delivered | Lunar disk orientation and libration; planetary rotation axes; Saturn ring orientation/radii; Galilean reflected brightness and partial eclipse/occultation fractions; local and globe orientation support | Broaden reference scenes and event validation; resolved limb darkening, non-spherical occulting bodies and detailed surface/ring rendering remain outside the current model |
| **5. Add a practical star field** | Catalog and rendering delivered; shared visibility remains | Optional MIT-licensed 7,000-source catalog; J2000 directions, magnitudes and approximate colors; projected proper motion; measured-distance Cartesian motion and brightness changes; optional illustrative Galactic orbits; procedural Milky Way background; deck.gl layer data with positions, byte colors, pixel radii, horizon clipping and picking records | Apply the shared atmosphere, sky contrast, daylight/twilight thresholds and continuous fading to stars; validate long-animation assumptions and consider richer permissively licensed astrometry/background data |
| **6. Add accuracy and performance tiers** | Context and timing delivered; tier qualification remains | Explicit UT1/TT inputs; reusable immutable observer context with bounded cache; batch snapshots; bounded event refinement; sky/star benchmarks; optional astronomy and catalog entry points | Publish measured accuracy/performance budgets and supported date ranges per tier, qualify ephemeris options, and improve event-search guarantees; benchmark scripts are not yet portable performance budgets |

## Next priorities

1. **Finish tranche 5's shared star visibility.** Reuse the observer's sky brightness,
   lunar background, extinction and point-source contrast model. Return visibility
   and fade separately from intrinsic/distance-adjusted stellar brightness, including
   daylight, twilight, cloud and terrain effects. Feed the result into the deck.gl
   helper without changing the catalog's fixed J2000 frame.
2. **Qualify tranche 2.** Build an independently sourced corpus for daytime Moon,
   twilight planets/stars, haze and horizon cases. Measure errors and document where
   the empirical models fail. Add grazing/short-window event cases before making
   stronger search guarantees.
3. **Qualify tranche 6.** Publish accuracy and runtime/bundle budgets for the
   lightweight APIs, astronomy snapshots and star-motion modes. Investigate narrower
   visibility intervals and precise ephemeris options from those measurements.
4. **Refine tranche 3 and long-range star rendering as evidence warrants.** Compare
   atmospheric approximations with spectral references. Treat stellar evolution,
   changing extinction, binary motion, measurement uncertainty and improved Galactic
   potentials as explicit extensions, rather than implying million-year forecast
   accuracy.

## Scope and constraints

The main entry point stays lightweight. Astronomy adapters and the star catalog
remain optional. All new implementation code is JavaScript/TypeScript, with SPDX
provenance, permissive redistribution terms and independent validation.

The 7,000-star catalog has positive parallaxes for 2,797 sources and complete
position/proper-motion/parallax/radial-velocity inputs for 2,796. Unknown-distance
sources remain explicitly angular-only. Million-year animations illustrate the
chosen model; they are not precise forecasts. The Milky Way glow is procedural,
not an observed sky texture or a resolved faint-star catalog.

See [shared sky APIs](./api-reference/sky.md) and
[bright stars and rendering helpers](./api-reference/stars.md) for implemented
interfaces, provenance, numerical units and current limits.
