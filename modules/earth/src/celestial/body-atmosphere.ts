// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original code. Physical data from the cited papers and the NASA GSFC planetary fact sheets. Numbers are facts, not copied code.

import {checkBody, getBodyRadii} from './solar-system-body';
import type {SolarSystemBody} from './solar-system-body';

/** Three values, one for each of {@link ATMOSPHERE_WAVELENGTHS}: red, green, blue. */
export type AtmosphereRGB = readonly [red: number, green: number, blue: number];

/**
 * The wavelengths of the RGB coefficients of {@link BodyAtmosphere}, m: 680, 550 and 440 nm, as
 * in Bruneton (2017).
 */
export const ATMOSPHERE_WAVELENGTHS: AtmosphereRGB = Object.freeze([
  680e-9, 550e-9, 440e-9
]) as AtmosphereRGB;

/**
 * The single-scattering atmosphere of a body: a spherical shell with exponential gas (Rayleigh)
 * and aerosol (Mie) profiles. Lengths are in metres, coefficients per metre. Each coefficient is
 * the value at the base of the shell, and falls off as exp(−h / H) with the height h above it.
 */
export type BodyAtmosphere = {
  /** The body. */
  readonly body: SolarSystemBody;
  /** Height of the base of the shell above the equatorial radius, m: the surface, or an opaque cloud deck. */
  readonly baseAltitude: number;
  /** Height of the top of the shell above the equatorial radius, m. */
  readonly topAltitude: number;
  /** Equatorial radius plus `baseAltitude`, m. */
  readonly baseRadius: number;
  /** Equatorial radius plus `topAltitude`, m. */
  readonly topRadius: number;
  /** Scale height of the gas, m. */
  readonly rayleighScaleHeight: number;
  /** Rayleigh scattering coefficient of the gas at the base, m⁻¹, RGB. */
  readonly rayleighScattering: AtmosphereRGB;
  /** Scale height of the aerosols, m. */
  readonly mieScaleHeight: number;
  /** Aerosol scattering coefficient at the base, m⁻¹, RGB. All zero when the body has no aerosol data. */
  readonly mieScattering: AtmosphereRGB;
  /** Aerosol extinction (scattering plus absorption) coefficient at the base, m⁻¹, RGB. */
  readonly mieExtinction: AtmosphereRGB;
  /** Henyey-Greenstein asymmetry parameter g of the aerosols, −1 < g < 1. 0 when there are no aerosols. */
  readonly mieAsymmetry: number;
  /** The opaque cloud deck at the base of the shell, or null when the base is the surface. */
  readonly cloudDeck: {
    /** Albedo of the cloud tops, RGB, from 0 to 1. A visual approximation, not a measured spectrum. */
    readonly albedo: AtmosphereRGB;
  } | null;
  /** The sources of the values. */
  readonly references: readonly string[];
};

/** A gas with a cited refractivity. `'air'` is dry air with 450 ppm CO2. */
export type AtmosphereGas = 'air' | 'carbon-dioxide' | 'hydrogen' | 'helium';

/** The Boltzmann constant, J/K (exact in the SI). */
const BOLTZMANN = 1.380649e-23;
/** Number density of an ideal gas at 101325 Pa and 288.15 K, the reference of Ciddor (1996), m⁻³. */
const DENSITY_15C = 101325 / (BOLTZMANN * 288.15);
/** Number density of an ideal gas at 101325 Pa and 273.15 K, the reference of the other refractivities, m⁻³. */
const DENSITY_0C = 101325 / (BOLTZMANN * 273.15);

/**
 * Returns n − 1 of a gas and the number density at which the formula applies.
 * @param gas - The gas.
 * @param wavelength - Vacuum wavelength, µm.
 */
