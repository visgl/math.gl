import {test, expect} from 'vitest';
import {
  EPSG4326ToEPSG3857,
  EPSG3857ToEPSG4326,
  lngLatToEPSG3857,
  EPSG3857ToLngLat
} from '@math.gl/proj';

test('@math.gl/proj re-exports the EPSG converters', () => {
  const coordinate = [-122.4, 37.8, 100];
  const projected = EPSG4326ToEPSG3857(coordinate);
  const unprojected = EPSG3857ToEPSG4326(projected);

  expect(projected).toEqual(lngLatToEPSG3857(coordinate));
  expect(unprojected).toEqual(EPSG3857ToLngLat(projected));
  expect(unprojected[0]).toBeCloseTo(coordinate[0], 10);
  expect(unprojected[1]).toBeCloseTo(coordinate[1], 10);
  expect(unprojected[2]).toBe(coordinate[2]);
});
