// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {checkRange} from './domain';

/** Inputs of {@link getSoundAbsorptionAinslieMcColm}. */
export type SoundAbsorptionOptions = {
  /** Acoustic frequency, Hz. */
  frequency: number;
  /** Temperature, °C. */
  temperature: number;
  /** Practical Salinity (PSS-78). */
  salinity: number;
  /** Depth below the sea surface, m, positive down. */
  depth: number;
  /** pH of the seawater; default 8. */
  pH?: number;
};

/** Inputs of {@link getSoundAbsorptionFrancoisGarrison}. */
export type FrancoisGarrisonAbsorptionOptions = SoundAbsorptionOptions & {
  /**
   * Speed of sound, m/s. The default is the approximation of Francois and Garrison (1982),
   * c = 1412 + 3.21 T + 1.19 S + 0.0167 D.
   */
  soundSpeed?: number;
};

/** Returns the relaxation term `A f_r f² / (f_r² + f²)` of one chemical component, dB/km. */
function relaxation(amplitude: number, relaxationFrequency: number, frequency: number): number {
  const f2 = frequency * frequency;
  return (amplitude * relaxationFrequency * f2) / (relaxationFrequency * relaxationFrequency + f2);
}

/**
 * Returns the absorption of sound in seawater from the equation of Francois and Garrison (1982).
 *
 * The result is the sum of three terms: boric acid, magnesium sulphate and pure water.
 * The pure-water term has one form at or below 20 °C and another form above 20 °C.
 *
 * Stated validity: "all oceanic conditions and frequencies from 200 Hz to 1 MHz" (Part II
 * abstract); Part I gives 400 Hz to 1 MHz. NPL gives about 5 % accuracy and these reliability
 * limits: from 10 kHz to 500 kHz, -2 to 22 °C, salinity 30 to 35, depth 0 to 3.5 km;
 * above 500 kHz, 0 to 30 °C, salinity 0 to 40, depth 0 to 10 km.
 *
 * References: Francois and Garrison (1982), J. Acoust. Soc. Am. 72: Part I, 896-907,
 * doi:10.1121/1.388170; Part II, 1879-1890, doi:10.1121/1.388673.
 * @param options - Frequency (200 Hz to 1 MHz), temperature (-2 to 30 °C), salinity (0 to 40),
 * depth (0 to 10 000 m), pH (7.7 to 8.3) and an optional sound speed (1350 to 1800 m/s).
 * @returns Absorption, dB/km.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSoundAbsorptionFrancoisGarrison(
  options: FrancoisGarrisonAbsorptionOptions
): number {
  const frequency = checkRange('frequency', options.frequency, 200, 1e6) / 1000;
  const t = checkRange('temperature', options.temperature, -2, 30);
  const s = checkRange('salinity', options.salinity, 0, 40);
  const d = checkRange('depth', options.depth, 0, 10000);
  const pH = checkRange('pH', options.pH ?? 8, 7.7, 8.3);
  const c = checkRange(
    'soundSpeed',
    options.soundSpeed ?? 1412 + 3.21 * t + 1.19 * s + 0.0167 * d,
    1350,
    1800
  );
  const theta = 273 + t;

  const boricAmplitude = (8.86 / c) * 10 ** (0.78 * pH - 5);
  const boricFrequency = 2.8 * Math.sqrt(s / 35) * 10 ** (4 - 1245 / theta);

  const magnesiumAmplitude = ((21.44 * s) / c) * (1 + 0.025 * t);
  const magnesiumPressure = 1 - 1.37e-4 * d + 6.2e-9 * d * d;
  const magnesiumFrequency = (8.17 * 10 ** (8 - 1990 / theta)) / (1 + 0.0018 * (s - 35));

  const waterAmplitude =
    t <= 20
      ? 4.937e-4 - 2.59e-5 * t + 9.11e-7 * t * t - 1.5e-8 * t * t * t
      : 3.964e-4 - 1.146e-5 * t + 1.45e-7 * t * t - 6.5e-10 * t * t * t;
  const waterPressure = 1 - 3.83e-5 * d + 4.9e-10 * d * d;

  return (
    relaxation(boricAmplitude, boricFrequency, frequency) +
    magnesiumPressure * relaxation(magnesiumAmplitude, magnesiumFrequency, frequency) +
    waterAmplitude * waterPressure * frequency * frequency
  );
}

/**
 * Returns the absorption of sound in seawater from the simplified equation of Ainslie and
 * McColm (1998).
 *
 * α = 0.106 f1 f² / (f1² + f²) e^((pH - 8) / 0.56)
 * + 0.52 (1 + T / 43) (S / 35) f2 f² / (f2² + f²) e^(-z / 6)
 * + 0.00049 f² e^(-(T / 27 + z / 17)),
 * with f1 = 0.78 sqrt(S / 35) e^(T / 26), f2 = 42 e^(T / 17), f in kHz and z in km.
 *
 * Stated validity: within 10 % of Francois and Garrison from 100 Hz to 1 MHz (NPL), for
 * -6 to 35 °C, pH 7.7 to 8.3, salinity 5 to 50 and depth 0 to 7 km, each with the other
 * inputs near 10 °C, salinity 35, pH 8 and depth 0.
 *
 * Reference: Ainslie and McColm (1998), J. Acoust. Soc. Am. 103(3), 1671-1672, doi:10.1121/1.421258.
 * @param options - Frequency (100 Hz to 1 MHz), temperature (-6 to 35 °C), salinity (5 to 50),
 * depth (0 to 7000 m) and pH (7.7 to 8.3).
 * @returns Absorption, dB/km.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getSoundAbsorptionAinslieMcColm(options: SoundAbsorptionOptions): number {
  const frequency = checkRange('frequency', options.frequency, 100, 1e6) / 1000;
  const t = checkRange('temperature', options.temperature, -6, 35);
  const s = checkRange('salinity', options.salinity, 5, 50);
  const z = checkRange('depth', options.depth, 0, 7000) / 1000;
  const pH = checkRange('pH', options.pH ?? 8, 7.7, 8.3);

  const boricFrequency = 0.78 * Math.sqrt(s / 35) * Math.exp(t / 26);
  const magnesiumFrequency = 42 * Math.exp(t / 17);

  return (
    relaxation(0.106 * Math.exp((pH - 8) / 0.56), boricFrequency, frequency) +
    relaxation(0.52 * (1 + t / 43) * (s / 35) * Math.exp(-z / 6), magnesiumFrequency, frequency) +
    0.00049 * frequency * frequency * Math.exp(-(t / 27 + z / 17))
  );
}
