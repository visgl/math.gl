// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ProjectionTransform, createProjectionDescriptor} from '@math.gl/geospatial/projection/core';
import {mercator} from '@math.gl/geospatial/projection/projections/merc';
import {equidistantCylindrical} from '@math.gl/geospatial/projection/projections/eqc';
import type {
  Projection,
  ProjectionTransformDescription
} from '@math.gl/geospatial/projection/types';

const projections = [mercator, equidistantCylindrical];

test('resolved descriptions expose the compiled pair and execution order', () => {
  const projection: Projection = new ProjectionTransform({
    from: '+proj=merc +datum=WGS84 +units=km +axis=neu +pm=paris',
    to: '+proj=eqc +datum=WGS84 +units=us-ft +lon_0=12 +lon_wrap=180',
    enforceAxis: true,
    projections
  });
  const description = projection.description!;
  expect(description.version).toBe(1);
  expect(description.complete).toBe(true);
  expect(description.opaqueReasons).toEqual([]);
  expect(description.source.algorithm).toEqual({id: '@math.gl/geospatial/merc', version: 1});
  expect(description.target.algorithm).toEqual({id: '@math.gl/geospatial/eqc', version: 1});
  expect(description.source.toMeter).toBe(1000);
  expect(description.target.toMeter).toBeCloseTo(1200 / 3937);
  expect(description.source.primeMeridian).toBeGreaterThan(0);
  expect(description.target.parameters['lon_0']).toBe('12');
  expect(description.forward.inputAxis).toBe('neu');
  expect(description.inverse.outputAxis).toBe('neu');
  expect(description.forward.stages).toEqual([
    'input-axis',
    'input-scale',
    'source-inverse',
    'geographic-domain-check',
    'source-prime-meridian',
    'target-forward',
    'output-scale'
  ]);
  expect(description.inverse.stages).toEqual([
    'input-scale',
    'source-inverse',
    'geographic-domain-check',
    'target-prime-meridian',
    'target-forward',
    'output-scale',
    'output-axis'
  ]);
});

test('the description is a deeply frozen detached snapshot', () => {
  const semantics = {id: 'example:mercator', version: 3};
  const projection = new ProjectionTransform({
    to: 'EPSG:3857',
    projections: [{...mercator, semantics}]
  });
  const description = projection.description!;
  semantics.version = 4;
  expect(description.target.algorithm!.version).toBe(3);
  function expectFrozen(value: unknown): void {
    if (value && typeof value === 'object') {
      expect(Object.isFrozen(value)).toBe(true);
      for (const child of Object.values(value)) expectFrozen(child);
    }
  }
  expectFrozen(description);
  const serialized = JSON.stringify(description);
  expect(JSON.parse(serialized)).toMatchObject({version: 1, complete: true});
  expect(projection.description).toBe(description);
});

test('a name alone never identifies replacement algorithms', () => {
  const {semantics: ignored, ...opaqueMercator} = mercator;
  const projection = new ProjectionTransform({to: 'EPSG:3857', projections: [opaqueMercator]});
  expect(projection.description!.complete).toBe(false);
  expect(projection.description!.target.algorithm).toBeUndefined();
  expect(projection.description!.opaqueReasons).toEqual(['target-algorithm']);
  const inverse = new ProjectionTransform({from: 'EPSG:3857', projections: [opaqueMercator]});
  expect(inverse.description!.opaqueReasons).toEqual(['source-algorithm']);
});

test('deferred descriptions are unavailable until the actual algorithms are prepared', async () => {
  let loads = 0;
  const descriptor = createProjectionDescriptor({name: 'merc'}, async () => {
    loads++;
    return mercator;
  });
  const lazy = new ProjectionTransform({to: 'EPSG:3857', projections: [descriptor]});
  expect(lazy.description).toBeUndefined();
  expect(loads).toBe(0);
  await lazy.preload();
  expect(loads).toBe(1);
  const prepared = await ProjectionTransform.create({to: 'EPSG:3857', projections: [descriptor]});
  expect(lazy.description).toEqual(prepared.description);
  expect(lazy.description!.complete).toBe(true);
});

