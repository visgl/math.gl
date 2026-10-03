// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original synthetic grid and format contract tests; no third-party model data.
import {expect, test} from 'vitest';
import {createVelocityGrid} from '@math.gl/proj4/grids/velocity';
import type {VelocityGridOptions} from '@math.gl/proj4/grids/velocity';
import {loadVelocityGeoTIFFGrid} from '@math.gl/proj4/grids/velocity-geotiff';
import type {
  VelocityGridGeoTIFFImage,
  VelocityGridGeoTIFFData
} from '@math.gl/proj4/grids/velocity-geotiff';
const rad = Math.PI / 180;
const options: VelocityGridOptions = {
  origin: [179, 40],
  step: [1, 1],
  size: [3, 2],
  units: 'mm/year',
  east: [1, 2, 3, 4, 5, 6],
  north: [10, 20, 30, 40, 50, 60],
  up: [100, 200, 300, 400, 500, 600]
};
test('owned ENU snapshots, inclusive nodes, antimeridian wrapping, explicit units and no extrapolation', () => {
  const input = {...options, east: new Float64Array(options.east)};
  const grid = createVelocityGrid(input);
  input.east.fill(999);
  const output = {x: 7, y: 8, z: 9};
  expect(grid.sample(-179 * rad, 41 * rad, output)).toBe(true);
  expect(output).toEqual({x: 0.006, y: 0.06, z: 0.6});
  expect(grid.sample(179.5 * rad, 40.5 * rad, output)).toBe(true);
  expect(output.x).toBeCloseTo(0.003, 12);
  expect(output.y).toBeCloseTo(0.03, 12);
  expect(output.z).toBeCloseTo(0.3, 12);
  const saved = {...output};
  expect(grid.sample(178 * rad, 40 * rad, output)).toBe(false);
  expect(output).toEqual(saved);
  const metre = createVelocityGrid({...options, units: 'm/year'});
  expect(metre.sample(179 * rad, 40 * rad, output)).toBe(true);
  expect(output).toEqual({x: 1, y: 10, z: 100});
  expect(() => grid.sample(NaN, 0, output)).toThrow('finite');
  expect(() => createVelocityGrid({...options, units: undefined} as VelocityGridOptions)).toThrow(
    'units'
  );
  expect(() => createVelocityGrid({...options, north: [1, 2]})).toThrow('node count');
});
test('nodata in any contributing component fails atomically, zero-weight corners do not poison exact nodes', () => {
  const grid = createVelocityGrid({...options, north: [-9999, 20, 30, 40, 50, 60], noData: -9999});
  const output = {x: 7, y: 8, z: 9};
  expect(grid.sample(179.5 * rad, 40.5 * rad, output)).toBe(false);
  expect(output).toEqual({x: 7, y: 8, z: 9});
  expect(grid.sample(180 * rad, 40 * rad, output)).toBe(true);
  expect(output).toEqual({x: 0.002, y: 0.02, z: 0.2});
});
function image(value = 10): VelocityGridGeoTIFFImage {
  return {
    getWidth: () => 2,
    getHeight: () => 2,
    getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2}),
    getGDALMetadata: sample =>
      sample === undefined
        ? {TYPE: 'VELOCITY'}
        : {
            DESCRIPTION: ['east_velocity', 'north_velocity', 'up_velocity'][sample],
            UNITTYPE: 'millimetres per year'
          },
    fileDirectory: {ModelPixelScale: [1, 1, 0], ModelTiepoint: [0, 0, 0, 10, 41, 0]},
    readRasters: async request => [new Float32Array(4).fill(value * (request.samples[0] + 1))]
  };
}
const load = (...images: VelocityGridGeoTIFFImage[]) =>
  loadVelocityGeoTIFFGrid({
    getImageCount: async () => images.length,
    getImage: async i => images[i]
  });
