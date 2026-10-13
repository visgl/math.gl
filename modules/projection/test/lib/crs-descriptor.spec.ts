// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {FullProjectionEngine, projectionEngine} from '@math.gl/projection';
import {createProjectionEngine, createProjectionDescriptor} from '@math.gl/projection/core';
import {LazyProjectionEngine, lazyProjectionEngine} from '@math.gl/projection/projections/lazy';
import {mercator} from '@math.gl/projection/projections/merc';
import {createSpatialReference, getCRSSignature} from '@math.gl/crs';

const definitions = [
  'WGS84',
  'EPSG:4978',
  '+proj=eqearth +ellps=WGS84',
  'EPSG:3857',
  '+proj=eqc +ellps=WGS84',
  '+proj=tmerc +lon_0=9 +ellps=WGS84',
  '+proj=etmerc +lon_0=9 +ellps=WGS84',
  'EPSG:32632',
  '+proj=aea +lat_1=20 +lat_2=50 +ellps=WGS84',
  '+proj=lcc +lat_1=20 +lat_2=50 +ellps=WGS84',
  '+proj=stere +lat_0=90 +ellps=WGS84'
];

test.each(definitions)('retrieves prepared CRS conversions for %s', async definition => {
  const descriptor = await projectionEngine.getCRS(definition);
  const point = [12, 40, 123, 8];
  const projected = descriptor.converter.WGS84.from(point);
  expect(projected).not.toBeInstanceOf(Promise);
  const restored = descriptor.converter.WGS84.to(projected);
  expect(restored[0]).toBeCloseTo(point[0], 6);
  expect(restored[1]).toBeCloseTo(point[1], 6);
  expect(restored[2]).toBeCloseTo(point[2], 5);
  expect(restored[3]).toBe(8);
  expect(point).toEqual([12, 40, 123, 8]);
  const output = new Float64Array(4);
  expect(descriptor.converter.WGS84.from(point, output)).toBe(output);
  expect(Array.from(output)).toEqual(projected);
  expect(descriptor.converter.WGS84.to(output, output)).toBe(output);
  expect(output[0]).toBeCloseTo(12, 6);
});

test('CRS metadata describes resolved units, axes and earth model', async () => {
  const geographic = await projectionEngine.getCRS('WGS84');
  expect(geographic.coordinateFrame).toBe('geographic');
  expect([geographic.xUnit, geographic.yUnit, geographic.zUnit]).toEqual([
    {name: 'degrees'},
    {name: 'degrees'},
    {name: 'meters', metersPerUnit: 1}
  ]);
  expect(geographic.xUnit).not.toHaveProperty('metersPerUnit');
  expect(geographic.xUnit).not.toHaveProperty('radiansPerUnit');
  expect(geographic.ellipsoid.semiMajorAxis).toBe(6378137);
  const definition = '+proj=merc +R=6371008.8 +units=ft +vunits=us-ft +axis=neu';
  const defaultAxis = await projectionEngine.getCRS(definition);
  const declaredAxis = await projectionEngine.getCRS(definition, {enforceAxis: true});
  expect(defaultAxis.axis).toBe('enu');
  expect(declaredAxis.axis).toBe('neu');
  expect([declaredAxis.xUnit, declaredAxis.yUnit, declaredAxis.zUnit]).toEqual([
    {name: 'feet', metersPerUnit: 0.3048},
    {name: 'feet', metersPerUnit: 0.3048},
    {name: 'us-survey-feet', metersPerUnit: 1200 / 3937}
  ]);
  expect(declaredAxis).not.toHaveProperty('horizontalUnit');
  expect(declaredAxis).not.toHaveProperty('verticalUnit');
  expect(declaredAxis.ellipsoid).toEqual({semiMajorAxis: 6371008.8, semiMinorAxis: 6371008.8});
  const normal = defaultAxis.converter.WGS84.from([12, 40, 123]);
  expect(declaredAxis.converter.WGS84.from([12, 40, 123])).toEqual([
    normal[1],
    normal[0],
    normal[2]
  ]);
});