test('grid descriptions expose resource names but cannot assert resource equivalence', () => {
  const grid = {
    shift: (longitude: number, latitude: number): [number, number] => [longitude, latitude]
  };
  const projection = new ProjectionTransform({
    from: '+proj=longlat +ellps=WGS84 +nadgrids=@missing,local,null,unused',
    datumGrids: {local: grid}
  });
  const description = projection.description!;
  expect(description.complete).toBe(false);
  expect(description.opaqueReasons).toEqual(['grid-resource']);
  expect(description.source.datum.grids).toEqual([
    {name: 'missing', optional: true, loaded: false},
    {name: 'local', optional: false, loaded: true},
    {name: 'null', optional: false, loaded: false}
  ]);
  expect(description.forward.stages).toContain('datum');
  expect(JSON.stringify(description)).not.toContain('shift');
  const vertical = new ProjectionTransform({
    from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
    verticalGrids: {local: {getOffset: () => 1}}
  }).description!;
  expect(vertical.opaqueReasons).toEqual(['grid-resource']);
  expect(vertical.forward.requiresInputZ).toBe(true);
  expect(vertical.forward.stages).toContain('source-vertical-grid');
  expect(vertical.inverse.stages).toContain('target-vertical-grid');
});

test('geographic core semantics include wrapping, height units and axis policy', () => {
  const description: ProjectionTransformDescription = new ProjectionTransform({
    from: '+proj=longlat +datum=WGS84 +axis=neu +vunits=ft',
    to: '+proj=longlat +datum=WGS84 +lon_wrap=180'
  }).description!;
  expect(description.complete).toBe(true);
  expect(description.source.algorithm).toEqual({id: '@math.gl/geospatial/geographic', version: 1});
  expect(description.forward.inputAxis).toBe('enu');
  expect(description.source.axis).toBe('neu');
  expect(description.source.verticalUnit).toBe(0.3048);
  expect(description.forward.stages).toContain('input-height-scale');
  expect(description.inverse.stages).toContain('output-height-scale');
  expect(description.forward.stages).toContain('longitude-wrap');
});

test('flag presence survives JSON and metadata follows actual axis and height execution', () => {
  const description = new ProjectionTransform({
    from: '+proj=longlat +datum=WGS84 +axis=une',
    to: '+proj=merc +datum=WGS84 +over +vunits=ft',
    enforceAxis: true,
    projections
  }).description!;
  const parsed = JSON.parse(JSON.stringify(description));
  expect(parsed.target.parameters).toHaveProperty('over', null);
  expect(description.forward.requiresInputZ).toBe(true);
  expect(description.forward.stages).toContain('output-height-scale');
  expect(description.inverse.stages).toContain('input-height-scale');
});

test('horizontal extraction and geocentric dimensional semantics remain explicit', async () => {
  const {projJSONCRSParser, geocentric} = await import(
    '@math.gl/geospatial/projection/experimental'
  );
  const {geographicJSON} = await import('../fixtures/crs-datums');
  const horizontal = new ProjectionTransform({
    from: {
      type: 'CompoundCRS',
      name: 'Horizontal plus height',
      components: [
        geographicJSON,
        {type: 'VerticalCRS', name: 'Height', datum: {name: 'Local vertical'}}
      ]
    },
    parsers: [projJSONCRSParser],
    mode: 'horizontal'
  });
  expect(horizontal.description!.lossy).toBe(true);
  expect(horizontal.description!.source.lossy).toBe(true);
  expect(horizontal.description!.forward.stages).toContain('discard-height');
  expect(horizontal.description!.forward.stages).toContain('restore-height');
  expect(horizontal.description!.inverse.stages).toContain('restore-height');
  expect(horizontal.project([12, 34, 56])).toEqual([12, 34, 56]);
  const cartesian = new ProjectionTransform({to: 'EPSG:4978', projections: [geocentric]});
  expect(cartesian.description!.forward.geocentricOutput).toBe(true);
  expect(cartesian.description!.inverse.requiresInputZ).toBe(true);
  expect(cartesian.description!.complete).toBe(false);
  expect(cartesian.description!.opaqueReasons).toEqual(['target-algorithm']);
});
