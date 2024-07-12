// math.gl, MIT license

import type {S2Cell} from './s2-geometry';
import {fromHilbertQuadKey, toHilbertQuadkey} from './s2-geometry';

export function getS2Cell(s2Index: bigint): S2Cell {
  const key = toHilbertQuadkey(s2Index);
  const s2cell = fromHilbertQuadKey(key);
  return s2cell;
}