test('retrieval loads only the required algorithm and shares concurrent imports', async () => {
  let imports = 0;
  const needed = createProjectionDescriptor({name: 'merc'}, async () => {
    imports++;
    return mercator;
  });
  const unused = createProjectionDescriptor({name: 'unused'}, async () => {
    throw new Error('Unused algorithm was imported');
  });
  const engine = createProjectionEngine({projections: [needed, unused]});
  expect(imports).toBe(0);
  await engine.getCRS('WGS84');
  expect(imports).toBe(0);
  const [a, b] = await Promise.all([engine.getCRS('EPSG:3857'), engine.getCRS('EPSG:3857')]);
  expect(imports).toBe(1);
  expect(a.converter.WGS84.from([12, 40])).toEqual(b.converter.WGS84.from([12, 40]));
  const lazy = await lazyProjectionEngine.getCRS('+proj=eqearth');
  expect(lazy.converter.WGS84.from([12, 40])).not.toBeInstanceOf(Promise);
});

test('retrieval snapshots source metadata before asynchronous loading', async () => {
  const engine = createProjectionEngine({
    projections: [createProjectionDescriptor({name: 'merc'}, async () => mercator)]
  });
  const input = {
    ...createSpatialReference({
      crs: {
        state: 'explicit',
        definition: 'EPSG:3857',
        representation: 'identifier',
        provenance: 'metadata'
      }
    })
  };
  const pending = engine.getCRS(input);
  input.crs = {
    state: 'explicit',
    definition: 'WGS84',
    representation: 'identifier',
    provenance: 'metadata'
  };
  const descriptor = await pending;
  expect(descriptor.coordinateFrame).toBe('projected');
  expect(descriptor.converter.WGS84.from([12, 40])[0]).toBeGreaterThan(1000000);
});

test('retrieval rejects unsupported definitions and unavailable algorithms', async () => {
  await expect(projectionEngine.getCRS('EPSG:999999')).rejects.toThrow();
  await expect(createProjectionEngine().getCRS('EPSG:3857')).rejects.toThrow();
  const engine = createProjectionEngine({
    projections: [
      createProjectionDescriptor({name: 'merc'}, async () => {
        throw new Error('Import failed');
      })
    ]
  });
  await expect(engine.getCRS('EPSG:3857')).rejects.toThrow('Import failed');
});

test('component unit labels follow altitude axis order and geocentric coordinates', async () => {
  const reordered = await projectionEngine.getCRS('+proj=longlat +axis=une +vunits=ft', {
    enforceAxis: true
  });
  expect([reordered.xUnit, reordered.yUnit, reordered.zUnit]).toEqual([
    {name: 'feet', metersPerUnit: 0.3048},
    {name: 'degrees'},
    {name: 'degrees'}
  ]);
  const ecef = await projectionEngine.getCRS('+proj=geocent +ellps=WGS84 +units=km +vunits=ft');
  expect([ecef.xUnit, ecef.yUnit, ecef.zUnit]).toEqual([
    {name: 'kilometers', metersPerUnit: 1000},
    {name: 'kilometers', metersPerUnit: 1000},
    {name: 'kilometers', metersPerUnit: 1000}
  ]);
  const custom = await projectionEngine.getCRS('+proj=merc +to_meter=2.5');
  expect(custom.xUnit).toEqual({name: 'custom', metersPerUnit: 2.5});
  expect(custom.yUnit).toEqual({name: 'custom', metersPerUnit: 2.5});
  expect(custom.zUnit).toEqual({name: 'meters', metersPerUnit: 1});
});

