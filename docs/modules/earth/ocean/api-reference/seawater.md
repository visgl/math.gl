# Seawater state

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

A subset of TEOS-10, the international thermodynamic equation of seawater. Each function
names its Gibbs SeaWater (GSW) counterpart, so that you can find the reference function.

```typescript
import {getConservativeTemperature, getSeawaterDensity} from '@math.gl/earth/ocean';
```

## Domain

`getSeawaterDensity` and `getSeawaterSoundSpeed` accept the "oceanographic funnel" of
Roquet et al. (2015), where the 75-term polynomial was fit. The limits follow GSW
`gsw_infunnel`:

- 0 ≤ SA ≤ 42 g/kg and 0 ≤ p ≤ 8000 dbar.
- Θ is not below the freezing Conservative Temperature at p, or at 500 dbar when p ≥ 500 dbar.
  This subpath uses the polynomial freezing temperature.
- Θ ≤ 40 °C. (GSW sets no upper limit above 500 dbar; this subpath does.)
- From 500 to 6500 dbar: SA ≥ 0.005 p − 2.5 and Θ ≤ 31.67 − 0.003333 p.
- From 6500 dbar: SA ≥ 30 g/kg and Θ ≤ 10 °C.

The other functions state their domain below.

## Functions

#### `getReferenceSalinity(practicalSalinity)`

Returns Reference Salinity SR in g/kg: `SR = (35.16504 / 35) × SP`. Practical Salinity is
from 0 to 42. GSW: `gsw_SR_from_SP`.

#### `getAbsoluteSalinity`

`getAbsoluteSalinity(practicalSalinity, absoluteSalinityAnomaly = 0)`

Returns Absolute Salinity `SA = SR + δSA` in g/kg. `absoluteSalinityAnomaly` (δSA) is in
g/kg, from −1 to 1. GSW: `gsw_SA_from_SP`.

The subpath has no Absolute Salinity Anomaly Ratio (SAAR) atlas; the GSW-C source of the atlas
is 8.7 MB. With the default δSA = 0, SA is equal to Reference Salinity. In the GSW atlas the
anomaly ratio is below 8.6e-4 outside the Black Sea area, so the open-ocean δSA is at most
about 0.03 g/kg; the largest open-ocean values are in the deep Pacific. Pass an atlas or a
measured δSA for a better value. The Baltic Sea uses a different relation in GSW, and this
function does not cover it.

#### `getConservativeTemperature(absoluteSalinity, temperature, seaPressure)`

Returns Conservative Temperature Θ in °C (ITS-90) from in-situ temperature. GSW: `gsw_CT_from_t`.

- `absoluteSalinity`: 0 to 42 g/kg. `temperature`: −3 to 40 °C. `seaPressure`: 0 to 8000 dbar.

The function finds the potential temperature (reference pressure 0 dbar) with a Newton
iteration on the entropy of the TEOS-10 Gibbs function (IAPWS R13-08 and SR7-09). It then
divides the potential enthalpy by c_p0 = 3991.86795711963 J/(kg K).

#### `getSeawaterDensity(absoluteSalinity, conservativeTemperature, seaPressure)`

Returns in-situ density in kg/m³ from the 75-term polynomial for specific volume
(Roquet et al. 2015). GSW: `gsw_rho`. Domain: the funnel above.

#### `getSeawaterSoundSpeed`

`getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure)`

Returns the speed of sound in m/s from the 75-term polynomial. GSW: `gsw_sound_speed`.
Domain: the funnel above.

#### `getSeawaterFreezingTemperature(absoluteSalinity, seaPressure, airSaturationFraction)`

Returns the in-situ temperature, °C, at which seawater freezes. GSW: `gsw_t_freezing_poly`.

- `absoluteSalinity`: 0 to 42 g/kg. `seaPressure`: 0 to 8000 dbar.
- `airSaturationFraction`: 0 for air-free seawater to 1 for air-saturated seawater.

The function evaluates the freezing Conservative Temperature polynomial of McDougall et al.
(2014) and converts it to in-situ temperature with the Gibbs function. The exact freezing
temperature needs the Gibbs function of ice, which is not in this subset. Over SA 0 to 42 g/kg,
p 0 to 8000 dbar and all saturation fractions, the polynomial minus the exact GSW value
(`gsw_t_freezing`) is −3.3e-4 K to 2.3e-4 K.

