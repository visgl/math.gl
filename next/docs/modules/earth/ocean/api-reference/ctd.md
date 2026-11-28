# CTD casts

![From v5.1](https://img.shields.io/badge/From-v5.1-blue.svg?style=flat-square)

Functions for a conductivity, temperature and depth (CTD) cast. They convert conductivity to Practical Salinity, compute potential temperature and potential density, and compute the buoyancy frequency squared N² of a cast. Each function names its Gibbs SeaWater (GSW) counterpart, so that you can find the reference function.

```
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

## From a raw cast to N²[​](#from-a-raw-cast-to-n "Direct link to From a raw cast to N²")

Follow these steps to process a raw cast:

1. Convert conductivity to Practical Salinity SP with `getPracticalSalinityFromConductivity`.
2. Convert SP to Absolute Salinity SA with `getAbsoluteSalinity`.
3. Convert in-situ temperature to Conservative Temperature Θ with `getConservativeTemperature`.
4. Compute N² with `getBuoyancyFrequencySquared`.

Every step throws `RangeError` for a value outside its domain:

* A non-finite value throws.
* A negative conductivity or a negative sea pressure throws.
* `getPracticalSalinityFromConductivity` throws when the extended scale gives SP below 0. This occurs for C more than 0 and less than approximately 0.0007 to 0.0024 mS/cm.
* `getAbsoluteSalinity` rejects SP below 0.

A cast that starts in air has surface levels with C near 0. Sensor noise can make C or p slightly negative there. Remove these levels and the levels with a `NaN` value before step 1. Keep only the valid levels:

```
// A threshold above 0.0024 mS/cm, the largest C that gives SP below 0. Set it for your sensor.

const minConductivity = 0.005;

const valid = Array.from(

  seaPressure,

  (_, i) =>

    [conductivity[i], temperature[i], seaPressure[i]].every(Number.isFinite) &&

    conductivity[i] >= minConductivity &&

    seaPressure[i] >= 0

);

const keep = (values: ArrayLike<number>) => Array.from(values).filter((_, i) => valid[i]);

const [c, t, p] = [keep(conductivity), keep(temperature), keep(seaPressure)];

// Run steps 1 to 4 with c, t and p.
```

N² between two levels that surround a gap is a mean over the gap. It is not a value for the gap.

## Domain[​](#domain "Direct link to Domain")

* PSS-78 (Unesco 1981, 1983) defines Practical Salinity for SP from 2 to 42.
* From 0 to 2, the function uses the extension of Hill, Dauphinee and Woods (1986), as the TEOS-10 manual describes. The two ranges are continuous at SP = 2.
* Temperature is from −2 to 35 °C. Sea pressure is from 0 to 10 000 dbar.
* SP above 42 throws `RangeError`.
* The TEOS-10 functions (potential density, N², Conservative Temperature) accept only the oceanographic funnel, which stops at 8000 dbar. See [Seawater state](https://visgl.github.io/math.gl/next/docs/modules/earth/ocean/api-reference/seawater.md#domain). PSS-78 accepts 10 000 dbar, so a level between 8000 and 10 000 dbar has a salinity but no N².

## Functions[​](#functions "Direct link to Functions")

#### `getPracticalSalinityFromConductivity(conductivity, temperature, seaPressure)`[​](#getpracticalsalinityfromconductivityconductivity-temperature-seapressure "Direct link to getpracticalsalinityfromconductivityconductivity-temperature-seapressure")

Returns Practical Salinity SP (unitless, PSS-78) from conductivity in mS/cm, in-situ temperature in °C (ITS-90) and sea pressure in dbar. GSW: `gsw_SP_from_C`.

C = 0 gives SP = 0. For C more than 0 and less than a limit, the extended scale is below 0, down to −2.64e-4. The limit is 0.0007 mS/cm at −2 °C and 0 dbar, and 0.0024 mS/cm at 35 °C and 10 000 dbar. GSW-C returns `GSW_INVALID_VALUE` there, so the function throws `RangeError`.

Gate: 1.3e-10 against GSW-C 3.06.16.

#### `getConductivityFromPracticalSalinity(practicalSalinity, temperature, seaPressure)`[​](#getconductivityfrompracticalsalinitypracticalsalinity-temperature-seapressure "Direct link to getconductivityfrompracticalsalinitypracticalsalinity-temperature-seapressure")

Returns conductivity in mS/cm. It inverts `getPracticalSalinityFromConductivity` with a fixed number of Newton steps. GSW: `gsw_C_from_SP`.

Domain: SP from 0 to 42, temperature from −2 to 35 °C, sea pressure from 0 to 10 000 dbar.

Near SP = 0 the extended scale has two roots. SP = 0 gives C = 0. An SP slightly more than 0 gives the larger root, at C from 0.0007 to 0.0024 mS/cm. Both values return to SP.

Gate: 6.2e-10 mS/cm.

#### `getPotentialTemperature(absoluteSalinity, temperature, seaPressure, referencePressure = 0)`[​](#getpotentialtemperatureabsolutesalinity-temperature-seapressure-referencepressure--0 "Direct link to getpotentialtemperatureabsolutesalinity-temperature-seapressure-referencepressure--0")

Returns the potential temperature θ in °C: the temperature that a parcel has after an adiabatic move to the reference pressure. The domain is the range check of `getConservativeTemperature`, not the funnel: SA from 0 to 42 g/kg, temperature from −3 to 40 °C and sea pressure from 0 to 8000 dbar. The reference pressure is from 0 to 10 000 dbar. GSW: `gsw_pt_from_t`.

Gate: 6.1e-10 °C.

#### `getPotentialDensity(absoluteSalinity, conservativeTemperature, referencePressure = 0)`[​](#getpotentialdensityabsolutesalinity-conservativetemperature-referencepressure--0 "Direct link to getpotentialdensityabsolutesalinity-conservativetemperature-referencepressure--0")

Returns potential density in kg/m³ (the full density, not the anomaly) from the 75-term polynomial. The level must be in the funnel at the reference pressure, so the reference pressure is at most 8000 dbar. GSW: `gsw_rho(SA, CT, p_ref)`. At 0 dbar, `gsw_sigma0` plus 1000 gives the same value.

Gate: 2.95e-10 kg/m³.

#### `getBuoyancyFrequencySquared(absoluteSalinity, conservativeTemperature, seaPressure, latitude)`[​](#getbuoyancyfrequencysquaredabsolutesalinity-conservativetemperature-seapressure-latitude "Direct link to getbuoyancyfrequencysquaredabsolutesalinity-conservativetemperature-seapressure-latitude")

Returns the square of the buoyancy frequency, in 1/s², between each pair of adjacent levels. GSW: `gsw_Nsquared`. The result is an object with two `Float64Array` values, each of length n − 1:

* `buoyancyFrequencySquared`: N² for each pair.
* `midPressure`: the sea pressure at the mid-point of each pair, in dbar.

Rules for the input:

* The cast has at least 2 levels. The pressures strictly increase.
* `latitude` is one number for the cast, or one value for each level.
* A non-finite value throws `RangeError` that names the index.
* Each level must be in the funnel.

N² is negative where the water column is unstable.

Gates: 1.6e-14 1/s² for N² and 2.3e-8 dbar for the mid-point pressure.

## Qualification[​](#qualification "Direct link to Qualification")

The controls are the GSW check casts and edge controls from GSW-C 3.06.16, compiled offline. The gates above are bounds on the evaluation error. They are not model uncertainty.

## Provenance[​](#provenance "Direct link to Provenance")

The PSS-78 polynomials and coefficients are published in Unesco (1983) and in appendix E of the TEOS-10 manual, eqs. (E.1.1) to (E.2.6). The TEOS-10 equations are published.

Hill et al. (1986) print the extension in their abstract: the two correction terms, with X = 400 Rt, Y = 100 Rt and the PSS-78 constants a0, b0 and k. The code uses that form.

The TEOS-10 manual (appendix E.2) says that the GSW form of the extension is exactly PSS-78 for SP ≥ 2 and is continuous at SP = 2. The manual does not print the rescale at SP = 2. Only the stored GSW-C outputs confirm the rescale.

The code is an original implementation. It contains no GSW source.

## References[​](#references "Direct link to References")

* Unesco (1981). The Practical Salinity Scale 1978 and the International Equation of State of Seawater 1980. *Unesco Technical Papers in Marine Science* 36.
* Unesco (1983). Algorithms for computation of fundamental properties of seawater. *Unesco Technical Papers in Marine Science* 44.
* Hill, Dauphinee and Woods (1986). The extension of the Practical Salinity Scale 1978 to low salinities. *IEEE J. Oceanic Eng.* 11, 109–112.
* IOC, SCOR and IAPSO (2010). *The international thermodynamic equation of seawater – 2010.* Manuals and Guides 56, UNESCO.
* Roquet, Madec, McDougall and Barker (2015). Accurate polynomial expressions for the density and specific volume of seawater using the TEOS-10 standard. *Ocean Modelling* 90, 29–43.
