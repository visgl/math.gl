// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  DGGS_DECODERS,
  getS2IndexFromToken,
  getS2Level,
  getS2TokenFromIndex,
  getS2ChildIndex
} from '@math.gl/dggs';

import {isValidCell} from 'h3-js';

export const SAMPLES = {
  a5: '1ae2988000000000',
  geohash: '9q8yy',
  h3: '89283082803ffff',
  'plus-code': '849VQHFJ+X6',
  quadkey: '023010203333',
  s2: '80858004'
};

export function decodeCell(grid, token, unwrap = true) {
  if (!token.trim() || token.length > 128) throw new Error('Enter a cell ID of 1–128 characters.');
  const trimmed = token.trim();
  if (grid === 'h3' && !isValidCell(trimmed.replace(/^0x/i, '')))
    throw new Error('Enter a valid H3 cell index.');
  if (grid === 'geohash' && !/^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$/.test(trimmed))
    throw new Error('GeoHash IDs must contain 1–12 lowercase GeoHash base32 characters.');
  if (grid === 'quadkey' && !/^[0-3]{1,30}$/.test(trimmed))
    throw new Error('Quadkeys must contain 1–30 digits from 0 to 3.');
  const decoder = DGGS_DECODERS.find(item => item.name === grid);
  if (!decoder) throw new Error('Unknown grid');
  const center = decoder.cellToLngLat(token.trim());
  const boundary = decoder.cellToBoundary(token.trim(), {unwrap, referenceLongitude: center[0]});
  const bounds = decoder.cellToBounds(token.trim(), {unwrap, referenceLongitude: center[0]});
  if (
    !(
      boundary.length >= 4 &&
      [...center, ...boundary.flat(), ...bounds.flat()].every(Number.isFinite)
    )
  )
    throw new Error('Invalid cell coordinates');
  return {center, boundary, bounds};
}

export function s2Hierarchy(token) {
  const index = getS2IndexFromToken(token.trim());
  const level = getS2Level(index);
  const parentBit = (index & -index) << 2n;
  return {
    level,
    parent: level ? getS2TokenFromIndex((index & -parentBit) | parentBit) : null,
    children:
      level < 30
        ? [0, 1, 2, 3].map(child => getS2TokenFromIndex(getS2ChildIndex(index, child)))
        : []
  };
}
