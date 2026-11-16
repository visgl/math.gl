// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ScaleColor, ScaleRange} from './scale-types';

const rgba = (hex: string): ScaleColor => {
  const hexValue = hex.slice(1);
  return [
    parseInt(hexValue.slice(0, 2), 16) / 255,
    parseInt(hexValue.slice(2, 4), 16) / 255,
    parseInt(hexValue.slice(4, 6), 16) / 255,
    1
  ];
};

/**
 * Compact built-in palettes. Stops are representative of established map palettes;
 * consumers may instead provide exact explicit color stops.
 * No D3 runtime dependency is required.
 */
const PALETTES: Record<string, readonly string[]> = {
  viridis: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
  plasma: ['#0d0887', '#7e03a8', '#cc4778', '#f89540', '#f0f921'],
  inferno: ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'],
  cividis: ['#00204c', '#414d6b', '#7a7b78', '#bcae6c', '#fee838'],
  blues: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
  rdbu: [
    '#b2182b',
    '#d6604d',
    '#f4a582',
    '#fddbc7',
    '#f7f7f7',
    '#d1e5f0',
    '#92c5de',
    '#4393c3',
    '#2166ac'
  ],
  ylorrd: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
  tableau10: [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ab'
  ]
};

function interpolate(a: ScaleColor, b: ScaleColor, t: number): ScaleColor {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t
  ];
}

/** Obtain normalized color stops without clamping HDR explicit ranges. */
export function resolvePalette(range: ScaleRange, count?: number): readonly ScaleColor[] {
  if (range.type === 'numeric') throw new Error('A numeric range is not a color palette');
  if (range.type === 'colors') return range.values;
  const key = range.name.toLowerCase();
  const colors = Object.prototype.hasOwnProperty.call(PALETTES, key) ? PALETTES[key] : undefined;
  if (!colors) throw new Error(`Unknown color palette: ${range.name}`);
  const target = count ?? range.count;
  if (target === undefined) return colors.map(rgba);
  if (!Number.isSafeInteger(target) || target < 2 || target > 256) {
    throw new Error('Palette count must be between 2 and 256');
  }
  if (target === colors.length) return colors.map(rgba);
  const decoded = colors.map(rgba);
  return Array.from({length: target}, (_, i) => {
    const position = (i * (decoded.length - 1)) / (target - 1);
    const index = Math.min(Math.floor(position), decoded.length - 2);
    return interpolate(decoded[index]!, decoded[index + 1]!, position - index);
  });
}

export function listScalePalettes(): string[] {
  return Object.keys(PALETTES);
}
