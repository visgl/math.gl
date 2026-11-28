# CTD casts

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.1-blue.svg?style=flat-square" alt="From v5.1" />
</p>

Functions for a conductivity, temperature and depth (CTD) cast. They convert conductivity to
Practical Salinity, compute potential temperature and potential density, and compute the
buoyancy frequency squared N² of a cast. Each function names its Gibbs SeaWater (GSW)
counterpart, so that you can find the reference function.

```typescript
import {
  getAbsoluteSalinity,
  getBuoyancyFrequencySquared,
  getConservativeTemperature,
  getPracticalSalinityFromConductivity
} from '@math.gl/earth/ocean';

// `conductivity` (mS/cm), `temperature` (°C) and `seaPressure` (dbar) are arrays of one cast.
const sp = Array.from(conductivity, (c, i) =>
  getPracticalSalinityFromConductivity(c, temperature[i], seaPressure[i])
);
const sa = sp.map(value => getAbsoluteSalinity(value));
const ct = sa.map((value, i) => getConservativeTemperature(value, temperature[i], seaPressure[i]));
const {buoyancyFrequencySquared, midPressure} = getBuoyancyFrequencySquared(sa, ct, seaPressure, 30);
```

## From a raw cast to N²

Follow these steps to process a raw cast:

1. Convert conductivity to Practical Salinity SP with `getPracticalSalinityFromConductivity`.
2. Convert SP to Absolute Salinity SA with `getAbsoluteSalinity`.
3. Convert in-situ temperature to Conservative Temperature Θ with `getConservativeTemperature`.
4. Compute N² with `getBuoyancyFrequencySquared`.

Every step throws `RangeError` for a non-finite value. Remove the levels that have a `NaN`
value from the raw conductivity, temperature and pressure before step 1. Keep only the valid
levels:

```typescript
const valid = Array.from(seaPressure, (_, i) =>
  [conductivity[i], temperature[i], seaPressure[i]].every(Number.isFinite)
);
const keep = (values: ArrayLike<number>) => Array.from(values).filter((_, i) => valid[i]);
const [c, t, p] = [keep(conductivity), keep(temperature), keep(seaPressure)];
// Run steps 1 to 4 with c, t and p.
```

N² between two levels that surround a gap is a mean over the gap. It is not a value for the
gap.

## Domain

- PSS-78 (Unesco 1981, 1983) defines Practical Salinity for SP from 2 to 42.
- From 0 to 2, the function uses the extension of Hill, Dauphinee and Woods (1986), as the
  TEOS-10 manual describes. The two ranges are continuous at SP = 2.
- Temperature is from −2 to 35 °C. Sea pressure is from 0 to 10 000 dbar.
- SP above 42 throws `RangeError`.
- The TEOS-10 functions (potential density, N², Conservative Temperature) accept only the
  oceanographic funnel, which stops at 8000 dbar. See [Seawater state](./seawater.md#domain).
  PSS-78 accepts 10 000 dbar, so a level between 8000 and 10 000 dbar has a salinity but no N².

## Functions

#### `getPracticalSalinityFromConductivity(conductivity, temperature, seaPressure)`

Returns Practical Salinity SP (unitless, PSS-78) from conductivity in mS/cm, in-situ
temperature in °C (ITS-90) and sea pressure in dbar. GSW: `gsw_SP_from_C`.

For C below 0.005 mS/cm, the extension returns small negative values, down to about −2.5e-4.
The function does not clamp them. Clamp them in your own code if you need non-negative
values.

Gate: 1.3e-10 against GSW-C 3.06.16.

#### `getConductivityFromPracticalSalinity(practicalSalinity, temperature, seaPressure)`

Returns conductivity in mS/cm. It inverts `getPracticalSalinityFromConductivity` with a fixed
number of Newton steps. GSW: `gsw_C_from_SP`.

Domain: SP from 0 to 42, temperature from −2 to 35 °C, sea pressure from 0 to 10 000 dbar.

Gate: 6.2e-10 mS/cm.

#### `getPotentialTemperature(absoluteSalinity, temperature, seaPressure, referencePressure = 0)`

Returns the potential temperature θ in °C: the temperature that a parcel has after an
adiabatic move to the reference pressure. The domain is the range check of
`getConservativeTemperature`, not the funnel: SA from 0 to 42 g/kg, temperature from −3 to
40 °C and sea pressure from 0 to 8000 dbar. The reference pressure is from 0 to 10 000 dbar.
GSW: `gsw_pt_from_t`.

Gate: 6.1e-10 °C.

#### `getPotentialDensity(absoluteSalinity, conservativeTemperature, referencePressure = 0)`

Returns potential density in kg/m³ (the full density, not the anomaly) from the 75-term
polynomial. The level must be in the funnel at the reference pressure, so the reference
pressure is at most 8000 dbar. GSW: `gsw_rho(SA, CT, p_ref)`. At 0 dbar, `gsw_sigma0` plus
1000 gives the same value.

Gate: 2.95e-10 kg/m³.

#### `getBuoyancyFrequencySquared(absoluteSalinity, conservativeTemperature, seaPressure, latitude)`

Returns the square of the buoyancy frequency, in 1/s², between each pair of adjacent levels.
GSW: `gsw_Nsquared`. The result is an object with two `Float64Array` values, each of length
n − 1:

- `buoyancyFrequencySquared`: N² for each pair.
- `midPressure`: the sea pressure at the mid-point of each pair, in dbar.

Rules for the input:

- The cast has at least 2 levels. The pressures strictly increase.
- `latitude` is one number for the cast, or one value for each level.
- A non-finite value throws `RangeError` that names the index.
- Each level must be in the funnel.

N² is negative where the water column is unstable.

Gates: 1.6e-14 1/s² for N² and 2.3e-8 dbar for the mid-point pressure.

## Qualification

The controls are the GSW check casts and edge controls from GSW-C 3.06.16, compiled offline.
The gates above are bounds on the evaluation error. They are not model uncertainty.

## Provenance

The PSS-78 polynomials and the TEOS-10 equations are published. The tests compare the Hill
denominator terms with GSW-C outputs. They also compare the rescale at SP = 2 that makes the
two ranges continuous. The TEOS-10 manual requires continuity but does not print the factor.
The code is an original implementation. It contains no GSW source.

## References

- Unesco (1981). The Practical Salinity Scale 1978 and the International Equation of State of
  Seawater 1980. *Unesco Technical Papers in Marine Science* 36.
- Unesco (1983). Algorithms for computation of fundamental properties of seawater.
  *Unesco Technical Papers in Marine Science* 44.
- Hill, Dauphinee and Woods (1986). The extension of the Practical Salinity Scale 1978 to low
  salinities. *IEEE J. Oceanic Eng.* 11, 109–112.
- IOC, SCOR and IAPSO (2010). *The international thermodynamic equation of seawater – 2010.*
  Manuals and Guides 56, UNESCO.
- Roquet, Madec, McDougall and Barker (2015). Accurate polynomial expressions for the density
  and specific volume of seawater using the TEOS-10 standard. *Ocean Modelling* 90, 29–43.
