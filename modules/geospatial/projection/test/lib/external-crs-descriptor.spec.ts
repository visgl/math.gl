// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createCRSDescriptor} from '@math.gl/geospatial/projection/crs-descriptor';
import type {CRSDescriptorOptions} from '@math.gl/geospatial/projection/crs-descriptor';
import type {
  CRSConversion,
  CRSDescriptor,
  ProjectionCoordinate,
  ProjectionOutput
} from '@math.gl/geospatial/projection/types';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {getCRSSignature} from '@math.gl/geospatial/crs';
import {
  createProj4CRSDescriptor,
  equalCylindricalDefinition
} from '../../examples/proj4-crs-descriptor';

function identity(input: ProjectionCoordinate): number[];
function identity<T extends ProjectionOutput>(input: ProjectionCoordinate, output: T): T;
function identity(input: ProjectionCoordinate, output?: ProjectionOutput): ProjectionOutput {
  if (!output) return Array.from(input);
  const copy = Array.from(input);
  for (let i = 0; i < copy.length; i++) output[i] = copy[i];
  return output;
}
function options(): CRSDescriptorOptions {
  return {
    metadata: {
      coordinateFrame: 'identity',
      projection: 'local',
      parameters: {},
      ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1},
      axis: 'enu',
      xUnit: {name: 'meters', metersPerUnit: 1},
      yUnit: {name: 'meters', metersPerUnit: 1},
      zUnit: {name: 'meters', metersPerUnit: 1},
      lossy: false
    },
    renderingBounds: [
      [-1, -2, 0],
      [1, 2, 0]
    ],
    renderingScale: [1, 2, 3],
    converter: {WGS84: {from: identity, to: identity, normalize: identity}}
  };
}

