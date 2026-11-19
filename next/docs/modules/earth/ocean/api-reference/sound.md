# Sound speed and absorption

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

Classic equations that survey software uses. Use them to reproduce existing results. For new work, [`getSeawaterSoundSpeed`](https://visgl.github.io/math.gl/next/docs/modules/earth/ocean/api-reference/seawater.md#getseawatersoundspeed) uses TEOS-10.

```
import {getSoundSpeedChenMillero, getSoundAbsorptionFrancoisGarrison} from '@math.gl/earth/ocean';
```

## Sound speed[​](#sound-speed "Direct link to Sound speed")

| Function                                                                | Source                                                                                                         | Temperature scale                                     | Domain (the stated validity)                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `getSoundSpeedChenMillero(practicalSalinity, temperature, seaPressure)` | Chen and Millero (1977), UNESCO `SVEL` (Fofonoff and Millard 1983), ITS-90 coefficients of Wong and Zhu (1995) | ITS-90                                                | 0 to 40 °C, salinity 0 to 40, 0 to 10 000 dbar. Standard deviation 0.19 m/s.                      |
| `getSoundSpeedDelGrosso(practicalSalinity, temperature, seaPressure)`   | Del Grosso (1974) NRL II, ITS-90 coefficients of Wong and Zhu (1995)                                           | ITS-90                                                | 0 to 30 °C, salinity 30 to 40, 0 to 1000 kg/cm² (0 to 9806.65 dbar). Standard deviation 0.05 m/s. |
| `getSoundSpeedMackenzie(practicalSalinity, temperature, depth)`         | Mackenzie (1981), nine-term equation                                                                           | Predates ITS-90; the difference is below its accuracy | −2 to 30 °C, salinity 30 to 40, depth 0 to 8000 m                                                 |

All three return m/s. Mackenzie uses depth in metres (positive down), not pressure. The signatures keep this difference visible.

The Mackenzie domain is the range of the paper abstract and of the APL-UW handbook (TR 9407, p. I-3). The NPL guide gives a narrower range: 2 to 30 °C and salinity 25 to 40.

The UNESCO check value, 1731.995 m/s at S = 40, t68 = 40 °C and 10 000 dbar, applies to the IPTS-68 coefficients. At t90 = 40 / 1.00024 °C, the ITS-90 coefficients give 1732.0037 m/s. The difference, 0.008 m/s, is within the 0.024 m/s change that Wong and Zhu state.

## Sound absorption[​](#sound-absorption "Direct link to Sound absorption")

Both functions take one options object and return absorption in dB/km. Each result is the sum of three terms: boric acid, magnesium sulphate and pure water.

| Option        | Unit               | `getSoundAbsorptionFrancoisGarrison`                      | `getSoundAbsorptionAinslieMcColm` |
| ------------- | ------------------ | --------------------------------------------------------- | --------------------------------- |
| `frequency`   | Hz                 | 200 Hz to 1 MHz                                           | 100 Hz to 1 MHz                   |
| `temperature` | °C                 | −2 to 30                                                  | −6 to 35                          |
| `salinity`    | Practical Salinity | 0 to 40                                                   | 5 to 50                           |
| `depth`       | m, positive down   | 0 to 10 000                                               | 0 to 7000                         |
| `pH`          | —                  | 7.7 to 8.3, default 8                                     | 7.7 to 8.3, default 8             |
| `soundSpeed`  | m/s                | 1350 to 1800; default `1412 + 3.21 T + 1.19 S + 0.0167 D` | —                                 |

**Francois and Garrison (1982).** Part II states validity for "all oceanic conditions and frequencies from 200 Hz to 1 MHz"; Part I gives 400 Hz to 1 MHz. The APL-UW handbook (TR 9407, p. I-7) gives the data behind each term: boric acid 34 to 41 salinity, −2 to 22 °C, depth to 1500 m, possibly not accurate below 200 Hz; magnesium sulphate 30 to 35 salinity, 2 to 22 °C, depth to 3500 m, verified to 600 kHz; pure water, more than 90 % of the total above 600 kHz, 0 to 30 °C, depth to 10 000 m. Local absorption can differ from the equation by ±10 % (p. I-5). NPL gives about 5 % accuracy. The pure-water term has two polynomials; the first applies at T ≤ 20 °C, as in the handbook.

**Ainslie and McColm (1998).** A simplified equation. NPL states that it is within 10 % of Francois–Garrison from 100 Hz to 1 MHz, for −6 to 35 °C, pH 7.7 to 8.3, salinity 5 to 50 and depth 0 to 7 km, each with the other inputs near 10 °C, salinity 35, pH 8 and depth 0.

## Qualification[​](#qualification "Direct link to Qualification")

* **Published check values.** Fofonoff and Millard (1983), p. 49: `SVEL` = 1731.995 m/s (IPTS-68 coefficients). APL-UW TR 9407 (1994), p. I-2: 1745.0954 m/s for the Chen–Millero–Li form; the test adds the Millero–Li term and checks the UNESCO arithmetic to the fourth decimal. APL-UW TR 9407, Table 2 (pp. I-8 to I-10): Francois–Garrison values at depth 0 and pH 8, at their printed precision. The cell at 300 kHz, 10 °C, salinity 30 is a misprint (76.2; the equation gives 67.2) and is not used.
* **Published agreement bands** (APL-UW TR 9407, pp. I-3 and I-4), for ocean-like profiles: Del Grosso and Chen–Millero–Li within 0.15 m/s; Mackenzie and Chen–Millero–Li within 0.5 m/s.
* **Independent evaluation.** No open source prints a check value for Del Grosso, Mackenzie or Ainslie–McColm. `modules/earth/scripts/ocean/generate-acoustic-reference.py` evaluates each equation in 40-digit decimal arithmetic, without the TypeScript code. Gates: 1e-9 m/s and a relative 1e-12.

## References[​](#references "Direct link to References")

* Chen and Millero (1977), *J. Acoust. Soc. Am.* 62(5), 1129–1135, [doi:10.1121/1.381646](https://doi.org/10.1121/1.381646).
* Fofonoff and Millard (1983). *Algorithms for computation of fundamental properties of seawater.* UNESCO Technical Papers in Marine Science 44, pp. 46–49.
* Wong and Zhu (1995), *J. Acoust. Soc. Am.* 97(3), 1732–1736, [doi:10.1121/1.413048](https://doi.org/10.1121/1.413048).
* Del Grosso (1974), *J. Acoust. Soc. Am.* 56(4), 1084–1091, [doi:10.1121/1.1903388](https://doi.org/10.1121/1.1903388).
* Mackenzie (1981), *J. Acoust. Soc. Am.* 70(3), 807–812, [doi:10.1121/1.386920](https://doi.org/10.1121/1.386920).
* Francois and Garrison (1982), *J. Acoust. Soc. Am.* 72: Part I, 896–907, [doi:10.1121/1.388170](https://doi.org/10.1121/1.388170); Part II, 1879–1890, [doi:10.1121/1.388673](https://doi.org/10.1121/1.388673).
* Ainslie and McColm (1998), *J. Acoust. Soc. Am.* 103(3), 1671–1672, [doi:10.1121/1.421258](https://doi.org/10.1121/1.421258).
* Applied Physics Laboratory, University of Washington (1994). *APL-UW High-Frequency Ocean Environmental Acoustic Models Handbook.* Technical Report APL-UW TR 9407.
* National Physical Laboratory, technical guides "Speed of sound in sea-water" and "Calculation of absorption of sound in seawater".