function getRefractivity(
  gas: AtmosphereGas,
  wavelength: number
): [refractivity: number, density: number] {
  const s = 1 / (wavelength * wavelength);
  switch (gas) {
    case 'air':
      // Ciddor (1996), eq. 1: standard air, 15 °C, 101325 Pa, 450 ppm CO2.
      return [(5792105 / (238.0185 - s) + 167917 / (57.362 - s)) * 1e-8, DENSITY_15C];
    case 'carbon-dioxide':
      // Bideau-Mehu et al. (1973), 0 °C, 101325 Pa.
      return [
        6.991e-2 / (166.175 - s) +
          1.4472e-3 / (79.609 - s) +
          6.42941e-5 / (56.3064 - s) +
          5.21306e-5 / (46.0196 - s) +
          1.46847e-6 / (0.0584738 - s),
        DENSITY_0C
      ];
    case 'hydrogen':
      // Peck & Huang (1977), 0 °C, 101325 Pa.
      return [0.0148956 / (180.7 - s) + 0.0049037 / (92 - s), DENSITY_0C];
    case 'helium':
      // Mansfield & Peck (1969), 0 °C, 101325 Pa.
      return [0.01470091 / (423.98 - s), DENSITY_0C];
    default:
      throw new RangeError(`Unsupported gas ${String(gas)}`);
  }
}

/**
 * Returns the King correction factor (6 + 3ρ) / (6 − 7ρ) of a gas. Air: Bates (1984) for N2 and
 * O2, 1 for Ar and 1.15 for CO2, mixed as in Bodhaine et al. (1999), eq. 23. CO2: 1.15
 * (Bodhaine et al. 1999). H2 and He: 1; the small anisotropy of H2 is left out.
 * @param gas - The gas.
 * @param wavelength - Vacuum wavelength, µm.
 */
function getKingFactor(gas: AtmosphereGas, wavelength: number): number {
  const s = 1 / (wavelength * wavelength);
  switch (gas) {
    case 'air': {
      const nitrogen = 1.034 + 3.17e-4 * s;
      const oxygen = 1.096 + 1.385e-3 * s + 1.448e-4 * s * s;
      return (
        (78.084 * nitrogen + 20.946 * oxygen + 0.934 + 0.036 * 1.15) /
        (78.084 + 20.946 + 0.934 + 0.036)
      );
    }
    case 'carbon-dioxide':
      return 1.15;
    default:
      return 1;
  }
}

/**
 * Returns the Rayleigh scattering cross-section of one molecule, m²:
 * σ = 24 π³ / (λ⁴ Nₛ²) ((nₛ² − 1) / (nₛ² + 2))² F, Bodhaine et al. (1999), eq. 2, where nₛ is
 * the refractive index at the number density Nₛ and F is the King factor. Refractivities: air,
 * Ciddor (1996); CO2, Bideau-Mehu et al. (1973); H2, Peck & Huang (1977); He, Mansfield & Peck
 * (1969). King factors: air, Bates (1984) as Bodhaine et al. (1999) mix it; CO2, 1.15; H2 and He, 1.
 * For air at 550 nm the result is 4.51e−31 m².
 * @param gas - The gas.
 * @param wavelength - Vacuum wavelength, m, from 0.4e−6 to 0.8e−6 (the range of the cited formulas covers it).
 * @returns The cross-section, m².
 * @throws {RangeError} When `gas` is not supported or `wavelength` is outside the range.
 */
export function getRayleighCrossSection(gas: AtmosphereGas, wavelength: number): number {
  if (!(wavelength >= 0.4e-6 && wavelength <= 0.8e-6)) {
    throw new RangeError('The wavelength must be from 0.4e-6 m to 0.8e-6 m');
  }
  const micrometres = wavelength * 1e6;
  const [refractivity, density] = getRefractivity(gas, micrometres);
  const n2 = (1 + refractivity) * (1 + refractivity);
  const lorentz = (n2 - 1) / (n2 + 2);
  return (
    ((24 * Math.PI ** 3) / (wavelength ** 4 * density * density)) *
    lorentz *
    lorentz *
    getKingFactor(gas, micrometres)
  );
}

