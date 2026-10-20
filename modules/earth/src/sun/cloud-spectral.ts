// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented published equations; no reference code copied.
// Planck spectrum; Preetham et al. (1999) Rayleigh/Angstrom optical depths:
// https://doi.org/10.1145/311535.311545
// Wyman, Sloan & Shirley (2013), equation 4 / table 1 CIE matching-function fits:
// https://jcgt.org/published/0002/02/01/

const samples = Array.from({length: 41}, (_, i) => {
  const nm = 380 + 10 * i;
  const wavelength = nm * 1e-9;
  const power = 1 / (wavelength ** 5 * Math.expm1(0.01438776877 / (5778 * wavelength)));
  const weight = i === 0 || i === 40 ? 0.5 : 1;
  const lobe = (center: number, left: number, right: number): number =>
    Math.exp(-0.5 * ((nm - center) * (nm < center ? left : right)) ** 2);
  const matching = [
    0.362 * lobe(442, 0.0624, 0.0374) +
      1.056 * lobe(599.8, 0.0264, 0.0323) -
      0.065 * lobe(501.1, 0.049, 0.0382),
    0.821 * lobe(568.8, 0.0213, 0.0247) + 0.286 * lobe(530.9, 0.0613, 0.0322),
    1.217 * lobe(437, 0.0845, 0.0278) + 0.681 * lobe(459, 0.0385, 0.0725)
  ];
  return {wavelength: nm / 1000, xyz: matching.map(value => value * power * weight)};
});
const referenceXYZ = [0, 1, 2].map(axis =>
  samples.reduce((sum, sample) => sum + sample.xyz[axis], 0)
);
const reference = Math.max(...rgb(referenceXYZ));

/** Visible-band quadrature; normalized to peak unattenuated 5778 K solar linear sRGB. */
export function getCloudSunSpectrum(
  molecularColumn: number,
  aerosolColumn: number,
  pressure: number,
  aerosolOpticalDepth: number,
  angstromExponent: number
): [number, number, number] {
  const xyz = [0, 0, 0];
  for (const sample of samples) {
    const rayleigh = (0.008735 * sample.wavelength ** -4.08 * pressure) / 1013.25;
    const aerosol = aerosolOpticalDepth * (sample.wavelength / 0.55) ** -angstromExponent;
    const transmission = Math.exp(-rayleigh * molecularColumn - aerosol * aerosolColumn);
    for (let axis = 0; axis < 3; axis++) xyz[axis] += transmission * sample.xyz[axis];
  }
  return rgb(xyz).map(value => Math.max(0, value / reference)) as [number, number, number];
}
function rgb([x, y, z]: number[]): number[] {
  return [
    3.2406 * x - 1.5372 * y - 0.4986 * z,
    -0.9689 * x + 1.8758 * y + 0.0415 * z,
    0.0557 * x - 0.204 * y + 1.057 * z
  ];
}
