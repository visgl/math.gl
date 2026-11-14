// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getGeographicTileBounds, type GeographicTile} from '../geographic-tiles';

export type TerrainPoleIncidence = {
  /** Index into the resident cut. */
  tile: number;
  edge: 'north' | 'south';
  /** Interval in [-180, 180], increasing eastward. */
  longitude: readonly [west: number, east: number];
};

export type TerrainPoleCoverage = {
  latitude: 90 | -90;
  incident: TerrainPoleIncidence[];
  /** Uncovered angular sectors around the pole. */
  gaps: (readonly [west: number, east: number])[];
};

/**
 * Describe how a resident equal-angle cut approaches each pole. Incident edges
 * collapse to one geographic point per pole. Gaps describe angular residency,
 * independent of sample validity or agreement at that point.
 */
export function discoverGeographicTerrainPoles(cut: readonly GeographicTile[]): {
  north: TerrainPoleCoverage;
  south: TerrainPoleCoverage;
} {
  function collect(latitude: 90 | -90, edge: 'north' | 'south'): TerrainPoleCoverage {
    const incident: TerrainPoleIncidence[] = [];
    for (let tile = 0; tile < cut.length; tile++) {
      const [west, south, east, north] = getGeographicTileBounds(cut[tile]);
      if ((edge === 'north' ? north : south) === latitude)
        incident.push({tile, edge, longitude: [west, east]});
    }
    incident.sort((a, b) => a.longitude[0] - b.longitude[0]);
    const gaps: TerrainPoleCoverage['gaps'] = [];
    let cursor = -180;
    for (const {
      longitude: [west, east]
    } of incident) {
      if (west < cursor) throw new Error('Overlapping geographic terrain pole sectors');
      if (west > cursor) gaps.push([cursor, west]);
      cursor = east;
    }
    if (cursor < 180) gaps.push([cursor, 180]);
    return {latitude, incident, gaps};
  }
  return {north: collect(90, 'north'), south: collect(-90, 'south')};
}