/** Rayleigh scattering of an ideal-gas mixture, m⁻¹, RGB. */
function getRayleighScattering(
  pressure: number,
  temperature: number,
  composition: Readonly<Partial<Record<AtmosphereGas, number>>>
): AtmosphereRGB {
  const density = pressure / (BOLTZMANN * temperature);
  const entries = Object.entries(composition) as [AtmosphereGas, number][];
  return ATMOSPHERE_WAVELENGTHS.map(
    wavelength =>
      density *
      entries.reduce(
        (sum, [gas, fraction]) => sum + fraction * getRayleighCrossSection(gas, wavelength),
        0
      )
  ) as unknown as AtmosphereRGB;
}

const scale = (values: readonly number[], factor: number): AtmosphereRGB =>
  values.map(value => value * factor) as unknown as AtmosphereRGB;

const NO_AEROSOLS = {
  mieScattering: [0, 0, 0] as AtmosphereRGB,
  mieExtinction: [0, 0, 0] as AtmosphereRGB,
  mieAsymmetry: 0
};

const FACT_SHEET = (planet: string) =>
  `NASA GSFC ${planet} Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/ (accessed 2026-11-24)`;
const RAYLEIGH_REFERENCES = [
  'Bodhaine et al. (1999), "On Rayleigh optical depth calculations", J. Atmos. Oceanic Technol. 16, 1854-1861, doi:10.1175/1520-0426(1999)016<1854:ORODC>2.0.CO;2',
  'Bates (1984), "Rayleigh scattering by air", Planet. Space Sci. 32, 785-790, doi:10.1016/0032-0633(84)90102-8',
  'Ciddor (1996), "Refractive index of air: new equations for the visible and near infrared", Appl. Opt. 35, 1566, doi:10.1364/AO.35.001566'
];
const CO2_REFERENCE =
  'Bideau-Mehu et al. (1973), "Interferometric determination of the refractive index of carbon dioxide in the ultraviolet region", Opt. Commun. 9, 432-434, doi:10.1016/0030-4018(73)90289-7';
const H2_HE_REFERENCES = [
  'Peck & Huang (1977), "Refractivity and dispersion of hydrogen in the visible and near infrared", J. Opt. Soc. Am. 67, 1550, doi:10.1364/JOSA.67.001550',
  'Mansfield & Peck (1969), "Dispersion of helium", J. Opt. Soc. Am. 59, 199, doi:10.1364/JOSA.59.000199'
];

/** The giant planets: H2 and He above the 1-bar level, which is the reference radius of the IAU. */
function giantPlanet(
  planet: string,
  temperature: number,
  scaleHeight: number,
  hydrogen: number,
  helium: number
) {
  return {
    baseAltitude: 0,
    // A model choice: 8 scale heights, where the density is exp(−8) = 3.4e−4 of the base.
    topAltitude: 8 * scaleHeight,
    rayleighScaleHeight: scaleHeight,
    rayleighScattering: getRayleighScattering(1e5, temperature, {hydrogen, helium}),
    mieScaleHeight: scaleHeight,
    ...NO_AEROSOLS,
    cloudDeck: null,
    references: [
      `${FACT_SHEET(planet)}: temperature at 1 bar, scale height, H2 and He volume fractions`,
      'Archinal et al. (2018), Celest. Mech. Dyn. Astr. 130:22: the radii of the giant planets are at the 1-bar level',
      ...RAYLEIGH_REFERENCES,
      ...H2_HE_REFERENCES
    ]
  };
}

type AtmosphereSpec = Omit<BodyAtmosphere, 'body' | 'baseRadius' | 'topRadius'>;

