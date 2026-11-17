# Lighting and color calculations

`@math.gl/geometry/lighting` and `@math.gl/geometry/color` provide opt-in CPU calculations on numerical tables. They have no parser, image codec, renderer or new dependency. The core root does not re-export them. Applications can use measurements from any source that conforms to the models below.

## Usage[​](#usage "Direct link to Usage")

```
import {

  createPhotometricSampler,

  integrateLuminousFlux,

  resamplePhotometricProfile

} from '@math.gl/geometry/lighting';

import type {PhotometricProfile} from '@math.gl/geometry/lighting';



const profile: PhotometricProfile = {

  verticalAngles: [0, 90, 180],

  horizontalAngles: [0],

  intensities: [0, 100, 0],

  symmetry: 'rotational'

};

const sample = createPhotometricSampler(profile);

const candela = sample(45, 120); // vertical, horizontal, in degrees

const lumens = integrateLuminousFlux(profile);

const grid = resamplePhotometricProfile(profile, {

  verticalCount: 181,

  horizontalCount: 360,

  normalization: 'peak'

});
```

## Features[​](#features "Direct link to Features")

| Feature                                 | Support  | Contract                                                                      |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Angular intensity sampling              | Yes      | Bilinear interpolation, explicit symmetry, degrees and candela                |
| Luminous flux                           | Yes      | Solid-angle integration of the angular interpolant, returning lumens          |
| Regular angular grids                   | Yes      | Owned Float64 buffers with coordinates, units and optional peak normalization |
| Color LUT sampling                      | Yes      | Per-channel 1D linear or red-fastest 3D trilinear interpolation               |
| Floating RGB/RGBA buffers               | Yes      | New Float32 output; alpha bypasses the LUT                                    |
| File parsing and image decoding         | Separate | Applications obtain tables from a reader such as loaders.gl                   |
| World-axis transforms and GPU resources | Separate | Applications choose axes, image formats and renderer objects                  |

## Photometric model[​](#photometric-model "Direct link to Photometric model")

`PhotometricProfile` describes polar/azimuth measurements independently of their file encoding. Angles are degrees, and scaled intensities are candela. There is no world-axis convention: the application chooses the pole and azimuth origin.

| Field              | Description                                   |
| ------------------ | --------------------------------------------- |
| `verticalAngles`   | Ordered polar coordinates within `[0, 180]`   |
| `horizontalAngles` | Ordered azimuth coordinates within `[0, 360]` |
| `intensities`      | Samples with vertical angle varying fastest   |
| `intensityScale`   | Optional uniform multiplier; default 1        |
| `symmetry`         | Required extension rule described below       |

The three data fields accept plain arrays or typed arrays through `ArrayLike<number>`. At least two vertical coordinates are required. Intensities must be finite and nonnegative, and their count must match the two axes. Lamp, ballast and file metadata are not read or inferred.

### Explicit symmetry[​](#explicit-symmetry "Direct link to Explicit symmetry")

| Mode         | Required horizontal coverage                    | Interpretation                                   |
| ------------ | ----------------------------------------------- | ------------------------------------------------ |
| `rotational` | One measured plane                              | Same distribution for every azimuth              |
| `quadrant`   | 0 through 90 degrees                            | Mirror the quadrant around the full circle       |
| `bilateral`  | Any ordered 180-degree extent within `[0, 360]` | Mirror around that extent, preserving its origin |
| `none`       | 0 through 360 degrees                           | Use the full authored circle                     |

Partial nonsymmetric azimuth tables are outside the initial scope. Symmetry is never guessed from a format, filename or array length. An explicit mode that does not match the angular coverage rejects.

## Sampling and integration[​](#sampling-and-integration "Direct link to Sampling and integration")

`createPhotometricSampler` snapshots the input arrays and applies `intensityScale` once. Later source mutations do not affect the sampler. It interpolates bilinearly between measured knots. Vertical queries must be finite and within `[0, 180]`; directions outside the measured vertical extent return zero. Horizontal queries can be any finite angle and wrap around the circle.

