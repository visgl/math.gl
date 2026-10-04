{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Cloud lighting

`getCloudLighting(sunAltitude, options?)` estimates incident sunlight, ambient skylight,
and a cloud sample's single-scattered color. A spherical Earth lets elevated clouds
remain sunlit after sunset at ground level and become sunlit before ground sunrise.
Atmospheric extinction warms the incident sunlight; neutral cloud scattering preserves
that tint rather than forcing every cloud white.

```typescript
import {getSunPosition, getCloudLighting} from '@math.gl/sun';

// Use the cloud sample's latitude/longitude, not a distant viewer's location.
const {altitude} = getSunPosition(Date.now(), 37.8, -122.4);
const lighting = getCloudLighting(altitude, {
  cloudAltitude: 8000,        // meters above mean sea level
  aerosolOpticalDepth: 0.1,
  cloudCover: 0.3,            // averaged conditions for ambient sky light
  cloudOpticalDepth: 4,       // local rendered cloud segment
  sunOpticalDepth: 0,         // shadowing material along sample-to-Sun ray
  viewOpticalDepth: 0.5,      // material along sample-to-viewer ray
  sunSeparation: Math.PI / 2  // Sun/cloud sightline separation
});

const {color, intensity} = lighting.scattered;
const linearRGB = color.map(channel => channel * intensity);
// Apply renderer exposure/tone mapping; these are linear RGB, not display bytes.
// A volumetric renderer may instead use lighting.direct and lighting.diffuse
// and perform its own phase-function, shadow and multiple-scattering integration.
```

## Parameters

`sunAltitude` is the geometric Sun-center altitude relative to the **cloud sample's
local horizontal**, in radians [-PI/2, PI/2]. It is not measured relative to the
cloud's depressed Earth horizon. `cloudAltitude` is height above mean sea level,
not height above an elevated observer. For geographically distributed clouds,
compute the Sun altitude separately at each sample's latitude/longitude. Solar
parallax is neglected. Dawn and dusk use the same geometry; weather can differ.

| Option | Default | Meaning |
| --- | --- | --- |
| `cloudAltitude` | 2000 | Meters MSL, [0, 50000] |
| `pressure` | 1013.25 | Sea-level reference pressure in hPa, [0, 1100]; exponential density already accounts for height |
| `aerosolOpticalDepth` | 0.1 | Sea-level vertical aerosol depth at 550 nm, [0, 10] |
| `angstromExponent` | 1.3 | Aerosol wavelength exponent, [0, 4] |
| `cloudCover` | 0 | Coverage [0, 1] used for ambient sky approximation; does not locate Sun-blocking clouds |
| `cloudOpticalDepth` | 10 | Extinction depth of the effective rendered segment, [0, 1000]; determines its opacity |
| `sunOpticalDepth` | 0 | Other cloud/material depth along the actual sample-to-Sun ray, [0, 1000] |
| `viewOpticalDepth` | 0 | Cloud/material depth along the actual sample-to-viewer ray, [0, 1000] |
| `sunSeparation` | PI/2 | Sun/cloud sightline separation [0, PI]; near zero gives forward-scattering brightening |
| `asymmetry` | 0.7 | Henyey–Greenstein parameter [-0.95, 0.95] |
| `singleScatteringAlbedo` | 0.999 | Scattered fraction of cloud extinction, [0, 1] |
| `integrationSteps` | 512 | Even Simpson quadrature count [32, 2048]; reduce for speed or increase for refinement |
| `darkSkyLuminance` | 0.0002 | Natural ambient night-sky luminance, cd/m² |
| `lightPollutionLuminance` | 0 | Additional ambient sky luminance, cd/m² |

Invalid values throw `RangeError`, including when the cloud is Earth-shadowed.

## Results and renderer integration

| Field | Meaning |
| --- | --- |
| `direct` | Incident beam `{color, intensity}`, before scattering through the rendered segment; includes atmospheric extinction, solar disk visibility and `sunOpticalDepth` |
| `diffuse` | Approximate hemispherical ambient irradiance `{color, intensity}`; independent of directional Sun occlusion |
| `scattered` | Approximate single-scattered radiance `{color, intensity}` towards the viewer, including local opacity, phase function and `viewOpticalDepth` |
| `sunVisibleFraction` | Geometric solar disk fraction above the cloud's Earth horizon, [0, 1]; not cloud transmission |
| `horizonAltitude` | Depressed Earth horizon relative to local horizontal, radians |
| `rayleighAirMass`, `aerosolAirMass` | Integrated exponential density columns divided by their sea-level scale heights; may be below one at high altitudes |
| `phaseFunction` | Henyey–Greenstein scattering density in inverse steradians; may exceed one near the Sun |
| `opacity` | `1 - exp(-cloudOpticalDepth)` for the rendered segment; independent of `cloudCover` |

Colors are peak-normalized linear sRGB. Multiplying by intensity reconstructs each
RGB quantity. Zero light returns zero color/intensity. `direct` is normalized to
the peak unattenuated **5778 K blackbody solar reference**, not the Hošek–Wilkie
sea-level lookup used by `getSunLight`. `diffuse` uses that approximate relative
scale by dividing sky illuminance by 110,000 lux. `scattered` has relative radiance
units (reference irradiance per steradian), **not lux**; it can exceed one with a
strong phase peak. Exposure is a renderer choice. Do not add a second opacity or
phase-function factor to `scattered`; use `direct`/`diffuse` if integrating those
effects yourself.

The sightline angle approximates the scattering angle for a distant Sun. A
renderer that knows the cloud sample and camera positions can compute it from
their vectors. `sunOpticalDepth` and `viewOpticalDepth` must come from the renderer
or a cloud-density model: this function cannot infer self-shadowing from a global
coverage fraction. It does not return positions or a cloud mesh. Cloud geometry
can use the renderer's existing local or GlobeView coordinate system; evaluate
lighting using each sample's geographic location and MSL altitude.

## Model and limits

Earth radius is 6,371 km. Horizon depression is `-acos(R / (R + height))`. A
uniform solar disk of radius 0.266° is clipped against that horizon. Its visible
segment centroid supplies one representative ray, avoiding an Earth-intersecting
center ray at partial sunrise/sunset. Stable circular-segment evaluation keeps
the first sliver continuous. Limb darkening, terrain, oblateness and refraction
are omitted.

The cloud-to-Sun ray is integrated to a 100 km atmosphere boundary using Simpson
quadrature. Molecular and aerosol densities fall exponentially with respective
scale heights 8 km and 1.2 km. Rayleigh optical depth is `0.008735 × wavelength^-4.08`
for wavelength in micrometers, scaled by sea-level pressure; aerosol extinction
uses the Angstrom law. A 5778 K Planck spectrum is attenuated with Beer–Lambert
transmission, integrated over 380–780 nm in 10 nm steps with analytic CIE matching
functions, and converted to linear sRGB. Negative out-of-gamut channels are clipped.
This is an approximate atmosphere, not measured solar spectrometry: ozone and
other gas absorption, ice/droplet spectra, humidity, variable density profiles,
refraction and aerial perspective on the cloud-to-viewer path are omitted.

Ambient brightness reuses the shared empirical sky luminance model at the sample's
geographic location. Its height dependence is not solved. Twilight ambient tint
is an illustrative blue approximation, blended into the existing daytime sky tint;
coverage neutralizes the ambient tint. Combining this with reddened direct light
can give warm or pink cloud colors. It is not a full model of twilight purple skies.
Moonlight is not included; natural sky glow and light pollution remain configurable.

The scattered estimate is
`albedo × opacity × exp(-viewDepth) × (directRGB × HG + diffuseRGB / (2π))`.
Ambient light is replaced by an isotropic hemisphere approximation; it is not
integrated against HG. Multiple scattering, resolved underside/top geometry,
cloud-to-cloud exchange and wavelength-dependent cloud absorption are omitted.
Optically thick cloud appearance is therefore an illustrative rendering estimate,
not calibrated radiance. Explicit ray depths can darken shaded cloud samples,
but there is no automatic 3D self-shadow solver or weather simulation.

## References and licensing

All new code is independently written TypeScript under MIT, with SPDX provenance.
Published equations are referenced; no external implementation, C/C++ source,
coefficient table, texture or paper text is redistributed.

- [Bruneton & Neyret (2008), Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/): spherical atmosphere and integrated transmittance. This API does not implement that paper's precomputed multiple-scattering solution.
- [Preetham, Shirley & Smits (1999), A Practical Analytic Model for Daylight](https://doi.org/10.1145/311535.311545): spectral Rayleigh and aerosol attenuation approximations.
- [Wyman, Sloan & Shirley (2013), Simple Analytic Approximations to the CIE XYZ Color Matching Functions](https://jcgt.org/published/0002/02/01/): equation 4/table 1 fits, independently evaluated.
- [PBRT, Phase Functions](https://www.pbr-book.org/3ed-2018/Volume_Scattering/Phase_Functions): Henyey–Greenstein angular scattering and direction conventions.
- The shared ambient sky and existing diffuse tint retain the references and licenses documented in [sky lighting](./sky.md) and [sunlight](./get-sun-light.md).

After building the package, generate a standalone dawn/dusk palette demo with
`node modules/sun/scripts/create-cloud-demo.mjs /absolute/path/clouds.html`.
It compares four cloud heights and three Sun-ray shadow depths through a shared
Sun-altitude slider. The SVG shapes are original and illustrative; the generated
page has no external runtime or artwork dependencies.