// Bruneton (2017) demo constants: Rayleigh 1.24062e-6 / λ⁴ (λ in µm), Mie β = 5.328e-3 / H
// (Ångström α = 0) with single-scattering albedo 0.9, so extinction 4.44e-6 and scattering
// 3.996e-6 per metre, g = 0.8, scale heights 8000 m and 1200 m, top at 60 km.
const EARTH_RAYLEIGH = ATMOSPHERE_WAVELENGTHS.map(
  wavelength => 1.24062e-6 / (wavelength * 1e6) ** 4
) as unknown as AtmosphereRGB;

// Mars: 95.1 % CO2, the rest (N2, Ar) counted as air. Mean surface pressure 636 Pa and mean
// temperature 214 K, scale height 11.0 km (fact sheet). Dust optical depth 0.5 at the surface,
// mixed with the gas scale height.
const MARS_DUST_EXTINCTION = 0.5 / 11000;

// Venus above the cloud tops, 70 km: 3700 Pa, 230 K (VIRA). Gas scale height RT / (M g) with
// M = 43.45 g/mol (fact sheet) and g = 8.87 m/s² × (6051.8 / 6121.8)² at 70 km: 5.08 km.
const VENUS_HAZE_EXTINCTION = 0.3 / 4000;

const SPECS: Readonly<Partial<Record<SolarSystemBody, AtmosphereSpec>>> = {
  venus: {
    baseAltitude: 70000,
    // A model choice: 40 km above the base, about 8 gas scale heights.
    topAltitude: 110000,
    rayleighScaleHeight: 5080,
    rayleighScattering: getRayleighScattering(3700, 230, {'carbon-dioxide': 0.965, air: 0.035}),
    // Upper haze: vertical optical depth about 0.3, scale height about 4 km, g = 0.7.
    mieScaleHeight: 4000,
    mieScattering: scale([0.995, 0.99, 0.97], VENUS_HAZE_EXTINCTION),
    mieExtinction: scale([1, 1, 1], VENUS_HAZE_EXTINCTION),
    mieAsymmetry: 0.7,
    // Mean 0.75, near the Bond albedo 0.77 (fact sheet); lower in the blue for the yellow colour.
    cloudDeck: {albedo: [0.86, 0.8, 0.6]},
    references: [
      'Seiff et al. (1985), "Models of the structure of the atmosphere of Venus from the surface to 100 kilometers altitude" (VIRA), Adv. Space Res. 5(11), 3-58, doi:10.1016/0273-1177(85)90197-8: pressure and temperature at 70 km',
      'Wilquet et al. (2009), "Preliminary characterization of the upper haze by SPICAV/SOIR solar occultation in UV to mid-IR onboard Venus Express", J. Geophys. Res. 114, E00B42, doi:10.1029/2008JE003186: upper haze',
      `${FACT_SHEET('Venus')}: composition, mean molecular weight, gravity, Bond albedo`,
      ...RAYLEIGH_REFERENCES,
      CO2_REFERENCE
    ]
  },
  earth: {
    baseAltitude: 0,
    topAltitude: 60000,
    rayleighScaleHeight: 8000,
    rayleighScattering: EARTH_RAYLEIGH,
    mieScaleHeight: 1200,
    mieScattering: [3.996e-6, 3.996e-6, 3.996e-6],
    mieExtinction: [4.44e-6, 4.44e-6, 4.44e-6],
    mieAsymmetry: 0.8,
    cloudDeck: null,
    references: [
      'Bruneton (2017), "Precomputed Atmospheric Scattering: a New Implementation", demo constants, https://github.com/ebruneton/precomputed_atmospheric_scattering (atmosphere/demo/demo.cc); ozone absorption is left out'
    ]
  },
  mars: {
    baseAltitude: 0,
    // A model choice: about 7 gas scale heights.
    topAltitude: 80000,
    rayleighScaleHeight: 11000,
    rayleighScattering: getRayleighScattering(636, 214, {'carbon-dioxide': 0.951, air: 0.049}),
    mieScaleHeight: 11000,
    // Dust single-scattering albedo by channel; the solar-band value is 0.94 (Wolff et al. 2009).
    mieScattering: scale([0.97, 0.94, 0.8], MARS_DUST_EXTINCTION),
    mieExtinction: scale([1, 1, 1], MARS_DUST_EXTINCTION),
    mieAsymmetry: 0.65,
    cloudDeck: null,
    references: [
      `${FACT_SHEET('Mars')}: surface pressure, temperature, scale height, composition`,
      'Lemmon et al. (2015), "Dust aerosol, clouds, and the atmospheric optical depth record over 5 Mars years of the Mars Exploration Rover mission", Icarus 251, 96-111, doi:10.1016/j.icarus.2014.03.029: dust optical depth',
      'Wolff et al. (2009), "Wavelength dependence of dust aerosol single scattering albedo as observed by the Compact Reconnaissance Imaging Spectrometer", J. Geophys. Res. 114, E00D04, doi:10.1029/2009JE003350: dust albedo and asymmetry',
      ...RAYLEIGH_REFERENCES,
      CO2_REFERENCE
    ]
  },
  jupiter: giantPlanet('Jupiter', 165, 27000, 0.898, 0.102),
  saturn: giantPlanet('Saturn', 134, 59500, 0.963, 0.0325),
  // CH4 (2.3 % and 1.5 %) is left out of the Rayleigh sum; its absorption is outside this model.
  uranus: giantPlanet('Uranus', 76, 27700, 0.825, 0.152),
  // The fact sheet gives 19.1 to 20.3 km; the middle value.
  neptune: giantPlanet('Neptune', 72, 19700, 0.8, 0.19)
};

