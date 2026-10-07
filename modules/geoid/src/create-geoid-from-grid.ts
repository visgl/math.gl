// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geoid} from './geoid';
import {isUint16Array} from '@math.gl/types';

/** A complete global grid of raw samples in GeographicLib node order. */
export type GeoidGridProps = {
  width: number;
  height: number;
  /** Borrowed samples: north to south, columns east from Greenwich. Do not mutate. */
  values: Uint16Array;
  /** Height in meters is offset + scale * sample. */
  offset: number;
  scale: number;
  cubic?: boolean;
};

/** Create a geoid from decoded grid samples without a format or Arrow dependency. */
export function createGeoidFromGrid(props: GeoidGridProps): Geoid {
  const {width, height, values, offset, scale, cubic = false} = props;
  if (!Number.isSafeInteger(width) || width < 2 || width % 2 !== 0) {
    throw new Error('Geoid grid: width must be an even integer of at least 2');
  }
  if (!Number.isSafeInteger(height) || height < 3 || height % 2 !== 1) {
    throw new Error('Geoid grid: height must be an odd integer of at least 3');
  }
  if (!isUint16Array(values) || values.length !== width * height) {
    throw new Error('Geoid grid: values must be a Uint16Array with width * height samples');
  }
  if (!Number.isFinite(offset) || !Number.isFinite(scale) || scale <= 0) {
    throw new Error('Geoid grid: offset must be finite and scale must be finite and positive');
  }
  return new Geoid({
    cubic,
    _width: width,
    _height: height,
    _rlonres: width / 360,
    _rlatres: (height - 1) / 180,
    _offset: offset,
    _scale: scale,
    _swidth: width,
    _datastart: 0,
    _maxerror: -1,
    _rmserror: -1,
    _description: 'Decoded geoid grid',
    _datetime: 'UNKNOWN',
    data: values
  });
}
