// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original format and integration tests; numeric expectations are from PROJ 9.5.1.
import {beforeAll, expect, test} from 'vitest';
import {fromArrayBuffer} from 'geotiff';
import {ProjectionEngine} from '@math.gl/proj4/core';
import {loadVerticalGeoTIFFGrid} from '@math.gl/proj4/grids/vertical-geotiff';
import type {VerticalGridGeoTIFFImage} from '@math.gl/proj4/grids/vertical-geotiff';
import reference from '../fixtures/vertical-geotiff-reference.json';
import inputs from '../fixtures/vertical-geotiff-cases.json';

const urls = [
  new URL('../fixtures/vertical-geotiff/point-float32.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/area-deflate.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/scaled-int16-big-endian.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/nonzero-tiepoint.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/nested-grids.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/nodata.tif', import.meta.url),
  new URL('../fixtures/vertical-geotiff/antimeridian.tif', import.meta.url)
];
const buffers: ArrayBuffer[] = [];
const radians = Math.PI / 180;
beforeAll(async () => {
  for (const [i, url] of urls.entries()) {
    let buffer: ArrayBuffer;
    if (url.protocol === 'file:') {
      const {readFile} = await import('node:fs/promises');
      buffer = new Uint8Array(await readFile(url)).buffer;
    } else {
      const response = await fetch(url);
      expect(response.ok).toBe(true);
      buffer = await response.arrayBuffer();
    }
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    expect(Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')).toBe(
      reference.cases[i].sha256
    );
    buffers.push(buffer);
  }
});
function close(actual: ArrayLike<number>, expected: number[], tolerance = 1e-5) {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, i) =>
    expect(Math.abs(actual[i] - value), `ordinate ${i}`).toBeLessThanOrEqual(tolerance)
  );
}
for (const [index, fixture] of reference.cases.entries()) {
  test('vertical GeoTIFF vs independent PROJ: ' + fixture.id, async () => {
    expect(fixture.id).toBe(inputs.cases[index].id);
    expect(fixture.results.map(row => row.input)).toEqual(inputs.cases[index].points);
    const grid = await loadVerticalGeoTIFFGrid(await fromArrayBuffer(buffers[index]));
    if (fixture.id === 'nodata') expect(grid.getOffset(10 * radians, 40 * radians)).toBeUndefined();
    const projection = new ProjectionEngine({
      from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
      verticalGrids: {local: grid}
    });
    for (const row of fixture.results) {
      close(projection.project(row.input), row.forward);
      close(projection.unproject(row.forward), row.inverse);
      expect(projection.project(row.input)[3]).toBe(row.input[3]);
      const flat = new Float64Array(row.input);
      expect(projection.projectFlat(flat, 4)).toBe(flat);
      close(flat, row.forward);
      projection.unprojectFlat(flat, 4);
      close(flat, row.inverse);
      const rounded = new Float32Array(row.input);
      const expected = new Float32Array(projection.project(Array.from(rounded)));
      projection.projectFlat(rounded, 4);
      expect(rounded).toEqual(expected);
    }
  });
}

function image(): VerticalGridGeoTIFFImage {
  return {
    getWidth: () => 2,
    getHeight: () => 2,
    getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2, GeographicTypeGeoKey: 4326}),
    getGDALMetadata: sample =>
      sample === 0
        ? {DESCRIPTION: 'geoid_undulation', UNITTYPE: 'metre'}
        : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
    fileDirectory: {ModelTiepoint: [0, 0, 0, 10, 41, 0], ModelPixelScale: [1, 1, 0]},
    readRasters: async () => [new Float32Array([30, 40, 10, 20])]
  };
}
const load = (...images: VerticalGridGeoTIFFImage[]) =>
  loadVerticalGeoTIFFGrid({
    getImageCount: async () => images.length,
    getImage: async i => images[i]
  });

test('owned snapshots, metre defaults, band selection and explicit coverage', async () => {
  const source = image(),
    values = new Float32Array([30, 40, 10, 20]);
  source.readRasters = async options => {
    expect(options).toEqual({samples: [0], interleave: false});
    return [values];
  };
  source.getGDALMetadata = sample =>
    sample === 0
      ? {DESCRIPTION: 'geoid_undulation'}
      : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'};
  const grid = await load(source);
  values.fill(999);
  source.fileDirectory = {};
  expect(grid.getOffset(10 * radians, 40 * radians)).toBeCloseTo(10);
  expect(grid.getOffset(11 * radians, 41 * radians)).toBeCloseTo(40);
  expect(grid.getOffset(10.5 * radians, 40.5 * radians)).toBeCloseTo(25);
  expect(grid.getOffset(9.99 * radians, 40 * radians)).toBeUndefined();
  const projection = new ProjectionEngine({
    from: '+proj=longlat +geoidgrids=local',
    verticalGrids: {local: grid}
  });
  const flat = new Float64Array([10, 40, 100, 7, 0, 0, 100, 8]);
  expect(() => projection.projectFlat(flat, 4)).toThrow('covers');
  close(flat, [10, 40, 110, 7, 0, 0, 100, 8]);
});

test('nodata is checked before scale/offset and uncovered child falls back to parent', async () => {
  const parent = image(),
    child = image();
  child.getGDALMetadata = async sample =>
    sample === 0
      ? {DESCRIPTION: 'geoid_undulation', SCALE: '2', OFFSET: '-5'}
      : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'};
  child.readRasters = async () => [new Float32Array([-9999.1, 4, 3, 2])];
  child.getGDALNoData = () => -9999.1;
  const single = await load(child);
  expect(single.getOffset(10 * radians, 41 * radians)).toBeUndefined();
  expect(single.getOffset(11 * radians, 40 * radians)).toBeCloseTo(-1);
  const combined = await load(parent, child);
  expect(combined.getOffset(10 * radians, 41 * radians)).toBeCloseTo(30);
  expect(combined.getOffset(11 * radians, 40 * radians)).toBeCloseTo(-1);
});

