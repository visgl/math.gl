# Tide prediction

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

Harmonic tide prediction from the harmonic constants of a station. The caller supplies the constants. The subpath supplies the node factors and the equilibrium arguments of Schureman (1958), with the conventions of NOAA CO-OPS predictions.

```
import {JulianDate} from '@math.gl/earth/celestial';

import {getTideHeight, type TidalConstituent} from '@math.gl/earth/ocean';



// Two of the 37 NOAA harmonic constants of station 9414290 (San Francisco): amplitude in

// metres, Greenwich phase in degrees, speed in degrees per hour.

const constituents: TidalConstituent[] = [

  {name: 'M2', amplitude: 0.576, phase: 208.2, speed: 28.984104},

  {name: 'K1', amplitude: 0.37, phase: 225.4, speed: 15.041069}

  // ...the other constituents of the station

];



// UTC with an offset of zero is close enough to UT1 for tide prediction.

const date = JulianDate.fromUnixMilliseconds(Date.UTC(2026, 6, 1, 12), 0, 'UT1');

const height = getTideHeight(constituents, date); // metres above mean sea level
```

## Formula[​](#formula "Direct link to Formula")

```
h(t) = Z0 + Σ f·H·cos(a·t + (V0 + u) − κ)
```

| Symbol        | Meaning                                                                        | Source                                                        |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `Z0`          | Height of mean water level above the height datum                              | Caller, `options.datumOffset`                                 |
| `H`, `κ`, `a` | Amplitude, Greenwich phase lag and speed of each constituent                   | Caller, `TidalConstituent`                                    |
| `t`           | Hours from 0 h on 1 January of the calendar year of the instant                | `date`                                                        |
| `f`           | Node factor for the middle of that year                                        | [`getTidalNodeFactor`](#gettidalnodefactor)                   |
| `V0 + u`      | Equilibrium argument: V0 at the start of the year, u at the middle of the year | [`getTidalEquilibriumArgument`](#gettidalequilibriumargument) |

One value of `f` and `u` for each year and constituent is the NOAA convention (Parker 2007, p. 41).

## Supported constituents[​](#supported-constituents "Direct link to Supported constituents")

The 37 constituents that NOAA CO-OPS publishes for its stations, with the NOAA names:

* Long period: `SA`, `SSA`, `MM`, `MSF`, `MF`.
* Diurnal: `2Q1`, `Q1`, `RHO`, `O1`, `M1`, `P1`, `S1`, `K1`, `J1`, `OO1`.
* Semidiurnal: `2N2`, `MU2`, `N2`, `NU2`, `M2`, `LAM2`, `L2`, `T2`, `S2`, `R2`, `K2`, `2SM2`.
* Terdiurnal and shorter: `M3`, `2MK3`, `MK3`, `MN4`, `M4`, `MS4`, `S4`, `M6`, `S6`, `M8`.

An unsupported name throws `RangeError`.

## getTideHeight[​](#gettideheight "Direct link to getTideHeight")

```
getTideHeight(

  constituents: readonly TidalConstituent[],

  date: JulianDate,

  options?: {datumOffset?: number}

): number
```

Returns the tide height at `date`, in the unit of the amplitudes, above the datum of `datumOffset` (default 0).

* `date` must be in the UT1 time scale. One second of time moves the M2 phase by about 0.008°. A caller without a UT1 model can use UTC with an offset of zero.
* The calendar year of `date` must be from 1800 to 2200.
* The phases must be Greenwich phases (NOAA `phase_GMT`), not local phases.
* `amplitude` and `speed` must be finite and not negative. `phase` and `datumOffset` must be finite.

## getTidalNodeFactor[​](#gettidalnodefactor "Direct link to getTidalNodeFactor")

```
getTidalNodeFactor(name: TidalConstituentName, year: number): number
```

Returns the node factor `f` for the middle of a calendar year, from 1800 to 2200. The formulas are those of Schureman (1958): (73) to (78) and (149) for the lunar constituents, (207) for M1, (215) for L2, (227) for K1 and (235) for K2. Solar constituents have `f = 1`. Shallow-water constituents multiply the factors of their components (Schureman, table 2a). MSf uses the factor of M2, as the footnote of Schureman's table 14 states.

## getTidalEquilibriumArgument[​](#gettidalequilibriumargument "Direct link to getTidalEquilibriumArgument")

```
getTidalEquilibriumArgument(name: TidalConstituentName, year: number): number
```

Returns `V0 + u` in degrees, from 0 to 360, for the Greenwich meridian. `V0` is the argument at 0 h on 1 January. `u` is the nodal part at the middle of the year. The arguments are those of Schureman (1958), tables 2 and 2a, with the mean longitudes of his table 1.

M1 uses the argument of Schureman's formula (201): `V = T − s + h − 90°` and `u = ξ − ν + Q`. The mean longitude of the lunar perigee is then part of `u`. Schureman's tables 13 and 15 use this form, and NOAA predictions agree with it.

## Accuracy[​](#accuracy "Direct link to Accuracy")

* Against NOAA CO-OPS hourly predictions for station 9414290 (San Francisco) for 2026, with the 37 harmonic constants that NOAA publishes for the station: at most 1.3 mm difference, 0.44 mm RMS. NOAA prints the predictions to 1 mm. The test gate is 0.01 m.
* Against the node factors of Schureman's table 14 for 1990 to 1999: within 0.0015 for most constituents, and within 0.009 for M1, L2, OO1 and K2. Schureman states that his tables come from slightly different formulas.

These are evaluation errors of the prediction method. The accuracy of a prediction at a real station depends on its harmonic constants, on weather and on river flow.

## Limits[​](#limits "Direct link to Limits")

* No harmonic constants or station catalogue. The caller supplies the constants.
* No harmonic analysis. The functions predict from known constants only.
* No satellite-constituent method (Foreman 1977), no current predictions and no conversion between vertical datums.

## Sources[​](#sources "Direct link to Sources")

* Schureman, P. (1958). *Manual of harmonic analysis and prediction of tides.* Special Publication 98, U.S. Coast and Geodetic Survey. Tables 1, 2, 2a and 14; formulas (73) to (78), (149), (191), (194) to (207), (212) to (215), (222) to (227) and (230) to (235). [NOAA copy](https://tidesandcurrents.noaa.gov/publications/SpecialPubNo98.pdf).
* Parker, B. B. (2007). *Tidal Analysis and Prediction.* NOAA Special Publication NOS CO-OPS 3, section 2.2.4. [NOAA copy](https://tidesandcurrents.noaa.gov/publications/Tidal_Analysis_and_Predictions.pdf).