test('conversion methods accept typed inputs and preserve supplied output types', async () => {
  const descriptor = await projectionEngine.getCRS('EPSG:3857');
  const input = new Float64Array([12, 40, 123]);
  const projected = descriptor.converter.WGS84.from(input);
  expect(Array.isArray(projected)).toBe(true);
  const output: Float32Array = descriptor.converter.WGS84.from(input, new Float32Array(3));
  expect(output).toBeInstanceOf(Float32Array);
  const restored: number[] = descriptor.converter.WGS84.to(projected, [0, 0, 0]);
  expect(restored[0]).toBeCloseTo(12, 6);
  expect(descriptor).not.toHaveProperty('fromWGS84To');
  expect(descriptor).not.toHaveProperty('toWGS84To');
  const ecef = await projectionEngine.getCRS('EPSG:4978');
  expect(ecef.converter.WGS84.from([0, 0])).toHaveLength(3);
});

test('Web Mercator normalization is explicit and provides a finite map rectangle', async () => {
  const crs = await projectionEngine.getCRS('EPSG:3857');
  const maxLatitude = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI;
  const normalized = crs.converter.WGS84.normalize([540, 95, 123, 8]);
  expect(normalized[0]).toBe(-180);
  expect(normalized[1]).toBeCloseTo(maxLatitude, 12);
  expect(normalized.slice(2)).toEqual([123, 8]);
  const output = new Float64Array([540, -95, 123]);
  expect(crs.converter.WGS84.normalize(output, output)).toBe(output);
  expect(output[0]).toBe(-180);
  expect(output[1]).toBeCloseTo(-maxLatitude, 12);
  expect(output[2]).toBe(123);
  expect(() => crs.converter.WGS84.from([0, 90])).toThrow();
  const extent = Math.PI * 6378137;
  for (let axis = 0; axis < 2; axis++) {
    expect(crs.bounds[0][axis]).toBeCloseTo(-extent, 6);
    expect(crs.bounds[1][axis]).toBeCloseTo(extent, 6);
  }
  const projected = crs.converter.WGS84.from(crs.converter.WGS84.normalize([0, 90]));
  expect(projected[1]).toBeCloseTo(crs.bounds[1][1], 6);
  const generic = await projectionEngine.getCRS('+proj=merc +ellps=WGS84');
  expect(generic.converter.WGS84.normalize([0, 89])[1]).toBeCloseTo(85.0511287798066);
  expect(generic.converter.WGS84.from([0, 89])[1]).toBeGreaterThan(generic.bounds[1][1]);
  expect(Number.isFinite(generic.bounds[1][1])).toBe(true);
});