describe('backend-independent descriptor construction', () => {
  test('retains supplied axis/unit conventions and additional source converters', async () => {
    const native = await new FullProjectionEngine().getCRS('+proj=longlat +datum=WGS84 +axis=neu', {
      enforceAxis: true,
      converters: ['EPSG:3857']
    });
    const descriptor = createCRSDescriptor({
      metadata: native,
      renderingBounds: native.renderingBounds,
      renderingScale: native.renderingScale,
      converter: native.converter
    });
    expect(descriptor.axis).toBe('neu');
    expect(descriptor.xUnit.degreesPerUnit).toBe(1);
    expect(descriptor.zUnit.metersPerUnit).toBe(1);
    expect(descriptor.converter.WGS84.from([12, 55, 123])).toEqual([55, 12, 123]);
    expect(descriptor.converter['EPSG:3857'].from([0, 0])).toEqual(
      native.converter['EPSG:3857'].from([0, 0])
    );
  });
  test('snapshots metadata, bounds, scales and converter containers', () => {
    const params = {local: 'yes'};
    const unit = {name: 'feet', metersPerUnit: 0.3048};
    const ellipsoid = {semiMajorAxis: 2, semiMinorAxis: 3}; // Prolate is valid metadata.
    const area: [number, number, number, number] = [170, -40, -170, 40];
    const bounds: [[number, number, number], [number, number, number]] = [
      [-1, -2, 0],
      [1, 2, 0]
    ];
    const scale: [number, number, number] = [1, 2, 3];
    const input = options();
    const descriptor = createCRSDescriptor({
      ...input,
      metadata: {...input.metadata, parameters: params, xUnit: unit, ellipsoid, areaOfUse: area},
      renderingBounds: bounds,
      renderingScale: scale
    });
    const signature = descriptor.signature;
    params.local = 'changed';
    unit.metersPerUnit = 100;
    ellipsoid.semiMajorAxis = 9;
    area[0] = 0;
    bounds[0][0] = -100;
    scale[0] = 99;
    expect(descriptor.parameters.local).toBe('yes');
    expect(descriptor.xUnit.metersPerUnit).toBe(0.3048);
    expect(descriptor.ellipsoid.semiMajorAxis).toBe(2);
    expect(descriptor.areaOfUse?.[0]).toBe(170);
    expect(descriptor.renderingBounds[0][0]).toBe(-1);
    expect(descriptor.getRenderingScale([0, 0])).toEqual([1, 2, 3]);
    expect(getCRSSignature(descriptor)).toBe(signature);
    for (const value of [
      descriptor,
      descriptor.parameters,
      descriptor.xUnit,
      descriptor.ellipsoid,
      descriptor.areaOfUse,
      descriptor.renderingBounds,
      descriptor.renderingBounds[0],
      descriptor.converter,
      descriptor.converter.WGS84,
      descriptor.renderingScale
    ])
      expect(Object.isFrozen(value)).toBe(true);
  });

  test('retains opaque identity and does not interpret bounds as clipping', () => {
    const descriptor = createCRSDescriptor({...options(), signature: 'external:local:v1'});
    expect(descriptor.signature).toBe('external:local:v1');
    expect(descriptor.converter.WGS84.from([100, 200])).toEqual([100, 200]);
    const a = options();
    expect(
      createCRSDescriptor({...a, metadata: {...a.metadata, parameters: {a: '1', b: '2'}}}).signature
    ).toBe(
      createCRSDescriptor({...a, metadata: {...a.metadata, parameters: {b: '2', a: '1'}}}).signature
    );
  });

  test('captures methods with their receivers and stores arbitrary source keys safely', () => {
    const owner = {
      calls: 0,
      from(input: ProjectionCoordinate, output?: ProjectionOutput) {
        this.calls++;
        return output ? identity(input, output) : identity(input);
      },
      to: identity,
      normalize: identity
    };
    const converter = Object.fromEntries([
      ['WGS84', owner],
      ['__proto__', owner]
    ]) as CRSDescriptorOptions['converter'];
    const descriptor = createCRSDescriptor({...options(), converter});
    owner.from = () => {
      throw new Error('replaced');
    };
    expect(descriptor.converter.WGS84.from([1, 2])).toEqual([1, 2]);
    expect(descriptor.converter['__proto__'].from([3, 4])).toEqual([3, 4]);
    expect(owner.calls).toBe(2);
    expect(Object.getPrototypeOf(descriptor.converter)).toBeNull();
  });

  test('copies non-enumerable own converters', () => {
    const converter = Object.defineProperty({}, 'WGS84', {value: options().converter.WGS84});
    const descriptor = createCRSDescriptor({...options(), converter});
    expect(descriptor.converter.WGS84.from([1, 2])).toEqual([1, 2]);
  });

  test('rejects sparse rendering bounds and constant or callback scales', () => {
    for (const renderingBounds of [
      new Array(2),
      [new Array(3), [1, 2, 3]],
      [[0, 0, 0], new Array(3)]
    ]) {
      expect(() =>
        createCRSDescriptor({...options(), renderingBounds: renderingBounds as never})
      ).toThrow('renderingBounds');
    }
    const scale = new Array(3) as unknown as [number, number, number];
    expect(() => createCRSDescriptor({...options(), renderingScale: scale})).toThrow(
      'renderingScale'
    );
    const descriptor = createCRSDescriptor({...options(), renderingScale: () => scale});
    expect(() => descriptor.getRenderingScale([0, 0])).toThrow('renderingScale');
  });

  test('supports unavailable scale and snapshots callback results', () => {
    const scale: [number, number, number] = [1, 2, 3];
    const descriptor = createCRSDescriptor({
      ...options(),
      renderingScale: point => (point[0] === 0 ? null : scale)
    });
    expect(descriptor.getRenderingScale([0, 0])).toBeNull();
    const result = descriptor.getRenderingScale([1, 0]);
    scale[0] = 99;
    expect(result).toEqual([1, 2, 3]);
    expect(descriptor.getRenderingScale([1, 0])).toEqual([99, 2, 3]);
    expect(() =>
      createCRSDescriptor({...options(), renderingScale: () => [1, NaN, 1]}).getRenderingScale([
        0, 0
      ])
    ).toThrow('renderingScale');
  });

  test('rejects malformed metadata and policy', () => {
    for (const patch of [
      {coordinateFrame: 'other'},
      {projection: ''},
      {axis: 'eee'},
      {axis: 'en'},
      {ellipsoid: {semiMajorAxis: Infinity, semiMinorAxis: 1}},
      {lossy: undefined},
      {parameters: {a: 1}},
      {xUnit: {name: 'm', metersPerUnit: 0}},
      {yUnit: {name: 'mixed', metersPerUnit: 1, degreesPerUnit: 1}},
      {areaOfUse: [1, 20, 2, -20]}
    ])
      expect(() =>
        createCRSDescriptor({...options(), metadata: {...options().metadata, ...patch} as never})
      ).toThrow(TypeError);
    for (const renderingBounds of [
      [
        [0, 0, 0],
        [-1, 1, 1]
      ],
      [
        [0, 0],
        [1, 1]
      ],
      [
        [0, NaN, 0],
        [1, 1, 1]
      ]
    ]) {
      expect(() =>
        createCRSDescriptor({...options(), renderingBounds: renderingBounds as never})
      ).toThrow('renderingBounds');
    }
    expect(() => createCRSDescriptor({...options(), renderingScale: [0, 1, 1]})).toThrow(
      'renderingScale'
    );
    expect(() => createCRSDescriptor({...options(), signature: ' '})).toThrow('signature');
    expect(() => createCRSDescriptor({...options(), converter: {} as never})).toThrow('WGS84');
    expect(() =>
      createCRSDescriptor({...options(), converter: Object.create(options().converter)})
    ).toThrow('WGS84');
    expect(() => createCRSDescriptor({...options(), converter: {WGS84: {} as never}})).toThrow(
      'converter.from'
    );
    expect(() =>
      createCRSDescriptor({
        ...options(),
        converter: {...options().converter, ' ': options().converter.WGS84}
      })
    ).toThrow('converter key');
  });

  test('preserves backend errors and rejects asynchronous or replacement-output results', async () => {
    const error = new Error('backend failure');
    const make = (from: CRSConversion) =>
      createCRSDescriptor({...options(), converter: {WGS84: {...options().converter.WGS84, from}}});
    expect(() =>
      make(() => {
        throw error;
      }).converter.WGS84.from([1, 2])
    ).toThrow(error);
    expect(() =>
      make((() => Promise.resolve([1, 2])) as never).converter.WGS84.from([1, 2])
    ).toThrow('synchronous');
    expect(() => make((() => Promise.reject(error)) as never).converter.WGS84.from([1, 2])).toThrow(
      'synchronous'
    );
    expect(() =>
      createCRSDescriptor({
        ...options(),
        renderingScale: (() => Promise.reject(error)) as never
      }).getRenderingScale([1, 2])
    ).toThrow('synchronous');
    await Promise.resolve();
    expect(() =>
      make((() => [1, 2]) as never).converter.WGS84.from([1, 2], new Float64Array(2))
    ).toThrow('supplied output');
  });
});

