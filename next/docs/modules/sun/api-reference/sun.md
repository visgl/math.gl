# Sun

![From v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)

Solar position, direction, direct/diffuse sunlight and altitude-aware cloud illumination.

## getSunPosition[​](#getsunposition "Direct link to getSunPosition")

![From v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)

Returns the approximate geometric solar position at an observer's location.

| Parameter   | Meaning                                         |
| ----------- | ----------------------------------------------- |
| `timestamp` | Unix milliseconds or a JavaScript `Date`.       |
| `latitude`  | Geographic latitude in degrees, north positive. |
| `longitude` | Geographic longitude in degrees, east positive. |

The result is `{altitude, azimuth}`, both in radians. Altitude is zero at the geometric horizon, positive above it and negative below it. Azimuth is measured from south towards west: south is 0, west PI/2, north ±PI and east −PI/2. Atmospheric refraction, terrain and observer elevation are omitted. This lightweight orbital approximation is intended for visualization; use [getSkySnapshot](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md) for the optional consistent topocentric astronomy tier. Supply finite inputs and a valid date; this legacy function does not validate ranges.

`getSun` was the original API name. Current releases export `getSunPosition`; import that name when updating older examples.

```
import {getSunPosition, getSunLight} from '@math.gl/sun';

const position = getSunPosition(new Date('2026-10-07T18:00:00Z'), 37.7749, -122.4194);

const light = getSunLight(position.altitude);

// position.altitude and position.azimuth are radians; light.color is linear RGB.
```

## getSunDirection[​](#getsundirection "Direct link to getSunDirection")

![From v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)

Accepts the same date and geographic coordinates as `getSunPosition`. Returns a unit three-vector in local east/north/up axes pointing in the **incoming light direction**, from the Sun towards the observer. An overhead Sun returns `[0, 0, -1]`. The function still returns a direction when the Sun is below the horizon; calculate its intensity separately.