test('normalization follows CRS longitude parameters and preserves storage on failure', async () => {
  const crs = await projectionEngine.getCRS('+proj=merc +lon_0=100');
  expect(crs.converter.WGS84.normalize([-170, 95])).toEqual([
    190,
    (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI
  ]);
  const geographic = await projectionEngine.getCRS('+proj=longlat +lon_wrap=180');
  expect(geographic.converter.WGS84.normalize([-10, 0])).toEqual([350, 0]);
  expect(geographic.bounds).toEqual([
    [0, -90],
    [360, 90]
  ]);
  const output = [1, 2, 3];
  expect(() => crs.converter.WGS84.normalize([NaN, 0, 0], output)).toThrow();
  expect(output).toEqual([1, 2, 3]);
});

test('global bounds account for earth models, linear units, false offsets and axis signs', async () => {
  const sphere = await projectionEngine.getCRS('+proj=geocent +R=6371008.8 +units=km');
  expect(sphere.bounds).toEqual([
    [-6371.0088, -6371.0088],
    [6371.0088, 6371.0088]
  ]);
  const eqc = await projectionEngine.getCRS(
    '+proj=eqc +R=1000 +lat_ts=60 +x_0=10 +y_0=20 +units=km +axis=wsu',
    {enforceAxis: true}
  );
  expect(eqc.bounds[0][0]).toBeCloseTo(-(10 + 500 * Math.PI) / 1000, 10);
  expect(eqc.bounds[1][1]).toBeCloseTo(-(20 - 500 * Math.PI) / 1000, 10);
  const equalEarth = await projectionEngine.getCRS('+proj=eqearth +ellps=WGS84');
  // Independently evaluate a geographic grid through the projection. The envelope
  // must include boundary and interior points, including both seam spellings.
  for (let latitude = -90; latitude <= 90; latitude += 15) {
    for (let longitude = -180; longitude <= 180; longitude += 30) {
      const point = equalEarth.converter.WGS84.from([longitude, latitude]);
      for (let axis = 0; axis < 2; axis++) {
        expect(point[axis]).toBeGreaterThanOrEqual(equalEarth.bounds[0][axis] - 1e-6);
        expect(point[axis]).toBeLessThanOrEqual(equalEarth.bounds[1][axis] + 1e-6);
      }
    }
  }
  const polar = await projectionEngine.getCRS('+proj=stere +lat_0=90');
  expect(polar.bounds.flat().every(Number.isFinite)).toBe(true);
});

test('distance scales are ground metres per native coordinate unit', async () => {
  const mercator = await projectionEngine.getCRS('EPSG:3857');
  if (typeof mercator.distanceScale !== 'function') throw new Error('Missing scale callback');
  const scale = mercator.distanceScale(mercator.converter.WGS84.from([0, 60, 0]));
  expect(mercator.getDistanceScale(mercator.converter.WGS84.from([0, 60, 0]))).toEqual(scale);
  expect(mercator.getDistanceScale([NaN, 0])).toBeNull();
  expect(scale[0]).toBeCloseTo(0.5, 7);
  expect(scale[1]).toBeCloseTo(0.5, 7);
  expect(scale[2]).toBeCloseTo(0.5, 7);
  expect(mercator.distanceScale([NaN, 0])).toBeNull();
  expect(mercator.distanceScale(mercator.converter.WGS84.from([180, 0]))).toBeNull();
  const sphere = await projectionEngine.getCRS('+proj=geocent +R=6371008.8 +units=km');
  expect(sphere.distanceScale).toEqual([1000, 1000, 1000]);
  expect(sphere.getDistanceScale([0, 0, 0])).toEqual([1000, 1000, 1000]);
  const ellipsoid = await projectionEngine.getCRS('EPSG:4978');
  expect(ellipsoid.distanceScale).toEqual([1, 1, 1]);
  const equalEarth = await projectionEngine.getCRS('+proj=eqearth +ellps=WGS84');
  if (typeof equalEarth.distanceScale !== 'function') throw new Error('Missing scale callback');
  const areaScale = equalEarth.distanceScale(equalEarth.converter.WGS84.from([0, 45, 0]));
  expect(areaScale[0] * areaScale[1]).toBeCloseTo(1, 6);
});

test('scale derivatives follow the CRS central meridian and remain continuous on globe', async () => {
  const shifted = await projectionEngine.getCRS('+proj=merc +R=6378137 +lon_0=180');
  if (typeof shifted.distanceScale !== 'function') throw new Error('Missing scale callback');
  expect(shifted.distanceScale(shifted.converter.WGS84.from([180, 0]))).not.toBeNull();
  expect(shifted.distanceScale(shifted.converter.WGS84.from([0, 0]))).toBeNull();
  const globe = await projectionEngine.getCRS('+proj=geocent +R=6371008.8');
  expect(globe.distanceScale).toEqual([1, 1, 1]);
});

test('additional converters use direct source/target pairs and leave target behavior unchanged', async () => {
  const source = '+proj=eqc +R=6378137 +units=ft';
  const target = '+proj=eqearth +R=6378137';
  const baseline = await projectionEngine.getCRS(target);
  const descriptor = await projectionEngine.getCRS(target, {converters: ['EPSG:3857', source]});
  expect(descriptor.bounds).toEqual(baseline.bounds);
  expect(Object.keys(descriptor.converter)).toEqual(['WGS84', 'EPSG:3857', source]);
  const sourcePosition = projectionEngine
    .createProjection({from: 'WGS84', to: source})
    .project([12, 40, 123]);
  const direct = projectionEngine.createProjection({from: source, to: target});
  const converter = descriptor.converter[source];
  expect(converter.from(sourcePosition)).toEqual(direct.project(sourcePosition));
  const output = new Float64Array(3);
  expect(converter.from(sourcePosition, output)).toBe(output);
  expect(converter.to(output, output)).toBe(output);
  expect(output[0]).toBeCloseTo(sourcePosition[0], 6);
  expect(output[1]).toBeCloseTo(sourcePosition[1], 6);
  expect(descriptor).not.toHaveProperty('fromWGS84');
  expect(descriptor).not.toHaveProperty('toWGS84');
  expect(descriptor).not.toHaveProperty('normalizeWGS84');
  const before = baseline.distanceScale;
  const after = descriptor.distanceScale;
  if (typeof before !== 'function' || typeof after !== 'function')
    throw new Error('Missing scale callback');
  const point = baseline.converter.WGS84.from([0, 45, 0]);
  expect(after(point)).toEqual(before(point));
});

test('generic normalization returns source coordinates using the target working convention', async () => {
  const descriptor = await projectionEngine.getCRS('EPSG:3857', {converters: ['EPSG:3857']});
  const converter = descriptor.converter['EPSG:3857'];
  const extent = Math.PI * 6378137;
  const source = new Float64Array([0, extent * 2, 123]);
  const output = new Float64Array(3);
  expect(converter.normalize(source, output)).toBe(output);
  expect(output[1]).toBeCloseTo(extent, 6);
  expect(output[2]).toBe(123);
  expect(source[1]).toBe(extent * 2);
  expect(converter.normalize(source, source)).toBe(source);
  expect(source[1]).toBeCloseTo(extent, 6);
});

test('converter requests are captured, deduplicated and load only requested algorithms', async () => {
  const {equalEarth} = await import('@math.gl/projection/projections/eqearth');
  let mercImports = 0,
    equalEarthImports = 0;
  const engine = createProjectionEngine({
    projections: [
      createProjectionDescriptor({name: 'merc'}, async () => {
        mercImports++;
        return mercator;
      }),
      createProjectionDescriptor({name: 'eqearth'}, async () => {
        equalEarthImports++;
        return equalEarth;
      }),
      createProjectionDescriptor({name: 'unused'}, async () => {
        throw new Error('Unused import');
      })
    ]
  });
  const sources = ['EPSG:3857', 'EPSG:3857', 'WGS84'];
  const pending = engine.getCRS('+proj=eqearth', {converters: sources});
  sources.push('EPSG:999999');
  const descriptor = await pending;
  expect(Object.keys(descriptor.converter)).toEqual(['WGS84', 'EPSG:3857']);
  expect(mercImports).toBe(1);
  expect(equalEarthImports).toBe(1);
  await expect(engine.getCRS('+proj=eqearth', {converters: ['EPSG:999999']})).rejects.toThrow();
});

test('axis scales include horizontal/altitude units and effective axis order', async () => {
  const crs = await projectionEngine.getCRS(
    '+proj=merc +R=6371008.8 +units=ft +vunits=us-ft +axis=une',
    {enforceAxis: true}
  );
  if (typeof crs.distanceScale !== 'function') throw new Error('Missing scale callback');
  const scale = crs.distanceScale(crs.converter.WGS84.from([0, 60, 0]));
  expect(scale[0]).toBeCloseTo((1200 / 3937) * 0.5, 7);
  expect(scale[1]).toBeCloseTo(0.3048 * 0.5, 7);
  expect(scale[2]).toBeCloseTo(0.3048 * 0.5, 7);
});

test('descriptor bounds and normalization follow projection-owned profiles through aliases', async () => {
  const canonical = await projectionEngine.getCRS('+proj=eqearth +lon_0=30 +x_0=100');
  const alias = await projectionEngine.getCRS('+proj=Equal_Earth +lon_0=30 +x_0=100');
  expect(alias.bounds).toEqual(canonical.bounds);
  expect(alias.converter.WGS84.normalize([-170, 95])).toEqual([190, 90]);
  const utm = await projectionEngine.getCRS('EPSG:32632');
  expect(utm.converter.WGS84.normalize([-179, 0])).toEqual([12, 0]);
  const geocentric = await projectionEngine.getCRS('+proj=geocent +ellps=WGS84 +axis=une', {
    enforceAxis: true
  });
  expect(geocentric.bounds[1][0]).toBeCloseTo(6356752.314245179, 6);
  expect(geocentric.bounds[1][1]).toBe(6378137);
});

test('Jacobian scalar retains shear and respects independent vertical units', async () => {
  const engine = createProjectionEngine({
    projections: [
      {
        name: 'shear',
        parameters: [],
        create: ({semiMajorAxis: radius}) => ({
          forward: (longitude, latitude) => [
            radius * (longitude + 2 * latitude),
            radius * latitude
          ],
          inverse: (x, y) => [(x - 2 * y) / radius, y / radius]
        })
      }
    ]
  });
  const crs = await engine.getCRS('+proj=shear +R=6378137 +units=ft +vunits=us-ft');
  const scale = crs.getDistanceScale([0, 0, 0])!;
  expect(scale[0]).toBeCloseTo(0.3048, 7);
  expect(scale[1]).toBeCloseTo(0.3048 * Math.sqrt(5), 7);
  expect(scale[2]).toBeCloseTo(1200 / 3937, 7);
  expect(scale[2]).not.toBeCloseTo(Math.sqrt(scale[0] * scale[1]), 3);
});

test('invalid computed distance scales raise an actionable contract error', async () => {
  const engine = createProjectionEngine({
    projections: [
      {
        name: 'degenerate',
        parameters: [],
        create: () => ({forward: () => [0, 0], inverse: () => [0, 0]})
      }
    ]
  });
  const crs = await engine.getCRS('+proj=degenerate +R=6378137 +units=m');
  expect(() => crs.getDistanceScale([0, 0, 0])).toThrow('Invalid CRS distance scale');
});

test.each([projectionEngine, lazyProjectionEngine])(
  'stereographic rendering normalization clamps at 150 degrees without restricting conversions',
  async engine => {
    const radius = 6371008.8;
    const crs = await engine.getCRS(
      `+proj=stere +lat_0=90 +R=${radius} +k=2 +x_0=123 +y_0=-456 +units=ft`
    );
    const converter = crs.converter.WGS84;
    const extent = (4 * radius * Math.tan((75 * Math.PI) / 180)) / 0.3048;
    for (let axis = 0; axis < 2; axis++) {
      const offset = [123, -456][axis] / 0.3048;
      expect(crs.bounds[0][axis]).toBeCloseTo(offset - extent, 3);
      expect(crs.bounds[1][axis]).toBeCloseTo(offset + extent, 3);
    }
    for (const longitude of [-180, -90, 0, 90, 180]) {
      const input = new Float64Array([longitude, -90, 321, 8]);
      const normalized = converter.normalize(input);
      expect(normalized[0]).toBeCloseTo(longitude, 10);
      expect(normalized[1]).toBeCloseTo(-60, 10);
      expect(normalized.slice(2)).toEqual([321, 8]);
      expect(input[1]).toBe(-90);
      expect(converter.normalize(input, input)).toBe(input);
      expect(Array.from(input)).toEqual(normalized);
      expect(converter.from(input).every(Number.isFinite)).toBe(true);
    }
    const outside = converter.from([0, -75, 321]);
    expect(outside[1]).toBeLessThan(crs.bounds[0][1]);
    const restored = converter.to(outside);
    expect(restored[1]).toBeCloseTo(-75, 10);
    expect(restored[2]).toBe(321);
    expect(() => converter.from([0, -90])).toThrow('antipode');
  }
);

test.each([-90, 0, 37, 90])(
  'stereographic rendering extent follows latitude origin %s',
  async latitude => {
    const longitude = 42;
    for (const ellipsoid of ['+R=6371008.8', '+ellps=WGS84']) {
      const crs = await projectionEngine.getCRS(
        `+proj=stere +lat_0=${latitude} +lon_0=${longitude} ${ellipsoid}`
      );
      const converter = crs.converter.WGS84;
      const radians = Math.PI / 180;
      for (let lng = -180; lng <= 180; lng += 10) {
        for (let lat = -90; lat <= 90; lat += 10) {
          const normalized = converter.normalize([lng, lat, 7]);
          const dot =
            Math.sin(latitude * radians) * Math.sin(normalized[1] * radians) +
            Math.cos(latitude * radians) *
              Math.cos(normalized[1] * radians) *
              Math.cos((normalized[0] - longitude) * radians);
          expect(dot).toBeGreaterThanOrEqual(Math.cos(150 * radians) - 1e-12);
          const again = converter.normalize(normalized);
          expect(again[0]).toBeCloseTo(normalized[0], 9);
          expect(again[1]).toBeCloseTo(normalized[1], 9);
          expect(normalized[2]).toBe(7);
          const projected = converter.from(normalized);
          for (let axis = 0; axis < 2; axis++) {
            expect(projected[axis]).toBeGreaterThanOrEqual(crs.bounds[0][axis] - 1e-6);
            expect(projected[axis]).toBeLessThanOrEqual(crs.bounds[1][axis] + 1e-6);
          }
        }
      }
      expect(converter.normalize([longitude, latitude])).toEqual([longitude, latitude]);
      const antipode = converter.normalize([longitude + 180, -latitude]);
      expect(converter.from(antipode).every(Number.isFinite)).toBe(true);
    }
  }
);

test('descriptors expose CRS-owned identity independently of requested converters', async () => {
  const definition = '+proj=merc +axis=neu +units=m';
  const crs = await projectionEngine.getCRS(definition);
  const additional = await projectionEngine.getCRS(definition, {converters: ['EPSG:3857']});
  const lazy = await lazyProjectionEngine.getCRS(definition);
  const enforced = await projectionEngine.getCRS(definition, {enforceAxis: true});
  expect(crs.signature).toBe(definition);
  expect(enforced.signature).toBe(getCRSSignature(enforced));
  expect(additional.signature).toBe(crs.signature);
  expect(lazy.signature).toBe(crs.signature);
  expect(enforced.signature).not.toBe(crs.signature);
});

test.each(['EPSG:3857', '+proj=merc +units=m', ' +proj=merc  +units=m '])(
  'default CRS signatures preserve the exact string %s',
  async definition => {
    for (const engine of [projectionEngine, lazyProjectionEngine]) {
      const crs = await engine.getCRS(definition);
      expect(crs.signature).toBe(definition);
      expect(
        (await engine.getCRS(definition, {enforceAxis: false, mode: 'strict'})).signature
      ).toBe(definition);
    }
  }
);

test('CRS signatures respect effective engine defaults and per-request overrides', async () => {
  const definition = '+proj=merc +axis=neu +units=m';
  for (const engine of [
    new FullProjectionEngine({enforceAxis: true}),
    new LazyProjectionEngine({enforceAxis: true})
  ]) {
    const enforced = await engine.getCRS(definition);
    expect(enforced.axis).toBe('neu');
    expect(enforced.signature).toBe(getCRSSignature(enforced));
    const defaultAxis = await engine.getCRS(definition, {enforceAxis: false});
    expect(defaultAxis.axis).toBe('enu');
    expect(defaultAxis.signature).toBe(definition);
  }
});

test('custom engine registrations and structured inputs retain resolved signatures', async () => {
  const engine = new FullProjectionEngine({
    aliases: {'EPSG:3857': '+proj=eqc +R=6371008.8 +units=m'}
  });
  const aliased = await engine.getCRS('EPSG:3857');
  expect(aliased.signature).toBe(getCRSSignature(aliased));
  expect(aliased.signature).not.toBe('EPSG:3857');
  const registered = await createProjectionEngine({projections: [mercator]}).getCRS('+proj=merc');
  expect(registered.signature).toBe(getCRSSignature(registered));
  const structured = await projectionEngine.getCRS(
    createSpatialReference({crs: {state: 'explicit', definition: 'EPSG:3857'}})
  );
  expect(structured.signature).toBe(getCRSSignature(structured));
});