/** The same public consumer checks exercise independent native and external implementations. */
describe.each(['native', 'proj4js'])('%s descriptor conformance', backend => {
  async function descriptor(): Promise<CRSDescriptor> {
    return backend === 'native'
      ? new FullProjectionEngine().getCRS(equalCylindricalDefinition)
      : createProj4CRSDescriptor();
  }
  test('converts XY/XYZ/XYZM synchronously and preserves caller buffers', async () => {
    const {
      converter: {WGS84: converter}
    } = await descriptor();
    for (const point of [
      [12, 55],
      [12, 55, 123],
      [12, 55, 123, 8, 9]
    ]) {
      const input = new Float64Array(point);
      const projected = converter.from(input);
      expect(Array.isArray(projected)).toBe(true);
      expect(Array.from(input)).toEqual(point);
      expect(projected[0]).toBeCloseTo((6371000 * 12 * Math.PI) / 180, 6);
      expect(projected[1]).toBeCloseTo((6371000 * 55 * Math.PI) / 180, 6);
      expect(projected.slice(2)).toEqual(point.slice(2));
      const rounded = new Float32Array(point.length);
      expect(converter.from(input, rounded)).toBe(rounded);
      expect(Array.from(rounded)).toEqual(projected.map(Math.fround));
      const output = new Float64Array(point.length + 1).fill(77);
      expect(converter.from(input, output)).toBe(output);
      expect(Array.from(output.slice(0, point.length))).toEqual(projected);
      expect(output[point.length]).toBe(77);
      const inplace = new Float64Array(projected);
      expect(converter.to(inplace, inplace)).toBe(inplace);
      point.forEach((value, index) => expect(inplace[index]).toBeCloseTo(value, 8));
      expect(converter.normalize(input)).toEqual(point);
    }
  });
  test('reports invalid coordinates and capacity before writing output', async () => {
    const converter = (await descriptor()).converter.WGS84;
    const output = new Float64Array([77, 88]);
    expect(() => converter.from([NaN, 0], output)).toThrow();
    expect(Array.from(output)).toEqual([77, 88]);
    const rounded = new Float32Array([77, 88, 99, 111]);
    expect(() => converter.from([0, 0, 123, 1e40], rounded)).toThrow();
    expect(Array.from(rounded)).toEqual([77, 88, 99, 111]);
    expect(() => converter.from([0, 0, 123], output)).toThrow();
    expect(Array.from(output)).toEqual([77, 88]);
  });
});
