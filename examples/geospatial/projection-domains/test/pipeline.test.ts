// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureColumn} from '../fixtures.ts';
import {createProjection} from '../projections.ts';
import type {ProjectionName} from '../projections.ts';
import {createDomain, projectGeometry} from '../pipeline.ts';
import {clipToImage, createRasterMesh, sourceUV} from '../raster.ts';
import type {RasterKind} from '../raster.ts';
import {getTransferList} from '@math.gl/core/tasks';

test('clipping interpolates target positions at texture boundaries', () => {
  const clipped = clipToImage([[-10, 0, -1, 0], [10, 0, 1, 0], [10, 10, 1, 1]]);
  assert(clipped.some(v => v[0] === 0 && v[1] === 5 && v[2] === 0 && v[3] === 0.5));
  assert(clipped.every(v => v[2] >= 0 && v[2] <= 1 && v[3] >= 0 && v[3] <= 1));
});
test('source fixtures cover south pole and rotated antimeridian footprint', () => {
  assert.deepEqual(sourceUV('polar', 0, -90), [0.5, 0.5]);
  for (const lon of [179, -179]) assert(sourceUV('rotated', lon, 15).every(v => v > 0 && v < 1));
});
for (const name of ['equirectangular', 'orthographic', 'interrupted'] as ProjectionName[]) {
  test(`${name}: native GeoArrow streams preserve finite geometry and row identity`, () => {
    const {features} = projectGeometry({column: fixtureColumn(), name});
    assert(features.indices.length > 0);
    assert(features.positions.every(Number.isFinite));
    assert(features.indices.every(i => i * 2 < features.positions.length));
    assert(features.polygonSourceRows.every(i => i < 3));
    if (name === 'equirectangular') {
      assert(features.polygonSourceRows.filter(i => i === 0).length >= 2);
      for (let i = 0; i < features.indices.length; i += 3) {
        const ids = features.indices.slice(i, i + 3);
        if (features.sourceRowIndices[ids[0]] !== 1) continue;
        const p = Array.from(ids, j => [features.positions[j * 2], features.positions[j * 2 + 1]]);
        const signs = p.map((a, j) => a[0] * p[(j + 1) % 3][1] - a[1] * p[(j + 1) % 3][0]);
        assert(!(signs.every(x => x >= 0) || signs.every(x => x <= 0)), 'hole center must not be filled');
      }
    }
  });
  for (const kind of ['world', 'rotated', 'polar'] as RasterKind[]) test(`${name}/${kind}: finite domain-constrained raster and bounded UV seams`, () => {
    const mesh = createRasterMesh(createDomain(name).mesh, createProjection(name), kind, 12);
    if (name === 'orthographic' && kind === 'rotated') assert.equal(mesh.indices.value.length, 0);
    else assert(mesh.indices.value.length > 0);
    assert(mesh.attributes.positions.value.every(Number.isFinite));
    const uv = mesh.attributes.texCoords.value;
    assert(uv.every(v => v >= -1e-6 && v <= 1 + 1e-6));
    if (kind === 'world') for (let i = 0; i < mesh.indices.value.length; i += 3) {
      const us = Array.from(mesh.indices.value.slice(i, i + 3), j => uv[j * 2]);
      assert(Math.max(...us) - Math.min(...us) <= 0.5);
    }
  });
}
test('interrupted polygon triangles do not bridge domain gaps', () => {
  const {features, domain} = projectGeometry({column: fixtureColumn(), name: 'interrupted'});
  function contains(x: number, y: number) {
    let inside = false;
    for (const ring of domain.rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i], [bx, by] = ring[j];
      if (ay > y !== by > y && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  }
  for (let i = 0; i < features.indices.length; i += 3) {
    const ids = features.indices.slice(i, i + 3);
    const x = Array.from(ids).reduce((s, j) => s + features.positions[j * 2], 0) / 3;
    const y = Array.from(ids).reduce((s, j) => s + features.positions[j * 2 + 1], 0) / 3;
    assert(contains(x, y));
  }
});
test('native GeoArrow backing buffers can transfer without changing source identity', () => {
  const column = fixtureColumn(), buffers = getTransferList(column);
  const moved = structuredClone(column, {transfer: buffers});
  assert(buffers.every(b => b instanceof ArrayBuffer && b.byteLength === 0));
  assert(projectGeometry({column: moved, name: 'equirectangular'}).features.polygonSourceRows.includes(2));
});

test('south-pole feature stays in the southern cap, and invalid refinement is rejected', () => {
  const {features, domain} = projectGeometry({column: fixtureColumn(), name: 'equirectangular'});
  for (let i = 0; i < features.sourceRowIndices.length; i++) if (features.sourceRowIndices[i] === 2)
    assert(features.positions[i * 2 + 1] > 160, 'south cap must not become its complement');
  for (const edge of [0, -1, NaN, Infinity])
    assert.throws(() => createRasterMesh(domain.mesh, createProjection('equirectangular'), 'world', edge));
});
