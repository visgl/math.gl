# @math.gl/earth/ocean

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`@math.gl/earth/ocean` supplies seawater and underwater-acoustics equations for browser
applications: Absolute Salinity, Conservative Temperature, density, freezing temperature,
sound speed, pressure-to-height conversion, CTD cast processing (conductivity to salinity,
potential temperature and density, buoyancy frequency), sound absorption and harmonic tide
prediction.

The entry point has no datasets, no runtime dependencies and no downloads. It does not
initialize the geoid, timezone or astronomy modules. Import it explicitly:

```typescript
import {
  getAbsoluteSalinity,
  getConservativeTemperature,
  getSeaPressureFromHeight,
  getSeawaterSoundSpeed,
  getSoundAbsorptionFrancoisGarrison
} from '@math.gl/earth/ocean';

// One level of a temperature and salinity cast at 1000 m depth, latitude 30°.
const seaPressure = getSeaPressureFromHeight(-1000, 30); // dbar
const absoluteSalinity = getAbsoluteSalinity(34.5); // g/kg, no atlas anomaly
const conservativeTemperature = getConservativeTemperature(absoluteSalinity, 4.2, seaPressure);
const soundSpeed = getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure); // m/s

const absorption = getSoundAbsorptionFrancoisGarrison({
  frequency: 12000, // Hz
  temperature: 4.2,
  salinity: 34.5,
  depth: 1000
}); // dB/km
```

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| [Seawater state (TEOS-10 subset)](./api-reference/seawater.md) | ✅ | Salinity, Conservative Temperature, density, sound speed, freezing temperature, pressure ↔ height. |
| [CTD casts](./api-reference/ctd.md) | ✅ | Conductivity ↔ Practical Salinity (PSS-78), potential temperature, potential density, buoyancy frequency squared N². |
| [Classic sound-speed equations](./api-reference/sound.md#sound-speed) | ✅ | Chen–Millero (UNESCO), Del Grosso, Mackenzie. |
| [Sound absorption](./api-reference/sound.md#sound-absorption) | ✅ | Francois–Garrison, Ainslie–McColm. |
| Absolute Salinity Anomaly atlas | ❌ | The caller supplies δSA. See [`getAbsoluteSalinity`](./api-reference/seawater.md#getabsolutesalinity). |
| Sea ice, exact Gibbs-function sound speed | ❌ | Not in this subset. |
| [Harmonic tide prediction](./api-reference/tide.md) | ✅ | Height from caller-supplied harmonic constants; node factors and equilibrium arguments of Schureman (1958) with the NOAA conventions. |
| Ray paths, wave spectra | ❌ | Planned. See the [ocean roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/ocean-roadmap.md). |

## Conventions

- **Pressure** is sea pressure in dbar: absolute pressure minus 10.1325 dbar. This is the
  Gibbs SeaWater (GSW) convention.
- **Height** is in metres, negative below the sea surface. **Depth** (Mackenzie and the
  absorption equations) is in metres, positive down.
- **Temperature** is in °C on the ITS-90 scale. The classic equations predate ITS-90; each
  function states its scale.
- **Salinity**: the TEOS-10 functions take Absolute Salinity SA (g/kg). The conversion
  functions and the classic equations take Practical Salinity SP (PSS-78, unitless). The
  parameter names state which one.
- **Errors**: each function declares its input domain. A non-finite input, or an input
  outside the domain, throws `RangeError`.

## Accuracy

The stated gates are evaluation errors against reference implementations or published
values. They are not model uncertainty. Each function states the published accuracy of its
equation separately.

- The TEOS-10 functions match GSW-C 3.06.16 within the GSW check tolerances: for example
  6.3e-10 °C for Conservative Temperature and 2.6e-9 m/s for sound speed.
- The classic equations match an independent 40-digit evaluation within 1e-9 m/s for sound
  speed and 1e-12 (relative) for absorption, and match the published check values at their
  printed precision.
- Tide prediction matches one year of NOAA CO-OPS hourly predictions within 1.3 mm. See
  [Tide prediction](./api-reference/tide.md#accuracy).

This is not a navigation-grade depth source, an ocean model or a full GSW library.

## Licences and sources

The code is original and MIT-licensed. It implements the published equations of the
TEOS-10 manual (IOC, SCOR and IAPSO 2010), the IAPWS releases R13-08 and SR7-09, and
Roquet et al. (2015), PSS-78 (Unesco 1981, 1983) with the extension of Hill, Dauphinee and
Woods (1986), and Schureman (1958) for tide prediction. The GSW toolbox (TEOS-10/GSW-C) is used only offline, as a
comparator; its licence permits redistribution only without modification, so no GSW source
is copied. See the [package notices](https://github.com/visgl/math.gl/blob/master/modules/earth/THIRD-PARTY-NOTICES.md).
