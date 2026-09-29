// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original tests, inspired by the proj4js real-grid audit; expectations come from native PROJ.
// Dataset attribution and redistribution terms: ../fixtures/real-grids/README.md.
import {beforeAll, expect, test} from 'vitest';
import {fromArrayBuffer} from 'geotiff';
import {loadGeoTIFFGrid, TypeScriptProjection} from '@math.gl/proj4/experimental';
import type {DatumGrid} from '@math.gl/proj4/experimental';
import inputs from '../fixtures/real-grid-cases.json';
import reference from '../fixtures/real-grid-reference.json';

const urls = [
  new URL('../fixtures/real-grids/ca_nrc_NA83SCRS.tif', import.meta.url),
  new URL('../fixtures/real-grids/de_adv_BETA2007.tif', import.meta.url)
];
const grids: DatumGrid[] = [];
const degrees = 180 / Math.PI;

beforeAll(async () => {
  for (const [index, url] of urls.entries()) {
    let buffer: ArrayBuffer;
    if (url.protocol === 'file:') {
      const {readFile} = await import('node:fs/promises');
      const bytes = await readFile(url);
      buffer = new Uint8Array(bytes).buffer;
    } else {
      const response = await fetch(url);
      expect(response.ok).toBe(true);
      buffer = await response.arrayBuffer();
    }
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hash = Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    expect(hash).toBe(inputs.grids[index].sha256);
    grids.push(await loadGeoTIFFGrid(await fromArrayBuffer(buffer)));
  }
});

function close(actual: ArrayLike<number>, expected: number[], tolerance = 1e-9): void {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, index) =>
    expect(Math.abs(actual[index] - value), 'ordinate ' + index).toBeLessThanOrEqual(tolerance)
  );
}
function projection(grid: DatumGrid, names = 'real'): TypeScriptProjection {
  return new TypeScriptProjection({
    from: '+proj=longlat +ellps=WGS84 +nadgrids=' + names,
    datumGrids: {real: grid}
  });
}

for (const [index, input] of inputs.grids.entries()) {
  test('real grid vs independent PROJ: ' + input.id, () => {
    const grid = grids[index];
    const expected = reference.cases[index];
    expect(expected.id).toBe(input.id);
    expect(expected.gridSHA256).toBe(input.sha256);
    expect(grid.subgridCount).toBe(input.imageCount);
    expect(expected.results.map(row => row.input)).toEqual(input.points);
    const native = projection(grid);
    const forward = new Float64Array(expected.results.length * 4);
    const inverse = new Float64Array(expected.results.length * 4);
    for (const [i, row] of expected.results.entries()) {
      close(native.project(row.input), row.forward);
      close(native.unproject(row.forward), row.inverse);
      forward.set([...row.input, 123, 8], i * 4);
      inverse.set([...row.forward, 123, 8], i * 4);
    }
    native.projectFlat(forward, 4);
    native.unprojectFlat(inverse, 4);
    for (const [i, row] of expected.results.entries()) {
      close(forward.subarray(i * 4, i * 4 + 4), [...row.forward, 123, 8]);
      close(inverse.subarray(i * 4, i * 4 + 4), [...row.inverse, 123, 8]);
    }
  });

  test('real grid outer nodes and shifted inverse boundary: ' + input.id, () => {
    const native = projection(grids[index]);
    const [west, south, east, north] = input.regions[0].nodeExtent;
    for (const lon of [west, (west + east) / 2, east]) {
      for (const lat of [south, (south + north) / 2, north]) {
        const point = [lon, lat];
        close(native.unproject(native.project(point)), point);
      }
    }
    expect(() => native.project([west - 0.001, (south + north) / 2])).toThrow('covers');
    close(projection(grids[index], 'real,null').project([0, 0]), [0, 0]);
  });
}

test('Canadian western-edge audit: reject an inverse whose source lies outside the grid', () => {
  const grid = grids[0];
  const boundary = reference.cases[0].boundaryInverse[0];
  expect(boundary.input).toEqual([-80, 44.92]);
  expect(boundary.inverse[0]).toBeLessThan(-80);
  // Upstream accepts this approximate inverse, but its source is west of -80 degrees.
  // It is not a valid source within the grid. A null fallback must be explicit.
  expect(grid.shift(-80 / degrees, 44.92 / degrees, true)).toBeUndefined();
  const native = projection(grid);
  expect(() => native.unproject([-80, 44.92])).toThrow('covers');
  close(projection(grid, 'real,null').unproject([-80, 44.92]), [-80, 44.92]);
  close(native.unproject(native.project([-80, 44.92])), [-80, 44.92]);
  expect(() => native.unproject([-79.999, 44.92])).not.toThrow();
});
