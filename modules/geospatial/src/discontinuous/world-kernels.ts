// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gilbertRaw, rectangularGringortenRaw} from './world-composite-kernels';
import {aitoffRaw} from './world-kernels/aitoff.js';
import {augustRaw} from './world-kernels/august.js';
import {bakerRaw} from './world-kernels/baker.js';
import {bertin1953Raw} from './world-kernels/bertin.js';
import {boggsRaw} from './world-kernels/boggs.js';
import {bromleyRaw} from './world-kernels/bromley.js';
import {collignonRaw} from './world-kernels/collignon.js';
import {crasterRaw} from './world-kernels/craster.js';
import {eckert1Raw} from './world-kernels/eckert1.js';
import {eckert2Raw} from './world-kernels/eckert2.js';
import {eckert3Raw} from './world-kernels/eckert3.js';
import {eckert4Raw} from './world-kernels/eckert4.js';
import {eckert5Raw} from './world-kernels/eckert5.js';
import {eckert6Raw} from './world-kernels/eckert6.js';
import {eisenlohrRaw} from './world-kernels/eisenlohr.js';
import {faheyRaw} from './world-kernels/fahey.js';
import {foucautRaw} from './world-kernels/foucaut.js';
import {ginzburg4Raw} from './world-kernels/ginzburg4.js';
import {ginzburg5Raw} from './world-kernels/ginzburg5.js';
import {ginzburg6Raw} from './world-kernels/ginzburg6.js';
import {ginzburg8Raw} from './world-kernels/ginzburg8.js';
import {ginzburg9Raw} from './world-kernels/ginzburg9.js';
import {homolosineRaw} from './world-kernels/homolosine.js';
import {kavrayskiy7Raw} from './world-kernels/kavrayskiy7.js';
import {larriveeRaw} from './world-kernels/larrivee.js';
import {laskowskiRaw} from './world-kernels/laskowski.js';
import {millerRaw} from './world-kernels/miller.js';
import {mollweideRaw} from './world-kernels/mollweide.js';
import {mtFlatPolarParabolicRaw} from './world-kernels/mtFlatPolarParabolic.js';
import {mtFlatPolarQuarticRaw} from './world-kernels/mtFlatPolarQuartic.js';
import {mtFlatPolarSinusoidalRaw} from './world-kernels/mtFlatPolarSinusoidal.js';
import {naturalEarth2Raw} from './world-kernels/naturalEarth2.js';
import {nellHammerRaw} from './world-kernels/nellHammer.js';
import {nicolosiRaw} from './world-kernels/nicolosi.js';
import {pattersonRaw} from './world-kernels/patterson.js';
import {polyconicRaw} from './world-kernels/polyconic.js';
import {robinsonRaw} from './world-kernels/robinson.js';
import {sinuMollweideRaw} from './world-kernels/sinuMollweide.js';
import {sinusoidalRaw} from './world-kernels/sinusoidal.js';
import {timesRaw} from './world-kernels/times.js';
import {vanDerGrintenRaw} from './world-kernels/vanDerGrinten.js';
import {vanDerGrinten2Raw} from './world-kernels/vanDerGrinten2.js';
import {vanDerGrinten3Raw} from './world-kernels/vanDerGrinten3.js';
import {vanDerGrinten4Raw} from './world-kernels/vanDerGrinten4.js';
import {wagner4Raw} from './world-kernels/wagner4.js';
import {wagner6Raw} from './world-kernels/wagner6.js';
import {winkel3Raw} from './world-kernels/winkel3.js';
import {bonneRaw} from './world-kernels/bonne.js';
import {bottomleyRaw} from './world-kernels/bottomley.js';
import {cylindricalEqualAreaRaw} from './world-kernels/cylindricalEqualArea.js';
import {cylindricalStereographicRaw} from './world-kernels/cylindricalStereographic.js';
import {foucautSinusoidalRaw} from './world-kernels/foucautSinusoidal.js';
import {hammerRaw} from './world-kernels/hammer.js';
import {hillRaw} from './world-kernels/hill.js';
import {hufnagelRaw} from './world-kernels/hufnagel.js';
import {hyperellipticalRaw} from './world-kernels/hyperelliptical.js';
import {lagrangeRaw} from './world-kernels/lagrange.js';
import {loximuthalRaw} from './world-kernels/loximuthal.js';
import {rectangularPolyconicRaw} from './world-kernels/rectangularPolyconic.js';
import {wagnerRaw} from './world-kernels/wagner.js';
export type WorldKernel = ((lambda: number, phi: number) => number[]) & {
  invert?: (x: number, y: number) => number[] | null | undefined;
};
function lazy(factory: () => WorldKernel): WorldKernel {
  let kernel: WorldKernel;
  const forward: WorldKernel = (x, y) => {
    kernel ??= factory();
    return kernel(x, y);
  };
  forward.invert = (x, y) => {
    kernel ??= factory();
    return kernel.invert?.(x, y);
  };
  return forward;
}
export const worldKernels = {
  gilbert: gilbertRaw,
  gringorten: rectangularGringortenRaw,
  aitoff: aitoffRaw,
  august: augustRaw,
  baker: bakerRaw,
  bertin1953: lazy(() => bertin1953Raw()),
  boggs: boggsRaw,
  bromley: bromleyRaw,
  collignon: collignonRaw,
  craster: crasterRaw,
  eckert1: eckert1Raw,
  eckert2: eckert2Raw,
  eckert3: eckert3Raw,
  eckert4: eckert4Raw,
  eckert5: eckert5Raw,
  eckert6: eckert6Raw,
  eisenlohr: eisenlohrRaw,
  fahey: faheyRaw,
  foucaut: foucautRaw,
  ginzburg4: ginzburg4Raw,
  ginzburg5: ginzburg5Raw,
  ginzburg6: ginzburg6Raw,
  ginzburg8: ginzburg8Raw,
  ginzburg9: ginzburg9Raw,
  homolosine: homolosineRaw,
  kavrayskiy7: kavrayskiy7Raw,
  larrivee: larriveeRaw,
  laskowski: laskowskiRaw,
  miller: millerRaw,
  mollweide: mollweideRaw,
  'mt-flat-polar-parabolic': mtFlatPolarParabolicRaw,
  'mt-flat-polar-quartic': mtFlatPolarQuarticRaw,
  'mt-flat-polar-sinusoidal': mtFlatPolarSinusoidalRaw,
  'natural-earth2': naturalEarth2Raw,
  'nell-hammer': nellHammerRaw,
  nicolosi: nicolosiRaw,
  patterson: pattersonRaw,
  polyconic: polyconicRaw,
  robinson: robinsonRaw,
  'sinu-mollweide': sinuMollweideRaw,
  sinusoidal: sinusoidalRaw,
  times: timesRaw,
  'van-der-grinten': vanDerGrintenRaw,
  'van-der-grinten2': vanDerGrinten2Raw,
  'van-der-grinten3': vanDerGrinten3Raw,
  'van-der-grinten4': vanDerGrinten4Raw,
  wagner4: wagner4Raw,
  wagner6: wagner6Raw,
  winkel3: winkel3Raw,
  bonne: lazy(() => bonneRaw((45 * Math.PI) / 180)),
  bottomley: lazy(() => bottomleyRaw(0.5)),
  'cylindrical-equal-area': lazy(() => cylindricalEqualAreaRaw((38.58 * Math.PI) / 180)),
  'cylindrical-stereographic': lazy(() => cylindricalStereographicRaw((0 * Math.PI) / 180)),
  'foucaut-sinusoidal': lazy(() => foucautSinusoidalRaw(0.5)),
  hammer: lazy(() => hammerRaw(2)),
  hill: lazy(() => hillRaw(1)),
  hufnagel: lazy(() => hufnagelRaw(1, 0, (45 * Math.PI) / 180, 2)),
  hyperelliptical: lazy(() => hyperellipticalRaw(0, 2.5, 1.183136)),
  lagrange: lazy(() => lagrangeRaw(0.5)),
  loximuthal: lazy(() => loximuthalRaw((40 * Math.PI) / 180)),
  'rectangular-polyconic': lazy(() => rectangularPolyconicRaw((0 * Math.PI) / 180)),
  wagner7: lazy(() => wagnerRaw((65 * Math.PI) / 180, Math.PI / 3, 0, 200)),
  'quartic-authalic': lazy(() => hammerRaw(Infinity)),
  wagner: lazy(() => wagnerRaw((65 * Math.PI) / 180, (60 * Math.PI) / 180, 20, 200))
};
export type WorldProjection = keyof typeof worldKernels;