test('GeoTIFF images use complete ENU vectors, nested nodata falls back atomically to the parent', async () => {
  const child = image(20);
  child.getGDALNoData = () => -9999.1;
  child.readRasters = async request => [
    new Float32Array(4).fill(request.samples[0] === 1 ? -9999.1 : 20)
  ];
  const grid = await load(image(), child);
  const out = {x: 0, y: 0, z: 0};
  expect(grid.sample(10.5 * rad, 40.5 * rad, out)).toBe(true);
  expect(out).toEqual({x: 0.01, y: 0.02, z: 0.03});
  expect((await load(child)).sample(10.5 * rad, 40.5 * rad, out)).toBe(false);
  expect(out).toEqual({x: 0.01, y: 0.02, z: 0.03});
});
test('plain decoded rasters preserve original sample indices, native scale/offset and owned data', async () => {
  const bands = [0, 1, 2].map(index => ({
    index,
    data: new Float32Array(4).fill(index + 1),
    metadata: {
      DESCRIPTION: ['east_velocity', 'north_velocity', 'up_velocity'][index],
      UNITTYPE: 'mm/year',
      SCALE: '2',
      OFFSET: '1'
    }
  }));
  const data: VelocityGridGeoTIFFData = {
    images: [
      {
        width: 2,
        height: 2,
        bands: [...bands].reverse(),
        geoKeys: {GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 1},
        metadata: {TYPE: 'VELOCITY'},
        noData: null,
        fileDirectory: {ModelPixelScale: [1, 1, 0], ModelTiepoint: [0, 0, 0, 10, 42, 0]}
      }
    ]
  };
  const grid = await loadVelocityGeoTIFFGrid(data);
  bands[0].data.fill(1000);
  bands[0].metadata.SCALE = '9';
  const out = {x: 0, y: 0, z: 0};
  expect(grid.sample(10.5 * rad, 41.5 * rad, out)).toBe(true);
  expect(out).toEqual({x: 0.003, y: 0.005, z: 0.007});
  await expect(
    loadVelocityGeoTIFFGrid({...data, images: [{...data.images[0], bands: bands.slice(1)}]})
  ).rejects.toThrow('original ENU');
});
test('reject ambiguous band semantics, units, geometry, interpolation and image ordering', async () => {
  for (const change of [
    (i: VelocityGridGeoTIFFImage) => {
      i.getGDALMetadata = () => ({TYPE: 'HORIZONTAL_OFFSET'});
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.getGDALMetadata = sample =>
        sample === undefined
          ? {TYPE: 'VELOCITY'}
          : {DESCRIPTION: 'east_velocity', UNITTYPE: 'mm/year'};
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.getGDALMetadata = sample =>
        sample === undefined
          ? {TYPE: 'VELOCITY'}
          : {
              DESCRIPTION: ['east_velocity', 'north_velocity', 'up_velocity'][sample],
              UNITTYPE: 'metre'
            };
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.fileDirectory = {ModelTransformation: new Float64Array(16)};
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.getGeoKeys = () => ({GTModelTypeGeoKey: 1});
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.getGeoKeys = () => ({
        GTModelTypeGeoKey: 2,
        GTRasterTypeGeoKey: 2,
        GeogPrimeMeridianGeoKey: 8903
      });
    },
    (i: VelocityGridGeoTIFFImage) => {
      i.readRasters = async () => [new Float32Array(3)];
    },
    (i: VelocityGridGeoTIFFImage) => {
      const metadata = i.getGDALMetadata;
      i.getGDALMetadata = async sample => ({
        ...(await metadata(sample)),
        interpolation_method: 'bicubic'
      });
    }
  ]) {
    const candidate = image();
    change(candidate);
    await expect(load(candidate)).rejects.toThrow();
  }
  const overlapping = image();
  overlapping.fileDirectory = {ModelPixelScale: [1, 1, 0], ModelTiepoint: [0, 0, 0, 10.5, 41, 0]};
  await expect(load(image(), overlapping)).rejects.toThrow('parent');
  await expect(load()).rejects.toThrow('images');
});
