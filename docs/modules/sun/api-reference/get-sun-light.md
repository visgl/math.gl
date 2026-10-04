{/* SPDX-License-Identifier: MIT */}

# getSunLight

Estimates direct sunlight and diffuse skylight color and intensity from solar altitude,
with configurable atmospheric haze and cloud conditions.

```typescript
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

## Parameters

- `altitude`: Sun center elevation in radians, between `-Math.PI / 2` and `Math.PI / 2`.
  Use the altitude returned by `getSunPosition`.
- `options.turbidity`: Atmospheric turbidity in `[1, 10]`, default `3`. Larger values
  represent more haze. This is the Hošek–Wilkie model's turbidity parameter, not cloud cover.
- `options.cloudCover`: Fractional coverage in `[0, 1]`, default `0`. This describes averaged
  conditions; it cannot predict whether a particular cloud is currently blocking the sun.
- `options.cloudOpticalDepth`: Nonnegative vertical optical depth, default `10`. Zero gives
  transparent clouds. Higher values suppress the direct beam and reduce transmitted diffuse light.

Invalid or nonfinite inputs throw `RangeError`, including when the sun is below the horizon.

## Returns

`{color, intensity, diffuse: {color, intensity}}`:

- Each `color` is normalized linear sRGB with components in `[0, 1]` and maximum component
  one when illuminated. It is not gamma-encoded or a 0–255 display color.
- Each `intensity` is a nonnegative relative peak-channel irradiance. Multiplying it by
  its `color` reconstructs relative RGB irradiance. The fixed reference is the brightest
  channel of clear, zenith sunlight at turbidity one. Values are not lux or W/m².
- Direct sunlight is measured perpendicular to the beam; surface incidence belongs in
  the renderer. Diffuse light is hemispherical irradiance on a horizontal surface, on the
  same scale. For that surface, total RGB is `directRGB * sin(altitude) + diffuseRGB`
  when altitude is positive.

The diffuse result approximates aggregate sky illumination. It does not give directional
sky radiance or an environment map. A renderer may need to divide irradiance by π to
construct a uniform Lambertian environment; follow its lighting convention.

## Clear-sky model

The lookup tables are generated from the published **Hošek–Wilkie 1.4a** spectral sun and
sky implementation at sea level, with ground albedo zero. Spectral radiance is integrated
from 380–720 nm at 5 nm steps, converted through the Wyman–Sloan–Shirley analytic CIE 1931
matching functions (Equation 4), and transformed to linear sRGB. Negative out-of-gamut RGB
components are clipped to zero.

Solar power is integrated over equal-area disk annuli, accounting for wavelength-dependent
limb darkening. Sky radiance is integrated over the upper hemisphere with the horizontal
surface cosine factor. Runtime evaluation interpolates **RGB irradiance**, rather than
normalized color, between one-degree elevation samples and integer turbidity samples.

A 0.255° solar radius matches the reference implementation. A uniform-disk horizon fade
makes direct light vanish below -0.255°. Partially visible disks use the horizon table;
the fade omits the spatial variation of limb darkening. The same visibility factor fades
diffuse illumination near the horizon as a rendering approximation. Atmospheric refraction,
observer elevation, terrain shadows, and twilight are not modeled.

## Cloud approximation

Clouds use a separate, neutral approximation; they are **not part of the Hošek–Wilkie fit**.
For cloud cover `c`, optical depth `τ`, and `μ = sin(max(altitude, 0))`:

```text
t = exp(-τ / max(μ, 0.05))
f = 1 / (1 + 0.12τ)
direct = clearDirect * (1 - c + ct)
diffuse = (1 - c) * clearDiffuse + cf * (clearDiffuse + μ * clearDirect * (1 - t))
```

The exponential follows Beer–Lambert transmission. The path bound and diffuse factor are
heuristics, not a calibrated cloud model. Removed horizontal beam energy is redistributed
into diffuse illumination with loss upward. Each RGB channel obeys an incident-energy
bound. Cloud scattering is neutral: it preserves the incident spectrum rather than
forcing sunset light to white. The combination of direct and sky spectra often gives
less saturated diffuse daylight under clouds, while sunset clouds can remain warm.

Coverage and thickness are independent because a small thick cloud and a widespread thin
cloud have different effects. These outputs describe approximate average lighting, not
instantaneous cloud shadows or a forecast of measured irradiance.

## References and licensing

- [Hošek and Wilkie, Adding a Solar Radiance Function to the Hošek Skylight Model (2013),
  and the 1.4a reference implementation](https://cgg.mff.cuni.cz/projects/SkylightModelling/).
  The upstream source and datasets are **BSD-3-Clause**, copyright © 2012–2013 Lukas Hosek
  and Alexander Wilkie. Derived tables and reference fixtures carry
  `SPDX-License-Identifier: BSD-3-Clause` and `SPDX-FileCopyrightText` comments plus the
  full original notice. [LICENSE-HOSEK-WILKIE](https://github.com/visgl/math.gl/blob/master/modules/sun/LICENSE-HOSEK-WILKIE)
  is included in the npm package for source and binary redistribution.
- [Wyman, Sloan and Shirley, Simple Analytic Approximations to the CIE XYZ Color Matching
  Functions (2013)](https://jcgt.org/published/0002/02/01/). The integration tool independently
  implements the mathematical equations; no sample code or color-matching dataset was copied.
- [NOAA, The Color of Clouds](https://www.noaa.gov/jetstream/clouds/color-of-clouds): cloud
  scattering and preservation of incoming sunlight color.

The original TypeScript API and integration tools use math.gl's MIT license and have
`SPDX-License-Identifier: MIT` comments. The BSD-3-Clause notice remains applicable to the
derived model data; the MIT package declaration does not relicense it.

## Reproducing the tables

Download the published `HosekWilkie_SkylightModel_C_Source.1.4a.zip` from the reference page,
then run (requires a C compiler and `unzip`):

```bash
node modules/sun/scripts/generate-sunlight.mjs /path/to/HosekWilkie_SkylightModel_C_Source.1.4a.zip
```

The generator verifies the archive SHA-256 before compiling the reference. Generated
fixtures use twice the tables' angular quadrature resolution and include off-grid
altitude/turbidity cases. Runtime use requires no compiler, downloads, or dependencies.
