# Solar-system bodies

Rotation models, radii, gravitational parameters and approximate positions of the Sun, the
planets and the Moon. The functions are pure. They include no ephemeris file, no kernel and no
download. Each function takes a `JulianDate` in the TT scale.

```ts
import {
  JulianDate,
  getApproximatePlanetPosition,
  getBodyFixedFrame,
  getBodySubsolarPoint
} from '@math.gl/earth/celestial';

const tt = JulianDate.fromUnixMilliseconds(Date.now(), ttMinusUtc, 'TT');

// ICRF to the body-fixed frame of Mars, with its rate per second.
const frame = getBodyFixedFrame('mars', tt);

// The Sun as seen from Mars: the negative of the heliocentric position of Mars.
const [x, y, z] = getApproximatePlanetPosition('mars', tt);
const subsolar = getBodySubsolarPoint('mars', tt, [-x, -y, -z]);
```

## Bodies

`SolarSystemBody` is `'sun'`, `'mercury'`, `'venus'`, `'earth'`, `'moon'`, `'mars'`,
`'jupiter'`, `'saturn'`, `'uranus'` or `'neptune'`. `SOLAR_SYSTEM_BODIES` lists them.

### getBodyRadii(body)

Returns `{equatorialRadius, polarRadius}` in metres. The values are those of the IAU WGCCRE 2015
report (Archinal et al. 2018, Tables 4 and 5) as NAIF `pck00011.tpc` gives them. The Earth values
(6378136.6 m and 6356751.9 m) are the IAU values, not WGS84.

### getBodyGravitationalParameter(body)

Returns GM in m³/s², without the satellites of the body. The source is NAIF `gm_de440.tpc`: the
DE440 values (Park et al. 2021) for the Sun, Mercury, Venus, the Earth and the Moon, and the JPL
satellite ephemeris solutions for Mars to Neptune.

## Rotation

### getBodyRotationElements(body, tt)

Returns `{poleRightAscension, poleDeclination, primeMeridian}` in degrees: α0 and δ0 of the north
pole in the ICRF, and the angle W of the prime meridian. α0 and W are in [0, 360). The models are
the IAU WGCCRE 2015 models, with the periodic terms of Mercury, the Moon, Mars, Jupiter and
Neptune.

### getBodyFixedFrame(body, tt)

Returns a `CelestialFrameTransform` from `'ICRF'` to `'IAU_<BODY>'` (for example `'IAU_MARS'`).
The rotation is `Rz(W) Rx(90° − δ0) Rz(90° + α0)`, where each factor rotates the frame. The rate
includes the derivatives of α0, δ0 and W, so `transformState` gives body-fixed velocities.

The supported dates are 1900-01-01T12:00 TT to 2100-01-01T12:00 TT. Other dates throw `RangeError`.

Limits:

- The IAU Earth model is linear. It has no nutation and no polar motion, and it uses TT in place
  of UT1. Its error in W is of the order of 0.1 degree. Use an Earth orientation model for precise
  work on the Earth.
- The IAU Moon model approximates the mean Earth/polar axis frame. It is not the principal axis
  frame of a lunar ephemeris.
- The IAU models use TDB. The functions use TT in place of TDB; the two differ by less than 2 ms. At
  the same physical instant, that moves W by up to about 1e-5 degrees for Jupiter.

## Approximate planet positions

### getApproximatePlanetPosition(planet, tt, options?)

