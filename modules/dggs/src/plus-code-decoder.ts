// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import OpenLocationCodePackage, {type OpenLocationCodeArea} from 'open-location-code';
import {type Bounds2D} from '@math.gl/types';
import {type DGGSCell, type DGGSDecoder, getDGGSCellToken} from './dggs-decoder';

const openLocationCode = new OpenLocationCodePackage.OpenLocationCode();

/**
 * Lightweight geometry decoder for full Google Plus Codes (Open Location Codes).
 * Short codes require a reference location and are intentionally unsupported.
 */
export const PlusCodeDecoder = {
  name: 'plus-code',
  hasNumericRepresentation: false,
  cellColumnNames: ['plusCode', 'plus_code', 'openLocationCode', 'open_location_code', 'olc'],
  cellToLngLat: (cell: DGGSCell): [number, number] => getPlusCodeLngLat(cell),
  cellToBoundary: (cell: DGGSCell): [number, number][] => getPlusCodeBoundary(decodePlusCode(cell)),
  cellToBoundaryFlat: (cell: DGGSCell): number[] => {
    const area = decodePlusCode(cell);
    return getPlusCodeBoundary(area).flat();
  },
  cellToBounds: (cell: DGGSCell): Bounds2D => {
    const area = decodePlusCode(cell);
    return [
      [area.longitudeLo, area.latitudeLo],
      [area.longitudeHi, area.latitudeHi]
    ];
  }
} as const satisfies DGGSDecoder;

function getPlusCodeLngLat(cell: DGGSCell): [number, number] {
  const area = decodePlusCode(cell);
  return [area.longitudeCenter, area.latitudeCenter];
}

function decodePlusCode(cell: DGGSCell): OpenLocationCodeArea {
  const code = getDGGSCellToken(cell, 'Plus Code');
  if (!openLocationCode.isFull(code)) {
    throw new Error(`Plus Code decoder requires a full code: ${code}`);
  }
  return openLocationCode.decode(code);
}

function getPlusCodeBoundary(area: OpenLocationCodeArea): [number, number][] {
  const {longitudeLo: west, latitudeLo: south, longitudeHi: east, latitudeHi: north} = area;
  return [
    [east, north],
    [east, south],
    [west, south],
    [west, north],
    [east, north]
  ];
}
