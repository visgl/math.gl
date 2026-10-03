// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Test-only decoder and authored fixtures; loaded after browser timing samples finish.
import {fromArrayBuffer} from 'geotiff';
import {ProjectionEngine} from '@math.gl/projection/core';
import {loadVerticalGeoTIFFGrid} from '@math.gl/projection/grids/vertical-geotiff';
import reference from '../test/fixtures/vertical-geotiff-reference.json';
function close(actual, expected) {
  for (let i = 0; i < expected.length; i++)
    if (!Number.isFinite(actual[i]) || Math.abs(actual[i] - expected[i]) > 1e-5)
      throw new Error('Vertical GeoTIFF independent reference mismatch');
}
export async function qualifyVerticalGeoTIFF() {
  let points = 0;
  for (const fixture of reference.cases) {
    const response = await fetch('/' + fixture.file);
    if (!response.ok) throw new Error('Missing GeoTIFF fixture');
    const grid = await loadVerticalGeoTIFFGrid(await fromArrayBuffer(await response.arrayBuffer()));
    const projection = new ProjectionEngine({
      from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
      verticalGrids: {local: grid}
    });
    for (const row of fixture.results) {
      close(projection.project(row.input), row.forward);
      close(projection.unproject(row.forward), row.inverse);
      const flat = new Float64Array(row.input);
      projection.projectFlat(flat, 4);
      close(flat, row.forward);
      projection.unprojectFlat(flat, 4);
      close(flat, row.inverse);
      points++;
    }
  }
  return {files: reference.cases.length, points};
}