const invalid: [string, (value: VerticalGridGeoTIFFImage) => void][] = [
  [
    'missing metadata',
    v => {
      v.getGDALMetadata = () => null;
    }
  ],
  [
    'horizontal offsets',
    v => {
      v.getGDALMetadata = () => ({TYPE: 'HORIZONTAL_OFFSET', DESCRIPTION: 'geoid_undulation'});
    }
  ],
  [
    'vertical-to-vertical offsets',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_VERTICAL_TO_VERTICAL',
        DESCRIPTION: 'vertical_offset'
      });
    }
  ],
  [
    'wrong band',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL',
        DESCRIPTION: 'height_accuracy'
      });
    }
  ],
  [
    'feet',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL',
        DESCRIPTION: 'geoid_undulation',
        UNITTYPE: 'US survey foot'
      });
    }
  ],
  [
    'scale',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL',
        DESCRIPTION: 'geoid_undulation',
        SCALE: 'bad'
      });
    }
  ],
  [
    'nonlinear interpolation',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL',
        DESCRIPTION: 'geoid_undulation',
        interpolation_method: 'biquadratic'
      });
    }
  ],
  [
    'projected grid',
    v => {
      v.getGeoKeys = () => ({GTModelTypeGeoKey: 1, GTRasterTypeGeoKey: 2});
    }
  ],
  [
    'angular units',
    v => {
      v.getGeoKeys = () => ({
        GTModelTypeGeoKey: 2,
        GTRasterTypeGeoKey: 2,
        GeogAngularUnitsGeoKey: 9101
      });
    }
  ],
  [
    'non-Greenwich',
    v => {
      v.getGeoKeys = () => ({
        GTModelTypeGeoKey: 2,
        GTRasterTypeGeoKey: 2,
        GeogPrimeMeridianGeoKey: 8903
      });
    }
  ],
  [
    'missing raster type',
    v => {
      v.getGeoKeys = () => ({GTModelTypeGeoKey: 2});
    }
  ],
  [
    'rotation',
    v => {
      v.fileDirectory = {...v.fileDirectory, ModelTransformation: Array(16).fill(0)};
    }
  ],
  [
    'overview',
    v => {
      v.fileDirectory = {...v.fileDirectory, NewSubfileType: 1};
    }
  ],
  [
    'missing tiepoint',
    v => {
      v.fileDirectory = {ModelPixelScale: [1, 1, 0]};
    }
  ],
  [
    'negative spacing',
    v => {
      v.fileDirectory = {...v.fileDirectory, ModelPixelScale: [-1, 1, 0]};
    }
  ],
  [
    'invalid dimensions',
    v => {
      v.getWidth = () => 1;
    }
  ],
  [
    'incomplete band',
    v => {
      v.readRasters = async () => [new Float32Array(3)];
    }
  ],
  [
    'interleaved band',
    v => {
      v.readRasters = async () => new Float32Array(4);
    }
  ],
  [
    'scaling overflow',
    v => {
      v.getGDALMetadata = () => ({
        TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL',
        DESCRIPTION: 'geoid_undulation',
        SCALE: '1e308'
      });
    }
  ]
];
for (const [name, mutate] of invalid)
  test('vertical GeoTIFF rejects ' + name, async () => {
    const source = image();
    mutate(source);
    await expect(load(source)).rejects.toThrow('GeoTIFF');
  });

test('empty TIFF and unordered overlapping grids reject', async () => {
  await expect(load()).rejects.toThrow('at least one');
  const overlapping = image();
  overlapping.fileDirectory = {ModelTiepoint: [0, 0, 0, 10.5, 41, 0], ModelPixelScale: [1, 1, 0]};
  await expect(load(image(), overlapping)).rejects.toThrow('parent before');
});

test('disjoint interiors may share a node edge; later image wins that edge', async () => {
  const east = image();
  east.fileDirectory = {ModelTiepoint: [0, 0, 0, 11, 41, 0], ModelPixelScale: [1, 1, 0]};
  east.readRasters = async () => [new Float32Array(4).fill(50)];
  const grid = await load(image(), east);
  expect(grid.getOffset(11 * radians, 40 * radians)).toBeCloseTo(50);
  expect(grid.getOffset(10 * radians, 40 * radians)).toBeCloseTo(10);
});

test('plain loaders.gl raster shape accepts original band zero, preserves scale and owns samples', async () => {
  const source = image();
  const values = new Int16Array([30, 40, 10, 20]);
  const data = {
    images: [
      {
        width: 2,
        height: 2,
        bands: [
          {index: 1, data: new Float32Array(4), metadata: null},
          {
            index: 0,
            data: values,
            metadata: {DESCRIPTION: 'geoid_undulation', SCALE: '0.5', OFFSET: '-2'}
          }
        ],
        geoKeys: source.getGeoKeys(),
        metadata: await source.getGDALMetadata(),
        noData: null,
        fileDirectory: {ModelTiepoint: [0, 0, 0, 10, 41, 0], ModelPixelScale: [1, 1, 0]}
      }
    ]
  };
  const grid = await loadVerticalGeoTIFFGrid(structuredClone(data));
  values.fill(999);
  expect(grid.getOffset(10.5 * radians, 40.5 * radians)).toBeCloseTo(10.5);
  data.images[0].bands = data.images[0].bands.slice(0, 1);
  await expect(loadVerticalGeoTIFFGrid(data)).rejects.toThrow('original band zero');
  await expect(loadVerticalGeoTIFFGrid({images: []})).rejects.toThrow('at least one image');
});