`integrateLuminousFlux` integrates the piecewise bilinear angular distribution over solid angle: `∫∫ I(θ, φ) sin(θ) dθ dφ`, using radians for integration. It uses the actual nonuniform intervals and analytical vertical weights, including stable narrow-interval evaluation near either pole. An isotropic one-candela distribution integrates to `4π` lumens. This is the flux of the interpolant, without reconstructing missing measurements or applying near-field geometry, exposure or operating-condition adjustments. Invalid inputs and numeric overflow reject.

## Resampled grids[​](#resampled-grids "Direct link to Resampled grids")

`resamplePhotometricProfile(profile, options)` returns `PhotometricGrid`:

| Field              | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `width`, `height`  | Vertical samples per row and horizontal rows                          |
| `data`             | Float64 samples, indexed as `horizontalIndex * width + verticalIndex` |
| `verticalAngles`   | Coordinates from 0 through 180, including both poles                  |
| `horizontalAngles` | Coordinates in `[0, 360)`, excluding the duplicate seam               |
| `unit`             | `candela`, or `relative` after peak normalization                     |
| `peakCandela`      | Measured peak before normalization                                    |

Defaults are 181 vertical samples and 360 horizontal rows. Vertical count must be at least two and horizontal count at least one; their product is capped at 4,194,304. The arrays belong to the result. No GPU texture or axis conversion is created.

`normalization: 'none'` preserves candela. `'peak'` divides by the measured peak, which need not lie on the resampled grid. Zero distributions remain zero. Subnormal positive peaks do not require an infinite reciprocal.

## Numerical color LUTs[​](#numerical-color-luts "Direct link to Numerical color LUTs")

`ColorLUT` is independent of Cube, 3dl, image layouts or any other encoding. It contains `dimension` (1 or 3), `size`, interleaved Float32 RGB `data`, three-channel `domainMinimum`/`domainMaximum`, and optional normalized Float64 `inputGrid` knots. Three-dimensional storage is red-fastest: `3 * (red + size * (green + size * blue))`. Knots must increase strictly from 0 through 1; domain spans must be finite and positive.

```
import {createColorLUTSampler, applyColorLUT} from '@math.gl/geometry/color';

import type {ColorLUT} from '@math.gl/geometry/color';



const lut: ColorLUT = {

  dimension: 1,

  size: 2,

  data: Float32Array.of(0, 0, 0, 1, 1, 1),

  domainMinimum: [0, 0, 0],

  domainMaximum: [1, 1, 1]

};

const sampleColor = createColorLUTSampler(lut);

const rgb = sampleColor(0.25, 0.5, 0.75);

const rgba = applyColorLUT(lut, Float32Array.of(0.25, 0.5, 0.75, 1), {components: 4});
```

The sampler snapshots data, domains and knots. It interpolates each channel independently for 1D tables, or uses trilinear interpolation for 3D tables, including nonuniform input knots. Finite inputs clamp to the authored domain. Signed/HDR outputs are not clamped.

`applyColorLUT` accepts interleaved Float32 or Float64 RGB buffers; set `components: 4` for RGBA. It returns a new Float32 buffer and preserves the source. Alpha bypasses the LUT and is copied at Float32 precision; nonfinite or unrepresentable alpha rejects. Empty buffers return empty arrays. Incomplete pixels and nonfinite colors reject. There is no implicit byte scaling, sRGB/linear conversion, exposure, gamut mapping or premultiplication policy: supply values in the table's intended domain and encoding.

## Composing with loaders.gl[​](#composing-with-loadersgl "Direct link to Composing with loaders.gl")

Parsing remains in loaders.gl; math.gl does not import it. Applications can map a parsed IES profile into the photometric model and explicitly choose the symmetry appropriate to that source. For a rotational profile:

```
import {load} from '@loaders.gl/core';

import {IESLoader} from '@loaders.gl/images';

import {createPhotometricSampler} from '@math.gl/geometry/lighting';



const measured = await load('rotational.ies', IESLoader);

const sample = createPhotometricSampler({

  verticalAngles: measured.verticalAngles,

  horizontalAngles: measured.horizontalAngles,

  intensities: measured.candelaValues,

  intensityScale: measured.candelaMultiplier,

  symmetry: 'rotational'

});
```

loader-produced `ColorLUT` values are structurally compatible with the numerical model; pass the decoded table directly to `createColorLUTSampler` or `applyColorLUT`. Importing these utilities adds no mandatory dependency to either project. File readers retain their own revision, metadata, codec and precision contracts.