#### `getHeightFromSeaPressure(seaPressure, latitude, options?)`

Returns the height in metres, negative below the sea surface. GSW: `gsw_z_from_p`.

- `seaPressure`: 0 to 8000 dbar. `latitude`: −90 to 90 degrees.
- `options.dynamicHeightAnomaly`: Ψ in m²/s², default 0 (GSW `geo_strf_dyn_height`).
  With 0 the function assumes a standard ocean, SA = 35.16504 g/kg and Θ = 0 °C.
- `options.seaSurfaceGeopotential`: in m²/s², default 0 (GSW `sea_surface_geopotential`).
- `options.surfaceGravity`: in m/s², from 9.7 to 9.9. The default is the GSW formula
  `9.780327 (1 + (5.2792e-3 + 2.32e-5 sin²φ) sin²φ)`.

The function solves `h(p) − Ψ − Φ0 = −g (z − γ z² / 2)` for z, with γ = 2.26e-7 m⁻¹, where h(p)
is the dynamic enthalpy of the standard ocean from the 75-term polynomial (TEOS-10 manual,
eq. 3.32.3).

The default gravity formula differs from the WGS84 normal gravity by 1.3e-7 to 2.2e-7
(relative). At 8000 dbar that moves the height by less than 2 mm. To use another gravity, pass
`surfaceGravity`. The subpath does not import a gravity model.

#### `getSeaPressureFromHeight(height, latitude, options?)`

Returns the sea pressure in dbar at a height, with the same options. It inverts
`getHeightFromSeaPressure` with a Newton iteration to full precision. GSW: `gsw_p_from_z`.
A height whose pressure is outside 0 to 8000 dbar throws `RangeError`.

## Qualification

The controls are the three GSW check casts of `gsw_check_data.h` in GSW-C 3.06.16
(98 valid levels, 0 to 6131 dbar), plus 63 controls at the edges of the domain from the
unmodified GSW-C, compiled offline. The gates are the GSW check tolerances:

| Function | Gate |
| --- | --- |
| `getReferenceSalinity`, `getAbsoluteSalinity` | 1.3e-10 g/kg |
| `getConservativeTemperature` | 6.3e-10 °C |
| `getSeawaterDensity` | 2.9e-10 kg/m³ |
| `getSeawaterSoundSpeed` | 2.6e-9 m/s |
| `getSeawaterFreezingTemperature` | 2.2e-11 °C |
| `getHeightFromSeaPressure` | 2.3e-8 m |
| `getSeaPressureFromHeight` | 2.3e-8 dbar |

`modules/earth/scripts/ocean/generate-seawater-reference.py` regenerates the controls from a
GSW-C checkout at the pinned commit.

## References

- IOC, SCOR and IAPSO (2010). *The international thermodynamic equation of seawater – 2010:
  Calculation and use of thermodynamic properties.* Manuals and Guides 56, UNESCO.
- IAPWS R13-08 (2008). Release on the IAPWS Formulation 2008 for the Thermodynamic Properties
  of Seawater, Table 2. IAPWS SR7-09 (2009). Supplementary Release on a Computationally
  Efficient Thermodynamic Formulation for Liquid Water for Oceanographic Use, Table 2.
- Roquet, Madec, McDougall and Barker (2015). Accurate polynomial expressions for the density
  and specific volume of seawater using the TEOS-10 standard. *Ocean Modelling* 90, 29–43,
  [doi:10.1016/j.ocemod.2015.04.002](https://doi.org/10.1016/j.ocemod.2015.04.002).
- McDougall, Barker, Feistel and Galton-Fenzi (2014). Melting of ice and sea ice into seawater
  and frazil ice formation. *J. Phys. Oceanogr.* 44, 1751–1775,
  [doi:10.1175/JPO-D-13-0253.1](https://doi.org/10.1175/JPO-D-13-0253.1).
- [GSW-C](https://github.com/TEOS-10/GSW-C) 3.06.16, comparator only.