/**
 * The bodies that have an atmosphere in this model, in the order of `SOLAR_SYSTEM_BODIES`. The
 * Sun, Mercury and the Moon have none: Mercury and the Moon have only a surface-bounded exosphere.
 */
export const BODIES_WITH_ATMOSPHERE: readonly SolarSystemBody[] = Object.freeze([
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
]);

const ATMOSPHERES: Readonly<Partial<Record<SolarSystemBody, BodyAtmosphere>>> = Object.freeze(
  Object.fromEntries(
    BODIES_WITH_ATMOSPHERE.map(body => {
      const spec = SPECS[body] as AtmosphereSpec;
      const {equatorialRadius} = getBodyRadii(body);
      const atmosphere: BodyAtmosphere = {
        body,
        ...spec,
        baseRadius: equatorialRadius + spec.baseAltitude,
        topRadius: equatorialRadius + spec.topAltitude,
        rayleighScattering: Object.freeze([...spec.rayleighScattering]) as AtmosphereRGB,
        mieScattering: Object.freeze([...spec.mieScattering]) as AtmosphereRGB,
        mieExtinction: Object.freeze([...spec.mieExtinction]) as AtmosphereRGB,
        cloudDeck: spec.cloudDeck
          ? Object.freeze({albedo: Object.freeze([...spec.cloudDeck.albedo]) as AtmosphereRGB})
          : null,
        references: Object.freeze([...spec.references])
      };
      return [body, Object.freeze(atmosphere)];
    })
  )
);

/**
 * Returns the single-scattering atmosphere parameters of a body, or null when the body has no
 * atmosphere in this model (the Sun, Mercury and the Moon).
 *
 * The values are typical, not a model of seasons, weather or dust storms. Every value has a
 * reference in `references`. The Earth has the demo constants of Bruneton (2017), which many
 * renderers use; its Rayleigh coefficient at 550 nm is about 18 % above the value of dry air at
 * 15 °C. For the other bodies the Rayleigh coefficients are computed from the refractivity of
 * each gas (Bodhaine et al. 1999, eq. 2) at the pressure and temperature of the base.
 * @param body - The body.
 * @returns The frozen parameters in SI units, or null.
 * @throws {RangeError} When `body` is not a supported body.
 */
export function getBodyAtmosphere(body: SolarSystemBody): BodyAtmosphere | null {
  return ATMOSPHERES[checkBody(body)] ?? null;
}