export type WorldProjectionParameters = {
  a?: number;
  alpha?: number;
  b?: number;
  coefficient?: number;
  fraction?: number;
  gamma?: number;
  inflation?: number;
  k?: number;
  parallel?: number;
  parallels?: number;
  poleline?: number;
  psiMax?: number;
  ratio?: number;
  spacing?: number;
};

export function createWorldKernel(
  name: WorldProjection,
  parameters: WorldProjectionParameters = {}
): WorldKernel {
  const table: Partial<
    Record<
      WorldProjection,
      {
        make: (...args: number[]) => WorldKernel;
        fields: [keyof WorldProjectionParameters, number, number, number, boolean][];
      }
    >
  > = {
    bonne: {make: bonneRaw, fields: [['parallel', 45, -90, 90, true]]},
    bottomley: {make: bottomleyRaw, fields: [['fraction', 0.5, 1e-6, 1, false]]},
    'cylindrical-equal-area': {
      make: cylindricalEqualAreaRaw,
      fields: [['parallel', 38.58, -89.999, 89.999, true]]
    },
    'cylindrical-stereographic': {
      make: cylindricalStereographicRaw,
      fields: [['parallel', 0, -90, 90, true]]
    },
    'foucaut-sinusoidal': {make: foucautSinusoidalRaw, fields: [['alpha', 0.5, 0, 1, false]]},
    hammer: {make: hammerRaw, fields: [['coefficient', 2, 1, 100, false]]},
    hill: {make: hillRaw, fields: [['ratio', 1, 0, 100, false]]},
    hufnagel: {
      make: hufnagelRaw,
      fields: [
        ['a', 1, -10, 10, false],
        ['b', 0, -10, 10, false],
        ['psiMax', 45, 0.001, 90, true],
        ['ratio', 2, 0.001, 1000, false]
      ]
    },
    hyperelliptical: {
      make: hyperellipticalRaw,
      fields: [
        ['alpha', 0, 0, 1, false],
        ['k', 2.5, 0.1, 100, false],
        ['gamma', 1.183136, 0.001, 1000, false]
      ]
    },
    lagrange: {make: lagrangeRaw, fields: [['spacing', 0.5, 0.001, 1, false]]},
    loximuthal: {make: loximuthalRaw, fields: [['parallel', 40, -89.999, 89.999, true]]},
    'rectangular-polyconic': {
      make: rectangularPolyconicRaw,
      fields: [['parallel', 0, -90, 90, true]]
    },
    wagner: {
      make: wagnerRaw,
      fields: [
        ['poleline', 65, 0.001, 90, true],
        ['parallels', 60, 0.001, 179.999, true],
        ['inflation', 20, 0, 99.999, false],
        ['ratio', 200, 0.001, 10000, false]
      ]
    }
  };
  const entry = table[name];
  for (const key of Object.keys(parameters))
    if (!entry?.fields.some(f => f[0] === key))
      throw new Error(`Unsupported ${name} parameter: ${key}`);
  if (!entry || !Object.keys(parameters).length) return worldKernels[name] as WorldKernel;
  const values = entry.fields.map(([key, fallback, low, high, degrees]) => {
    const value = parameters[key] ?? fallback;
    if (!Number.isFinite(value) || value < low || value > high)
      throw new Error(`Invalid ${name} ${key}; expected [${low}, ${high}]`);
    return degrees ? (value * Math.PI) / 180 : value;
  });
  if ((name === 'hammer' && values[0] === 1) || (name === 'lagrange' && values[0] === 1))
    throw new Error(`Invalid ${name} parameter: the endpoint requires an antipodal clip`);
  const kernel = entry.make(...values);
  for (const lat of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5])
    if (!kernel(1, lat).every(Number.isFinite))
      throw new Error('Parameters do not define a finite world projection');
  return kernel;
}
export const WORLD_PROJECTIONS = Object.freeze(Object.keys(worldKernels) as WorldProjection[]);
