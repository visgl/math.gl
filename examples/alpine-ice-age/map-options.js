// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {REGIONAL_VIEWS} from './regional-views.js';

// Modest panel counts keep map construction and the 1° field mesh interactive.
export const MYRIAHEDRAL_VIEWS = Object.fromEntries([
  ['myriahedral:h3-0', {preset: 'polyhedral', dggs: 'h3'}],
  ['myriahedral:a5-0', {preset: 'polyhedral', dggs: 'a5'}],
  ['myriahedral:a5-1', {preset: 'polyhedral', dggs: 'a5-1'}],
  ['myriahedral:s2-0', {preset: 'polyhedral', dggs: 's2'}],
  ['myriahedral:s2-1', {preset: 'polyhedral', dggs: 's2-1'}],
  ...['polyconic', 'cylindric', 'azimuthal', 'hemispheres', 'sealine', 'coastline'].map(preset => [
    `myriahedral:${preset}`,
    {preset, columns: 24}
  ]),
  ...['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'].map(solid => [
    `myriahedral:${solid}`,
    {preset: 'polyhedral', solid, subdivisions: 1}
  ])
]);

export const DISCONTINUOUS_VIEWS = {
  albersUsa: 'Albers USA · Alaska & Hawaii insets',
  interruptedSinusoidal: 'Interrupted sinusoidal',
  interruptedMollweide: 'Interrupted Mollweide',
  interruptedHomolosine: 'Interrupted Goode homolosine',
  airOcean: 'AirOcean · gnomonic',
  peirceQuincuncial: 'Peirce quincuncial',
  berghaus: 'Berghaus star',
  gingery: 'Gingery star',
  healpix: 'HEALPix',
  'interrupted-custom': 'Sinusoidal · four custom lobes',
  guyou: 'Guyou',
  'gringorten-quincuncial': 'Gringorten quincuncial',
  butterfly: 'Butterfly',
  'collignon-butterfly': 'Collignon butterfly',
  waterman: 'Waterman W5',
  'goode-ocean': 'Goode · oceans',
  'interrupted-boggs': 'Interrupted Boggs',
  'interrupted-sinu-mollweide': 'Interrupted Sinu-Mollweide',
  'interrupted-quartic-authalic': 'Interrupted quartic authalic',
  'interrupted-mollweide-hemispheres': 'Mollweide hemispheres',

  ...Object.fromEntries(
    Object.entries(MYRIAHEDRAL_VIEWS).map(([id, options]) => [
      id,
      options.dggs === 's2-1'
        ? 'Myriahedral · S2 resolution 1'
        : options.dggs === 's2'
          ? 'Myriahedral · S2 base cells'
          : options.dggs === 'h3'
            ? 'Myriahedral · H3 base cells'
            : options.dggs
              ? options.dggs === 'a5-1'
                ? 'Myriahedral · A5 resolution 1'
                : 'Myriahedral · A5 base cells'
              : `Myriahedral · ${options.solid ?? options.preset}`
    ])
  )
};

export const GLOBAL_VIEWS = {
  globe: 'Globe',
  eqearth: 'Equal Earth',
  moll: 'Mollweide',
  robin: 'Robinson',
  sinu: 'Sinusoidal',
  mill: 'Miller cylindrical',
  eqc: 'Equirectangular',
  merc: 'Mercator',
  ...DISCONTINUOUS_VIEWS,
  ...Object.fromEntries(Object.entries(REGIONAL_VIEWS).map(([id, region]) => [id, region.title]))
};
