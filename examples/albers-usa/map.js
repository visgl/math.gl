// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import states from './assets/us-states.json' with {type: 'json'};

/** Describe the map, then clip source geometry into chart-local pieces. */
export function createAlbersMap() {
  const map = new MapEngine({
    version: 1,
    id: 'albers-usa',
    definition: {type: 'albers-usa', includeTerritories: true}
  });
  const ringsOf = geometry =>
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const features = states.flatMap(state =>
    ringsOf(state.geometry).flatMap(rings => {
      try {
        return map
          .projectPolygon(rings, {maxAngularStep: 1, tolerance: 0.0005})
          .map(part => ({...part, state: state.name, code: state.code}));
      } catch (error) {
        throw new Error(`Cannot project ${state.name}: ${error.message}`);
      }
    })
  );
  const gridSteps = {
    lower48: 10,
    alaska: 5,
    hawaii: 5,
    puertoRico: 0.5,
    virginIslands: 0.25,
    guam: 0.25,
    northernMariana: 1,
    americanSamoa: 0.5
  };
  const graticule = map.regions.flatMap(region => {
    const step = gridSteps[region.id];
    const [centerLon, centerLat] = region.interior;
    const lonSpan =
      region.id === 'lower48' || region.id === 'alaska' ? 45 : region.id === 'hawaii' ? 20 : 8;
    const latSpan =
      region.id === 'lower48' || region.id === 'alaska' ? 30 : region.id === 'hawaii' ? 12 : 8;
    const south = Math.max(-89.5, centerLat - latSpan);
    const north = Math.min(89.5, centerLat + latSpan);
    const meridians = Array.from(
      {length: Math.floor((2 * lonSpan) / step) + 1},
      (_, i) => Math.ceil((centerLon - lonSpan) / step) * step + i * step
    )
      .filter(lon => lon <= centerLon + lonSpan)
      .flatMap(lon =>
        map
          .projectLine(
            Array.from({length: Math.ceil(north - south) + 1}, (_, i) => [
              lon,
              Math.min(north, south + i)
            ])
          )
          .filter(line => line.regionId === region.id)
      );
    const parallels = Array.from(
      {length: Math.floor((north - south) / step) + 1},
      (_, i) => Math.ceil(south / step) * step + i * step
    )
      .filter(lat => lat <= north)
      .flatMap(lat =>
        map
          .projectLine(
            Array.from({length: 2 * lonSpan + 1}, (_, i) => [centerLon - lonSpan + i, lat])
          )
          .filter(line => line.regionId === region.id)
      );
    return [...meridians, ...parallels];
  });
  return {map, features, graticule};
}