For positioning a solar disk, negate the incoming vector with `reverseSkyDirection`, or call `getSkyDirection(altitude, azimuth)`. For globe lighting, rotate the incoming vector with `skyDirectionToGlobe`. See the [coordinate helpers](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md#observer-and-direction-helpers).

```
import {getSunDirection, reverseSkyDirection} from '@math.gl/sun';

const incomingDirection = getSunDirection(Date.now(), 37.7749, -122.4194);

const diskDirection = reverseSkyDirection(incomingDirection);
```

<!-- -->

## getSunLight[​](#getsunlight "Direct link to getSunLight")

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

Estimates direct sunlight and diffuse skylight color and intensity from solar altitude, with configurable atmospheric haze and cloud conditions.

```
import {getSunPosition, getSunLight} from '@math.gl/sun';



const {altitude} = getSunPosition(Date.now(), 37.7749, -122.4194);

const {color, intensity, diffuse} = getSunLight(altitude, {

  turbidity: 3,

  cloudCover: 0.7,

  cloudOpticalDepth: 10

});

// Use color/intensity for a directional sun light.

// Use diffuse.color/diffuse.intensity for approximate hemispherical sky lighting.

// Convert relative intensities to your renderer's units; colors are linear RGB.
```

### Parameters[​](#parameters "Direct link to Parameters")

* `altitude`: Sun center elevation in radians, between `-Math.PI / 2` and `Math.PI / 2`. Use the altitude returned by `getSunPosition`.
* `options.turbidity`: Atmospheric turbidity in `[1, 10]`, default `3`. Larger values represent more haze. This is the Hošek–Wilkie model's turbidity parameter, not cloud cover.
* `options.cloudCover`: Fractional coverage in `[0, 1]`, default `0`. This describes averaged conditions; it cannot predict whether a particular cloud is currently blocking the sun.
* `options.cloudOpticalDepth`: Nonnegative vertical optical depth, default `10`. Zero gives transparent clouds. Higher values suppress the direct beam and reduce transmitted diffuse light.

Invalid or nonfinite inputs throw `RangeError`, including when the sun is below the horizon.

### Returns[​](#returns "Direct link to Returns")

`{color, intensity, diffuse: {color, intensity}}`:

* Each `color` is normalized linear sRGB with components in `[0, 1]` and maximum component one when illuminated. It is not gamma-encoded or a 0–255 display color.
* Each `intensity` is a nonnegative relative peak-channel irradiance. Multiplying it by its `color` reconstructs relative RGB irradiance. The fixed reference is the brightest channel of clear, zenith sunlight at turbidity one. Values are not lux or W/m².
* Direct sunlight is measured perpendicular to the beam; surface incidence belongs in the renderer. Diffuse light is hemispherical irradiance on a horizontal surface, on the same scale. For that surface, total RGB is `directRGB * sin(altitude) + diffuseRGB` when altitude is positive.

The diffuse result approximates aggregate sky illumination. It does not give directional sky radiance or an environment map. A renderer may need to divide irradiance by π to construct a uniform Lambertian environment; follow its lighting convention.

### Clear-sky model[​](#clear-sky-model "Direct link to Clear-sky model")

The lookup tables are generated from the published **Hošek–Wilkie 1.4a** spectral sun and sky implementation at sea level, with ground albedo zero. Spectral radiance is integrated from 380–720 nm at 5 nm steps, converted through the Wyman–Sloan–Shirley analytic CIE 1931 matching functions (Equation 4), and transformed to linear sRGB. Negative out-of-gamut RGB components are clipped to zero.

Solar power is integrated over equal-area disk annuli, accounting for wavelength-dependent limb darkening. Sky radiance is integrated over the upper hemisphere with the horizontal surface cosine factor. Runtime evaluation interpolates **RGB irradiance**, rather than normalized color, between one-degree elevation samples and integer turbidity samples.

A 0.255° solar radius matches the reference implementation. A uniform-disk horizon fade makes direct light vanish below -0.255°. Partially visible disks use the horizon table; the fade omits the spatial variation of limb darkening. The same visibility factor fades diffuse illumination near the horizon as a rendering approximation. Atmospheric refraction, observer elevation, terrain shadows, and twilight are not modeled.

### Cloud approximation[​](#cloud-approximation "Direct link to Cloud approximation")

Clouds use a separate, neutral approximation; they are **not part of the Hošek–Wilkie fit**. For cloud cover `c`, optical depth `τ`, and `μ = sin(max(altitude, 0))`:

```
t = exp(-τ / max(μ, 0.05))

f = 1 / (1 + 0.12τ)

direct = clearDirect * (1 - c + ct)

diffuse = (1 - c) * clearDiffuse + cf * (clearDiffuse + μ * clearDirect * (1 - t))
```

The exponential follows Beer–Lambert transmission. The path bound and diffuse factor are heuristics, not a calibrated cloud model. Removed horizontal beam energy is redistributed into diffuse illumination with loss upward. Each RGB channel obeys an incident-energy bound. Cloud scattering is neutral: it preserves the incident spectrum rather than forcing sunset light to white. The combination of direct and sky spectra often gives less saturated diffuse daylight under clouds, while sunset clouds can remain warm.

Coverage and thickness are independent because a small thick cloud and a widespread thin cloud have different effects. These outputs describe approximate average lighting, not instantaneous cloud shadows or a forecast of measured irradiance.

### References and licensing[​](#references-and-licensing "Direct link to References and licensing")

* [Hošek and Wilkie, Adding a Solar Radiance Function to the Hošek Skylight Model (2013), and the 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/). The upstream source and datasets are **BSD-3-Clause**, copyright © 2012–2013 Lukas Hosek and Alexander Wilkie. Derived tables and reference fixtures carry `SPDX-License-Identifier: BSD-3-Clause` and `SPDX-FileCopyrightText` comments plus the full original notice. [LICENSE-HOSEK-WILKIE](https://github.com/visgl/math.gl/blob/master/modules/sun/LICENSE-HOSEK-WILKIE) is included in the npm package for source and binary redistribution.
* [Wyman, Sloan and Shirley, Simple Analytic Approximations to the CIE XYZ Color Matching Functions (2013)](https://jcgt.org/published/0002/02/01/). The integration tool independently implements the mathematical equations; no sample code or color-matching dataset was copied.
* [NOAA, The Color of Clouds](https://www.noaa.gov/jetstream/clouds/color-of-clouds): cloud scattering and preservation of incoming sunlight color.

The original TypeScript API and generator wrapper use math.gl's MIT license and carry `SPDX-License-Identifier: MIT` comments. The JavaScript model evaluator is adapted from the reference implementation and carries BSD-3-Clause SPDX attribution, as do the derived model data. The MIT package declaration does not relicense those files.

### Reproducing the tables[​](#reproducing-the-tables "Direct link to Reproducing the tables")

Download the published `HosekWilkie_SkylightModel_C_Source.1.4a.zip` from the reference page, then run with Node.js and `unzip`:

```
node modules/sun/scripts/generate-sunlight.mjs /path/to/HosekWilkie_SkylightModel_C_Source.1.4a.zip
```

The generator verifies the archive SHA-256 and parses its numeric coefficient arrays. The model evaluation and spectral integration run entirely in JavaScript; no native code is compiled or executed. Generated fixtures use twice the tables' angular quadrature resolution and include off-grid altitude/turbidity cases. Runtime use requires no downloads or dependencies.

<!-- -->

<!-- -->

## Cloud lighting[​](#cloud-lighting "Direct link to Cloud lighting")

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`getCloudLighting(sunAltitude, options?)` estimates incident sunlight, ambient skylight, and a cloud sample's single-scattered color. A spherical Earth lets elevated clouds remain sunlit after sunset at ground level and become sunlit before ground sunrise. Atmospheric extinction warms the incident sunlight; neutral cloud scattering preserves that tint rather than forcing every cloud white.

```
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

### Parameters[​](#parameters-1 "Direct link to Parameters")

`sunAltitude` is the geometric Sun-center altitude relative to the **cloud sample's local horizontal**, in radians \[-PI/2, PI/2]. It is not measured relative to the cloud's depressed Earth horizon. `cloudAltitude` is height above mean sea level, not height above an elevated observer. For geographically distributed clouds, compute the Sun altitude separately at each sample's latitude/longitude. Solar parallax is neglected. Dawn and dusk use the same geometry; weather can differ.

| Option                    | Default | Meaning                                                                                          |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `cloudAltitude`           | 2000    | Meters MSL, \[0, 50000]                                                                          |
| `pressure`                | 1013.25 | Sea-level reference pressure in hPa, \[0, 1100]; exponential density already accounts for height |
| `aerosolOpticalDepth`     | 0.1     | Sea-level vertical aerosol depth at 550 nm, \[0, 10]                                             |
| `angstromExponent`        | 1.3     | Aerosol wavelength exponent, \[0, 4]                                                             |
| `cloudCover`              | 0       | Coverage \[0, 1] used for ambient sky approximation; does not locate Sun-blocking clouds         |
| `cloudOpticalDepth`       | 10      | Extinction depth of the effective rendered segment, \[0, 1000]; determines its opacity           |
| `sunOpticalDepth`         | 0       | Other cloud/material depth along the actual sample-to-Sun ray, \[0, 1000]                        |
| `viewOpticalDepth`        | 0       | Cloud/material depth along the actual sample-to-viewer ray, \[0, 1000]                           |
| `sunSeparation`           | PI/2    | Sun/cloud sightline separation \[0, PI]; near zero gives forward-scattering brightening          |
| `asymmetry`               | 0.7     | Henyey–Greenstein parameter \[-0.95, 0.95]                                                       |
| `singleScatteringAlbedo`  | 0.999   | Scattered fraction of cloud extinction, \[0, 1]                                                  |
| `integrationSteps`        | 512     | Even Simpson quadrature count \[32, 2048]; reduce for speed or increase for refinement           |
| `darkSkyLuminance`        | 0.0002  | Natural ambient night-sky luminance, cd/m²                                                       |
| `lightPollutionLuminance` | 0       | Additional ambient sky luminance, cd/m²                                                          |

Invalid values throw `RangeError`, including when the cloud is Earth-shadowed.

### Results and renderer integration[​](#results-and-renderer-integration "Direct link to Results and renderer integration")

| Field                               | Meaning                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direct`                            | Incident beam `{color, intensity}`, before scattering through the rendered segment; includes atmospheric extinction, solar disk visibility and `sunOpticalDepth` |
| `diffuse`                           | Approximate hemispherical ambient irradiance `{color, intensity}`; independent of directional Sun occlusion                                                      |
| `scattered`                         | Approximate single-scattered radiance `{color, intensity}` towards the viewer, including local opacity, phase function and `viewOpticalDepth`                    |
| `sunVisibleFraction`                | Geometric solar disk fraction above the cloud's Earth horizon, \[0, 1]; not cloud transmission                                                                   |
| `horizonAltitude`                   | Depressed Earth horizon relative to local horizontal, radians                                                                                                    |
| `rayleighAirMass`, `aerosolAirMass` | Integrated exponential density columns divided by their sea-level scale heights; may be below one at high altitudes                                              |
| `phaseFunction`                     | Henyey–Greenstein scattering density in inverse steradians; may exceed one near the Sun                                                                          |
| `opacity`                           | `1 - exp(-cloudOpticalDepth)` for the rendered segment; independent of `cloudCover`                                                                              |

Colors are peak-normalized linear sRGB. Multiplying by intensity reconstructs each RGB quantity. Zero light returns zero color/intensity. `direct` is normalized to the peak unattenuated **5778 K blackbody solar reference**, not the Hošek–Wilkie sea-level lookup used by `getSunLight`. `diffuse` uses that approximate relative scale by dividing sky illuminance by 110,000 lux. `scattered` has relative radiance units (reference irradiance per steradian), **not lux**; it can exceed one with a strong phase peak. Exposure is a renderer choice. Do not add a second opacity or phase-function factor to `scattered`; use `direct`/`diffuse` if integrating those effects yourself.

The sightline angle approximates the scattering angle for a distant Sun. A renderer that knows the cloud sample and camera positions can compute it from their vectors. `sunOpticalDepth` and `viewOpticalDepth` must come from the renderer or a cloud-density model: this function cannot infer self-shadowing from a global coverage fraction. It does not return positions or a cloud mesh. Cloud geometry can use the renderer's existing local or GlobeView coordinate system; evaluate lighting using each sample's geographic location and MSL altitude.

### Model and limits[​](#model-and-limits "Direct link to Model and limits")

Earth radius is 6,371 km. Horizon depression is `-acos(R / (R + height))`. A uniform solar disk of radius 0.266° is clipped against that horizon. Its visible segment centroid supplies one representative ray, avoiding an Earth-intersecting center ray at partial sunrise/sunset. Stable circular-segment evaluation keeps the first sliver continuous. Limb darkening, terrain, oblateness and refraction are omitted.

The cloud-to-Sun ray is integrated to a 100 km atmosphere boundary using Simpson quadrature. Molecular and aerosol densities fall exponentially with respective scale heights 8 km and 1.2 km. Rayleigh optical depth is `0.008735 × wavelength^-4.08` for wavelength in micrometers, scaled by sea-level pressure; aerosol extinction uses the Angstrom law. A 5778 K Planck spectrum is attenuated with Beer–Lambert transmission, integrated over 380–780 nm in 10 nm steps with analytic CIE matching functions, and converted to linear sRGB. Negative out-of-gamut channels are clipped. This is an approximate atmosphere, not measured solar spectrometry: ozone and other gas absorption, ice/droplet spectra, humidity, variable density profiles, refraction and aerial perspective on the cloud-to-viewer path are omitted.

Ambient brightness reuses the shared empirical sky luminance model at the sample's geographic location. Its height dependence is not solved. Twilight ambient tint is an illustrative blue approximation, blended into the existing daytime sky tint; coverage neutralizes the ambient tint. Combining this with reddened direct light can give warm or pink cloud colors. It is not a full model of twilight purple skies. Moonlight is not included; natural sky glow and light pollution remain configurable.

The scattered estimate is `albedo × opacity × exp(-viewDepth) × (directRGB × HG + diffuseRGB / (2π))`. Ambient light is replaced by an isotropic hemisphere approximation; it is not integrated against HG. Multiple scattering, resolved underside/top geometry, cloud-to-cloud exchange and wavelength-dependent cloud absorption are omitted. Optically thick cloud appearance is therefore an illustrative rendering estimate, not calibrated radiance. Explicit ray depths can darken shaded cloud samples, but there is no automatic 3D self-shadow solver or weather simulation.

### References and licensing[​](#references-and-licensing-1 "Direct link to References and licensing")

All new code is independently written TypeScript under MIT, with SPDX provenance. Published equations are referenced; no external implementation, C/C++ source, coefficient table, texture or paper text is redistributed.

* [Bruneton & Neyret (2008), Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/): spherical atmosphere and integrated transmittance. This API does not implement that paper's precomputed multiple-scattering solution.
* [Preetham, Shirley & Smits (1999), A Practical Analytic Model for Daylight](https://doi.org/10.1145/311535.311545): spectral Rayleigh and aerosol attenuation approximations.
* [Wyman, Sloan & Shirley (2013), Simple Analytic Approximations to the CIE XYZ Color Matching Functions](https://jcgt.org/published/0002/02/01/): equation 4/table 1 fits, independently evaluated.
* [PBRT, Phase Functions](https://www.pbr-book.org/3ed-2018/Volume_Scattering/Phase_Functions): Henyey–Greenstein angular scattering and direction conventions.
* The shared ambient sky and existing diffuse tint retain the references and licenses documented in [sky lighting](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sky.md) and [sunlight](https://visgl.github.io/math.gl/next/docs/modules/sun/api-reference/sun.md#getsunlight).

After building the package, generate a standalone dawn/dusk palette demo with `node modules/sun/scripts/create-cloud-demo.mjs /absolute/path/clouds.html`. It compares four cloud heights and three Sun-ray shadow depths through a shared Sun-altitude slider. The SVG shapes are original and illustrative; the generated page has no external runtime or artwork dependencies.
