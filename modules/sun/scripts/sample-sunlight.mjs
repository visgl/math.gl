// math.gl
// SPDX-License-Identifier: BSD-3-Clause
// SPDX-FileCopyrightText: 2012-2013 Lukas Hosek and Alexander Wilkie
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: JavaScript adaptation of the Hošek-Wilkie 1.4a spectral model.
// Source: https://cgg.mff.cuni.cz/projects/SkylightModelling/
// Full copyright, conditions and disclaimer: ../LICENSE-HOSEK-WILKIE.
// Restricted to terrestrial sunlight and zero ground albedo for table generation.
/*
SPDX-License-Identifier: BSD-3-Clause
SPDX-FileCopyrightText: 2012-2013 Lukas Hosek and Alexander Wilkie

This source is published under the following 3-clause BSD license.

Copyright (c) 2012 - 2013, Lukas Hosek and Alexander Wilkie
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * None of the names of the contributors may be used to endorse or promote
      products derived from this software without specific prior written
      permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const PI = Math.PI;
const SOLAR_RADIUS = (0.255 * PI) / 180;
const mix = (a, b, t) => (1 - t) * a + t * b;

// Parse numeric coefficient arrays only; no reference code is executed.
export function readCoefficients(text) {
  const arrays = new Map();
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  for (const match of stripped.matchAll(/double\s+(\w+)\[\]\s*=\s*\{([^}]+)\}/g)) {
    const values = match[2]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number);
    if (!values.every(Number.isFinite)) throw new Error(`Invalid coefficients: ${match[1]}`);
    arrays.set(match[1], values);
  }
  for (let wavelength = 320; wavelength <= 720; wavelength += 40) {
    for (const [prefix, length] of [
      ['dataset', 1080],
      ['datasetRad', 120],
      ['solarDataset', 1800],
      ['limbDarkeningDataset', 6]
    ]) {
      if (arrays.get(`${prefix}${wavelength}`)?.length !== length)
        throw new Error(`Missing coefficients: ${prefix}${wavelength}`);
    }
  }
  return arrays;
}

function configuration(data, elevation, turbidity, stride, channel) {
  const t = Math.pow(elevation / (PI / 2), 1 / 3);
  const weights = [1, 5, 10, 10, 5, 1].map((c, i) => c * (1 - t) ** (5 - i) * t ** i);
  const low = Math.floor(turbidity) - 1;
  const fraction = turbidity - low - 1;
  const evaluate = index =>
    weights.reduce(
      (sum, weight, i) => sum + weight * data[index * 6 * stride + i * stride + channel],
      0
    );
  const a = evaluate(low);
  return fraction ? mix(a, evaluate(low + 1), fraction) : a;
}

function skyRadiance(config, radiance, mu, gamma) {
  const cosGamma = Math.cos(gamma);
  const mie = (1 + cosGamma * cosGamma) / (1 + config[8] ** 2 - 2 * config[8] * cosGamma) ** 1.5;
  return (
    radiance *
    (1 + config[0] * Math.exp(config[1] / (mu + 0.01))) *
    (config[2] +
      config[3] * Math.exp(config[4] * gamma) +
      config[5] * cosGamma ** 2 +
      config[6] * mie +
      config[7] * Math.sqrt(mu))
  );
}

function solarPolynomial(data, turbidity, elevation) {
  const position = Math.min(44, Math.floor(Math.pow((2 * elevation) / PI, 1 / 3) * 45));
  const offset = 4 * 45 * turbidity + 4 * (position + 1) - 1;
  const x = elevation - ((position / 45) ** 3 * PI) / 2;
  let result = 0;
  let power = 1;
  for (let i = 0; i < 4; i++) {
    result += power * data[offset - i];
    power *= x;
  }
  return result;
}

function gaussian(wavelength, amplitude, center, left, right) {
  const offset = (wavelength - center) * (wavelength < center ? left : right);
  return amplitude * Math.exp((-offset * offset) / 2);
}

// Independently implemented Wyman, Sloan & Shirley (2013), Eq. 4 / Table 1.
// https://jcgt.org/published/0002/02/01/
function matching(w) {
  return [
    gaussian(w, 0.362, 442, 0.0624, 0.0374) +
      gaussian(w, 1.056, 599.8, 0.0264, 0.0323) -
      gaussian(w, 0.065, 501.1, 0.049, 0.0382),
    gaussian(w, 0.821, 568.8, 0.0213, 0.0247) + gaussian(w, 0.286, 530.9, 0.0613, 0.0322),
    gaussian(w, 1.217, 437, 0.0845, 0.0278) + gaussian(w, 0.681, 459, 0.0385, 0.0725)
  ];
}

function rgb([x, y, z]) {
  return [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z
  ].map(value => Math.max(0, value));
}

export function sampleSunlight(arrays, degrees, turbidity, resolution) {
  const elevation = (degrees * PI) / 180;
  const sky = [];
  const solar = [];
  const low = Math.min(8, Math.floor(turbidity) - 1);
  const fraction = turbidity - low - 1;
  for (let wavelength = 320; wavelength <= 720; wavelength += 40) {
    const config = Array.from({length: 9}, (_, i) =>
      configuration(arrays.get(`dataset${wavelength}`), elevation, turbidity, 9, i)
    );
    const radiance = configuration(
      arrays.get(`datasetRad${wavelength}`),
      elevation,
      turbidity,
      1,
      0
    );
    sky.push({config, radiance});
    const data = arrays.get(`solarDataset${wavelength}`);
    solar.push(
      mix(
        solarPolynomial(data, low, elevation),
        solarPolynomial(data, low + 1, elevation),
        fraction
      )
    );
  }
  const skySpectrum = Array(10).fill(0);
  for (let row = 0; row < resolution; row++) {
    const mu = (row + 0.5) / resolution;
    for (let column = 0; column < resolution * 2; column++) {
      const phi = (2 * PI * (column + 0.5)) / (resolution * 2);
      const cosGamma =
        mu * Math.sin(elevation) + Math.sqrt(1 - mu * mu) * Math.cos(elevation) * Math.cos(phi);
      const gamma = Math.acos(Math.max(-1, Math.min(1, cosGamma)));
      for (let knot = 0; knot < 10; knot++) {
        const {config, radiance} = sky[knot + 1];
        skySpectrum[knot] += skyRadiance(config, radiance, mu, gamma) * mu;
      }
    }
  }
  const directXYZ = [0, 0, 0];
  const diffuseXYZ = [0, 0, 0];
  for (let wavelength = 380; wavelength <= 720; wavelength += 5) {
    const lowWavelength = Math.min(9, Math.floor((wavelength - 320) / 40));
    const wavelengthFraction = (wavelength - 320) / 40 - lowWavelength;
    const radiance = mix(solar[lowWavelength], solar[lowWavelength + 1], wavelengthFraction);
    const coefficients = Array.from({length: 6}, (_, i) =>
      mix(
        arrays.get(`limbDarkeningDataset${320 + lowWavelength * 40}`)[i],
        arrays.get(`limbDarkeningDataset${360 + lowWavelength * 40}`)[i],
        wavelengthFraction
      )
    );
    let direct = 0;
    for (let radius = 0; radius < resolution * 2; radius++) {
      const gamma = SOLAR_RADIUS * Math.sqrt((radius + 0.5) / (resolution * 2));
      const cosine = Math.sqrt(Math.max(0, 1 - Math.sin(gamma) ** 2 / Math.sin(SOLAR_RADIUS) ** 2));
      direct +=
        radiance * coefficients.reduce((sum, coefficient, i) => sum + coefficient * cosine ** i, 0);
    }
    direct *= (PI * Math.sin(SOLAR_RADIUS) ** 2) / (resolution * 2);
    const knot = Math.floor((wavelength - 360) / 40);
    const f = (wavelength - 360) / 40 - knot;
    const diffuse =
      ((f ? mix(skySpectrum[knot], skySpectrum[knot + 1], f) : skySpectrum[knot]) * 2 * PI) /
      (resolution * resolution * 2);
    const xyz = matching(wavelength);
    const weight = wavelength === 380 || wavelength === 720 ? 2.5 : 5;
    for (let i = 0; i < 3; i++) {
      directXYZ[i] += Math.max(0, direct) * xyz[i] * weight;
      diffuseXYZ[i] += diffuse * xyz[i] * weight;
    }
  }
  return [...rgb(directXYZ), ...rgb(diffuseXYZ)].map(value => Number(value.toPrecision(9)));
}