Returns the heliocentric position of a planet in au, from the Keplerian elements of E. M. Standish
and J. G. Williams ([JPL, "Approximate Positions of the Planets"](https://ssd.jpl.nasa.gov/planets/approx_pos.html)).
`planet` is `'mercury'`, `'venus'`, `'earth-moon-barycenter'`, `'mars'`, `'jupiter'`, `'saturn'`,
`'uranus'` or `'neptune'`. The Earth is the Earth-Moon barycenter. `options.frame` is
`'equatorial'` (ICRF axes, the default) or `'ecliptic'` (mean ecliptic and equinox of J2000).

The function uses Table 1 from 1800 to 2050, and Tables 2a and 2b from 3000 BC to 3000 AD outside
that interval. At 2050-01-01T12:00 TT the position thus changes by a small step. Other dates throw
`RangeError`. The position is geometric: it has no light time and no aberration.

JPL states these nominal errors of Table 1: longitude and latitude in arcseconds, distance in
1000 km. The measured column is the largest heliocentric error against DE440 from 1850 to 2050,
in steps of 97.3 days. JPL calls its figures nominal, and the measured errors are larger for some
planets. The tests store DE440 positions every 1000 days and use gates a little above the measured
values.

| Planet | JPL nominal, Table 1 | Measured against DE440 | JPL nominal, Table 2 |
| --- | --- | --- | --- |
| Mercury | 15, 1, 1 | 29, 4, 2 | 20, 15, 1 |
| Venus | 20, 1, 4 | 26, 2, 6 | 40, 30, 8 |
| Earth-Moon barycenter | 20, 8, 6 | 22, 6, 7 | 40, 15, 15 |
| Mars | 40, 2, 25 | 93, 3, 38 | 100, 40, 30 |
| Jupiter | 400, 10, 600 | 516, 11, 640 | 600, 100, 1000 |
| Saturn | 600, 25, 1500 | 739, 30, 2811 | 1000, 100, 4000 |
| Uranus | 50, 2, 1000 | 122, 4, 1552 | 2000, 30, 8000 |
| Neptune | 10, 1, 200 | 60, 2, 1605 | 400, 15, 4000 |

For Uranus and Neptune, most of the heliocentric error is the motion of the Sun about the
barycenter of the solar system. Against barycentric DE440 positions the Neptune errors are 11, 0.5
and 299, near the JPL figures.

For the Moon, or for better accuracy, supply positions from an ephemeris of your choice.

## Lighting

### getBodySunDirection(body, tt, sunPosition)

Returns the unit vector to the Sun in the body-fixed frame. `sunPosition` is the vector from the
center of the body to the Sun in ICRF axes, in any unit, from any ephemeris.

### getBodySubsolarPoint(body, tt, sunPosition)

Returns the planetocentric `{longitude, latitude}` of the subsolar point in degrees, longitude east
positive in (−180, 180]. The terminator is the great circle 90 degrees from this point, without
refraction.

## Atmospheres

### getBodyAtmosphere(body)

Returns the single-scattering atmosphere parameters of a body, or `null` for the Sun, Mercury and
the Moon. Mercury and the Moon have only a surface-bounded exosphere. `BODIES_WITH_ATMOSPHERE`
lists the bodies that have parameters: Venus, the Earth, Mars and the four giant planets.

```ts
import {getBodyAtmosphere} from '@math.gl/earth/celestial';

const mars = getBodyAtmosphere('mars');
// Vertical Mie optical depth at 550 nm: 0.5.
const tau = mars.mieExtinction[1] * mars.mieScaleHeight;
```

The model is a spherical shell from `baseRadius` to `topRadius` (metres) with two exponential
profiles: gas (Rayleigh) and aerosols (Mie). Each coefficient is the value at the base, in m⁻¹,
for the wavelengths `ATMOSPHERE_WAVELENGTHS` (680, 550 and 440 nm). At height h above the base,
the coefficient is the base value times exp(−h / H). Use the phase and Chapman functions of
[`@math.gl/earth/sun`](../sun/api-reference/sun.md) (`getRayleighPhaseFunction`,
`getHenyeyGreensteinPhaseFunction`, `getChapmanGrazingIncidenceFunction`) with these parameters.

| Field | Unit | Meaning |
| --- | --- | --- |
| `baseAltitude`, `topAltitude` | m | Base and top of the shell above the equatorial radius of `getBodyRadii` |
| `baseRadius`, `topRadius` | m | Equatorial radius plus the altitudes |
| `rayleighScaleHeight`, `mieScaleHeight` | m | Scale heights H of the gas and the aerosols |
| `rayleighScattering` | m⁻¹, RGB | Gas scattering at the base |
| `mieScattering`, `mieExtinction` | m⁻¹, RGB | Aerosol scattering and extinction at the base; zero when there is no aerosol data |
| `mieAsymmetry` | 1 | Henyey-Greenstein g of the aerosols |
| `cloudDeck` | | `{albedo}` of an opaque deck at the base (Venus), or `null` |
| `references` | | The sources of the values |

| Body | Base | Top | Gas | Aerosols |
| --- | --- | --- | --- | --- |
| Venus | cloud tops, 70 km (VIRA, 3700 Pa, 230 K) | 110 km | 96.5 % CO2, H = 5.08 km | upper haze, τ = 0.3, H = 4 km, g = 0.7 |
| Earth | surface | 60 km | Bruneton (2017) constants, H = 8 km | τ = 0.0053, H = 1.2 km, g = 0.8 |
| Mars | surface (636 Pa, 214 K) | 80 km | 95.1 % CO2, H = 11.0 km | dust, τ = 0.5, H = 11.0 km, g = 0.65 |
| Jupiter to Neptune | 1-bar level (the IAU radius) | 8 H | H2 and He at 1 bar, H of the fact sheet | none |

The Earth has the demo constants of Bruneton (2017), which many renderers use. Its Rayleigh
coefficient at 550 nm is about 18 % above the value of dry air at 15 °C and 101325 Pa. For the
other bodies, the Rayleigh coefficient is the number density p / (k T) times the cross-section
of `getRayleighCrossSection`.

Limits:

- The values are typical. They are not a model of seasons, weather or dust storms.
- Ozone absorption (Earth) and methane absorption (Uranus, Neptune) are not modeled. Methane is
  also left out of the Rayleigh sum.
- The tops of the shells are model choices, at about 7 to 8 gas scale heights.
- The cloud-deck albedo of Venus is a visual approximation near the Bond albedo 0.77, not a
  measured spectrum.

### getRayleighCrossSection(gas, wavelength)

Returns the Rayleigh cross-section of one molecule in m²:
σ = 24 π³ / (λ⁴ Nₛ²) ((nₛ² − 1) / (nₛ² + 2))² F (Bodhaine et al. 1999, eq. 2). `gas` is `'air'`,
`'carbon-dioxide'`, `'hydrogen'` or `'helium'`. `wavelength` is in metres, from 0.4e−6 to
0.8e−6. The refractivities are those of Ciddor (1996), Bideau-Mehu et al. (1973), Peck & Huang
(1977) and Mansfield & Peck (1969). The King factor F of air is that of Bates (1984), mixed as
Bodhaine et al. (1999) mix it. F is 1.15 for CO2 and 1 for H2 and He. For air at 550 nm the
result is 4.51e−31 m².

## Qualification

`modules/earth/scripts/celestial/generate-body-reference.py` writes the stored controls. It uses
CSPICE N0067 (SpiceyPy 8.4.0) with NAIF `pck00011.tpc` and `de440s.bsp`, pinned by SHA-256, and an
independent Python evaluation of the JPL element tables, parsed from the JPL table text. It does
not run the TypeScript code. Ordinary CI uses only the stored controls.

The rotation, frame and subsolar gates state agreement with CSPICE at the same numerical
ephemeris-time argument. The generator gives CSPICE the TT seconds from J2000.0 as TDB seconds, so
the controls test the rotation models, not the TT-to-TDB conversion. At the same physical instant
the TT−TDB difference (less than 2 ms) moves W by up to about 1e-5 degrees for Jupiter. A
same-instant accuracy claim needs a TT-to-TDB conversion and its own controls.

| Function | Control | Gate |
| --- | --- | --- |
| `getBodyRotationElements` | CSPICE `pxform` and `m2eul`, 10 bodies, 9 dates, same time argument | 1e-8 degrees |
| `getBodyFixedFrame` | CSPICE `pxform` and `sxform`, same time argument | 1e-10 (matrix), 1e-14 per second (rate) |
| `getBodySubsolarPoint` | CSPICE frame, DE440 Sun position, same time argument | 1e-8 degrees |
| `getApproximatePlanetPosition` | Python evaluation of the JPL tables, 12 dates from 3000 BC to 3000 AD | 1e-10 au |
| `getApproximatePlanetPosition` | DE440, 1850 to 2050 | the measured gates above |

The angle gates come from binary64: W reaches 3e7 degrees for Jupiter in 2100.

## References

- B. A. Archinal et al. (2018), "Report of the IAU Working Group on Cartographic Coordinates and
  Rotational Elements: 2015", Celest. Mech. Dyn. Astr. 130:22, doi:10.1007/s10569-017-9805-5.
- NAIF `pck00011.tpc` and `gm_de440.tpc`, https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/.
- R. S. Park et al. (2021), "The JPL Planetary and Lunar Ephemerides DE440 and DE441", Astron. J.
  161:105, doi:10.3847/1538-3881/abd414.
- E. M. Standish and J. G. Williams, "Approximate Positions of the Planets", JPL Solar System
  Dynamics, https://ssd.jpl.nasa.gov/planets/approx_pos.html.
- D. R. Bates (1984), "Rayleigh scattering by air", Planet. Space Sci. 32, 785-790,
  doi:10.1016/0032-0633(84)90102-8.
- A. Bideau-Mehu et al. (1973), "Interferometric determination of the refractive index of carbon
  dioxide in the ultraviolet region", Opt. Commun. 9, 432-434, doi:10.1016/0030-4018(73)90289-7.
- B. A. Bodhaine et al. (1999), "On Rayleigh optical depth calculations", J. Atmos. Oceanic
  Technol. 16, 1854-1861, doi:10.1175/1520-0426(1999)016<1854:ORODC>2.0.CO;2.
- E. Bruneton (2017), "Precomputed Atmospheric Scattering: a New Implementation",
  https://github.com/ebruneton/precomputed_atmospheric_scattering.
- P. E. Ciddor (1996), "Refractive index of air: new equations for the visible and near
  infrared", Appl. Opt. 35, 1566, doi:10.1364/AO.35.001566.
- M. T. Lemmon et al. (2015), "Dust aerosol, clouds, and the atmospheric optical depth record over
  5 Mars years of the Mars Exploration Rover mission", Icarus 251, 96-111,
  doi:10.1016/j.icarus.2014.03.029.
- C. R. Mansfield and E. R. Peck (1969), "Dispersion of helium", J. Opt. Soc. Am. 59, 199,
  doi:10.1364/JOSA.59.000199.
- NASA GSFC Planetary Fact Sheets, https://nssdc.gsfc.nasa.gov/planetary/factsheet/.
- E. R. Peck and S. Huang (1977), "Refractivity and dispersion of hydrogen in the visible and near
  infrared", J. Opt. Soc. Am. 67, 1550, doi:10.1364/JOSA.67.001550.
- A. Seiff et al. (1985), "Models of the structure of the atmosphere of Venus from the surface to
  100 kilometers altitude", Adv. Space Res. 5(11), 3-58, doi:10.1016/0273-1177(85)90197-8.
- V. Wilquet et al. (2009), "Preliminary characterization of the upper haze by SPICAV/SOIR solar
  occultation in UV to mid-IR onboard Venus Express", J. Geophys. Res. 114, E00B42,
  doi:10.1029/2008JE003186.
- M. J. Wolff et al. (2009), "Wavelength dependence of dust aerosol single scattering albedo as
  observed by the Compact Reconnaissance Imaging Spectrometer", J. Geophys. Res. 114, E00D04,
  doi:10.1029/2009JE003350.
