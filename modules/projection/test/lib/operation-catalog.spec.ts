// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original authored operation metadata, eligibility oracle and pipeline integration tests; no external database or model data.
import {expect, test, vi} from 'vitest';
import {OperationCatalog} from '@math.gl/projection/operations';
import type {
  CoordinateOperation,
  OperationArea,
  OperationSelectionRequest
} from '@math.gl/projection/operations';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';

const world: OperationArea = [-180, -90, 180, 90];
const request: OperationSelectionRequest = {
  sourceCRS: 'app:source',
  targetCRS: 'app:target',
  area: [10, 40, 20, 50]
};
function operation<T = string>(
  changes: Partial<CoordinateOperation<T>> = {}
): CoordinateOperation<T> {
  return {
    id: 'reviewed',
    sourceCRS: 'app:source',
    targetCRS: 'app:target',
    area: world,
    epochRange: null,
    accuracyMeters: 1,
    provenance: {
      authority: 'math.gl test authors',
      version: 'fixture-1',
      reference: 'Authored synthetic operation; not a geodetic accuracy claim'
    },
    operation: 'payload' as T,
    ...changes
  };
}

test('empty catalogue and no eligible operation return undefined with diagnostics', () => {
  expect(new OperationCatalog([]).select(request)).toBeUndefined();
  expect(new OperationCatalog([]).inspect(request)).toEqual({
    selected: undefined,
    candidates: [],
    rejected: []
  });
  const catalog = new OperationCatalog([operation({sourceCRS: 'other', targetCRS: 'other'})]);
  expect(catalog.select(request)).toBeUndefined();
  expect(catalog.inspect(request).rejected[0].reasons).toEqual(['source-crs', 'target-crs']);
});

test('rank is independent of insertion order and does not depend on host locale', () => {
  const definitions = [
    operation({id: 'b', accuracyMeters: 2}),
    operation({id: 'a', accuracyMeters: 2}),
    operation({id: 'A', accuracyMeters: 2}),
    operation({id: 'unknown', accuracyMeters: null}),
    operation({id: 'ballpark', accuracyMeters: 0, ballpark: true})
  ];
  const options = {...request, allowUnknownAccuracy: true, allowBallpark: true};
  for (let shift = 0; shift < definitions.length; shift++) {
    const shuffled = definitions.slice(shift).concat(definitions.slice(0, shift));
    const catalog = new OperationCatalog(shuffled);
    expect(catalog.select(options)?.id).toBe('A');
    expect(catalog.inspect(options).candidates.map(value => value.id)).toEqual([
      'A',
      'a',
      'b',
      'unknown',
      'ballpark'
    ]);
  }
});

test('accuracy and ballpark exclusions require independent explicit opt-ins', () => {
  const catalog = new OperationCatalog([
    operation({id: 'unknown', accuracyMeters: null}),
    operation({id: 'approximate', accuracyMeters: 0, ballpark: true})
  ]);
  expect(catalog.select(request)).toBeUndefined();
  expect(catalog.select({...request, allowUnknownAccuracy: true})?.id).toBe('unknown');
  expect(catalog.select({...request, allowBallpark: true})?.id).toBe('approximate');
  expect(
    catalog.select({...request, allowUnknownAccuracy: true, maxAccuracyMeters: 100})
  ).toBeUndefined();
  expect(
    new OperationCatalog([operation({accuracyMeters: 0})]).select({
      ...request,
      maxAccuracyMeters: 0
    })?.id
  ).toBe('reviewed');
  expect(
    new OperationCatalog([operation()]).inspect({...request, maxAccuracyMeters: 0.99}).rejected[0]
      .reasons
  ).toEqual(['accuracy']);
});

test('finite inclusive epoch intervals require the entire requested epoch span', () => {
  const catalog = new OperationCatalog([operation({epochRange: [2000, 2030]})]);
  expect(catalog.inspect(request).rejected[0].reasons).toEqual(['epoch-required']);
  for (const epoch of [2000, 2015, 2030, [2000, 2030] as const, [2010, 2010] as const]) {
    expect(catalog.select({...request, epoch})?.id).toBe('reviewed');
  }
  for (const epoch of [1999, 2031, [1999, 2010] as const, [2020, 2031] as const]) {
    expect(catalog.inspect({...request, epoch}).rejected[0].reasons).toEqual(['epoch']);
  }
  expect(new OperationCatalog([operation()]).select({...request, epoch: -2000})?.id).toBe(
    'reviewed'
  );
});

test('grid revisions must match exactly; diagnostics retain all missing requirements', () => {
  const grids = [
    {id: 'horizontal', revision: 'sha256:test-v1'},
    {id: 'height', revision: '2026-01'}
  ];
  const catalog = new OperationCatalog([operation({grids})]);
  expect(catalog.inspect(request).rejected[0].missingGrids).toEqual(grids);
  const partial = {
    ...request,
    availableGrids: [{id: 'horizontal', revision: 'sha256:test-v0'}, grids[1]]
  };
  expect(catalog.inspect(partial).rejected[0].missingGrids).toEqual([grids[0]]);
  expect(catalog.select({...request, availableGrids: [grids[0], grids[0], grids[1]]})?.id).toBe(
    'reviewed'
  );
  // Delimiters in identities cannot collide through a concatenated map key.
  const collision = new OperationCatalog([operation({grids: [{id: 'a/b', revision: 'c'}]})]);
  expect(
    collision.select({...request, availableGrids: [{id: 'a', revision: 'b/c'}]})
  ).toBeUndefined();
  expect(
    catalog.select({
      ...request,
      availableGrids: [{id: 'Horizontal', revision: grids[0].revision}, grids[1]]
    })
  ).toBeUndefined();
});

test('selection can choose an explicitly reviewed fallback when a grid is unavailable', () => {
  const catalog = new OperationCatalog([
    operation({id: 'fine', accuracyMeters: 0.1, grids: [{id: 'local', revision: '1'}]}),
    operation({id: 'coarse', accuracyMeters: 5})
  ]);
  expect(catalog.select(request)?.id).toBe('coarse');
  expect(catalog.select({...request, maxAccuracyMeters: 1})).toBeUndefined();
  expect(catalog.select({...request, availableGrids: [{id: 'local', revision: '1'}]})?.id).toBe(
    'fine'
  );
});

test('diagnostics report every failed eligibility gate in a fixed order', () => {
  const candidate = operation({
    sourceCRS: 'other',
    targetCRS: 'other',
    area: [0, 0, 1, 1],
    epochRange: [2000, 2010],
    accuracyMeters: null,
    ballpark: true,
    grids: [{id: 'local', revision: '1'}]
  });
  const catalog = new OperationCatalog([candidate]);
  expect(catalog.inspect({...request, epoch: 2020}).rejected[0].reasons).toEqual([
    'source-crs',
    'target-crs',
    'area',
    'epoch',
    'grid',
    'accuracy-unknown',
    'ballpark'
  ]);
  expect(catalog.select({...request, epoch: 2020})).toBeUndefined();
});

test('whole area containment covers antimeridian, poles, global and point requests', () => {
  const catalog = new OperationCatalog([operation({area: [170, -80, -170, 80]})]);
  for (const area of [
    [175, -10, -175, 10],
    [170, -80, -170, 80],
    [180, 0, -180, 0],
    [-180, 0, -180, 0],
    [170, 0, 170, 0]
  ] as OperationArea[]) {
    expect(catalog.select({...request, area})?.id).toBe('reviewed');
  }
  for (const area of [
    [-175, -10, 175, 10],
    [169, -10, -175, 10],
    [175, -10, -169, 10],
    [-180, -10, 180, 10],
    [175, -81, -175, 10]
  ] as OperationArea[]) {
    expect(catalog.inspect({...request, area}).rejected[0].reasons).toEqual(['area']);
  }
  expect(new OperationCatalog([operation()]).select({...request, area: world})?.id).toBe(
    'reviewed'
  );
  expect(
    new OperationCatalog([operation({area: [180, -90, -180, 90]})]).select({
      ...request,
      area: [-180, 90, -180, 90]
    })?.id
  ).toBe('reviewed');
  expect(
    new OperationCatalog([operation({area: [180, -90, -180, 90]})]).select({
      ...request,
      area: world
    })
  ).toBeUndefined();
  expect(catalog.select({...request, area: [179.9999, 0, -179.9999, 0]})?.id).toBe('reviewed');
  expect(catalog.select({...request, area: [169.999999, 0, 170, 0]})).toBeUndefined();
});

test('longitude containment agrees with an independent pointwise oracle for 2401 arcs', () => {
  const longitudes = [-180, -120, -60, 0, 60, 120, 180];
  function contains(west: number, east: number, longitude: number): boolean {
    const within = (point: number) =>
      west <= east ? point >= west && point <= east : point >= west || point <= east;
    return within(longitude) || (Math.abs(longitude) === 180 && within(-longitude));
  }
  for (const west of longitudes)
    for (const east of longitudes) {
      const catalog = new OperationCatalog([operation({area: [west, -90, east, 90]})]);
      for (const innerWest of longitudes)
        for (const innerEast of longitudes) {
          let expected = true;
          for (let point = -180; point <= 180; point++) {
            if (contains(innerWest, innerEast, point) && !contains(west, east, point)) {
              expected = false;
              break;
            }
          }
          expect(Boolean(catalog.select({...request, area: [innerWest, 0, innerEast, 0]}))).toBe(
            expected
          );
        }
    }
});

test('metadata is an immutable snapshot, but the application owns its opaque payload', () => {
  const area: [number, number, number, number] = [-180, -90, 180, 90];
  const epochRange: [number, number] = [2000, 2030];
  const grids = [{id: 'local', revision: '1'}];
  const provenance = {authority: 'app', version: '1', reference: 'authored'};
  const payload = {preload: vi.fn(), marker: 1};
  const candidate = operation({area, epochRange, grids, provenance, operation: payload});
  const definitions = [candidate];
  const catalog = new OperationCatalog(definitions);
  area[0] = 0;
  epochRange[1] = 2001;
  grids[0].revision = '2';
  provenance.version = '2';
  definitions.length = 0;
  const selected = catalog.select({
    ...request,
    epoch: 2020,
    availableGrids: [{id: 'local', revision: '1'}]
  });
  expect(selected?.area).toEqual(world);
  expect(selected?.provenance.version).toBe('1');
  expect(selected?.operation).toBe(payload);
  expect(payload.preload).not.toHaveBeenCalled();
  expect(Object.isFrozen(payload)).toBe(false);
  payload.marker = 2;
  const inspected = catalog.inspect({...request, epoch: 2020});
  for (const value of [
    catalog,
    catalog.operations,
    catalog.operations[0],
    selected?.area,
    selected?.epochRange,
    selected?.grids,
    selected?.grids?.[0],
    selected?.provenance,
    inspected,
    inspected.candidates,
    inspected.rejected,
    inspected.rejected[0],
    inspected.rejected[0].reasons,
    inspected.rejected[0].missingGrids
  ]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
});

test('CRS identifiers are exact and directed, with no alias or inverse synthesis', () => {
  const catalog = new OperationCatalog([operation()]);
  expect(
    catalog.select({...request, sourceCRS: request.targetCRS, targetCRS: request.sourceCRS})
  ).toBeUndefined();
  expect(catalog.select({...request, sourceCRS: 'APP:source'})).toBeUndefined();
  expect(catalog.select({...request, sourceCRS: ' app:source '})).toBeUndefined();
});

test('explicitly selected factories construct pipelines only after application choice', () => {
  const create = vi.fn(
    () =>
      new ProjectionPipeline({
        input: {space: 'geocentric', units: ['m', 'm', 'm']},
        steps: [{type: 'helmert', translation: [1, 2, 3]}]
      })
  );
  const catalog = new OperationCatalog([operation({operation: create})]);
  const selected = catalog.select(request);
  catalog.inspect(request);
  expect(create).not.toHaveBeenCalled();
  const pipeline = selected!.operation();
  const output = new Float64Array(4);
  expect(pipeline.projectToSync([10, 20, 30, 8], output)).toBe(output);
  expect(Array.from(output)).toEqual([11, 22, 33, 8]);
  const batch = new Float32Array([10, 20, 30, 8, 40, 50, 60, 9]);
  expect(pipeline.projectFlatSync(batch, 4)).toBe(batch);
  expect(Array.from(batch)).toEqual([11, 22, 33, 8, 41, 52, 63, 9]);
  pipeline.unprojectFlatSync(batch, 4);
  expect(Array.from(batch)).toEqual([10, 20, 30, 8, 40, 50, 60, 9]);
});

const invalidAreas = [
  [0, 0, 1],
  [0, 0, 1, 1, 2],
  [NaN, 0, 1, 1],
  [0, Infinity, 1, 1],
  [-181, 0, 1, 1],
  [181, 0, 1, 1],
  [0, 0, 181, 1],
  [0, 0, -181, 1],
  [0, -91, 1, 1],
  [0, 0, 1, 91],
  [0, 2, 1, 1],
  new Array(4),
  [undefined, 0, 1, 1],
  [0, 0, '1', 1]
];
for (const [index, area] of invalidAreas.entries()) {
  test('reject malformed area ' + index + ' in metadata and requests', () => {
    expect(() => new OperationCatalog([operation({area: area as OperationArea})])).toThrow(/area/);
    expect(() =>
      new OperationCatalog([operation()]).select({...request, area: area as OperationArea})
    ).toThrow(/area/);
  });
}
for (const [index, epoch] of [
  [2000],
  [2000, 2030, 2040],
  [2030, 2000],
  [NaN, 2000],
  [2000, Infinity],
  new Array(2),
  [undefined, 2030]
].entries()) {
  test('reject malformed epoch interval ' + index, () => {
    expect(
      () => new OperationCatalog([operation({epochRange: epoch as [number, number]})])
    ).toThrow(/epoch/);
    expect(() =>
      new OperationCatalog([operation()]).select({...request, epoch: epoch as [number, number]})
    ).toThrow(/epoch/);
  });
}
for (const value of [-1, NaN, Infinity, undefined, '1']) {
  test('reject malformed accuracy ' + String(value), () => {
    expect(() => new OperationCatalog([operation({accuracyMeters: value as number})])).toThrow(
      /accuracy/
    );
    if (value !== undefined)
      expect(() =>
        new OperationCatalog([operation()]).select({...request, maxAccuracyMeters: value as number})
      ).toThrow(/Accuracy/);
  });
}

test('reject duplicate ids, unpinned provenance, grid identities and non-boolean quality flags', () => {
  expect(() => new OperationCatalog([operation(), operation()])).toThrow(/Duplicate/);
  for (const key of ['id', 'sourceCRS', 'targetCRS'] as const) {
    for (const value of ['', ' ', null, 12])
      expect(
        () =>
          new OperationCatalog([operation({[key]: value} as Partial<CoordinateOperation<string>>)])
      ).toThrow();
  }
  for (const key of ['authority', 'version', 'reference'] as const) {
    expect(
      () =>
        new OperationCatalog([
          operation({
            provenance: {authority: 'app', version: '1', reference: 'authored', [key]: ''}
          })
        ])
    ).toThrow(/provenance/);
  }
  for (const grid of [
    {id: '', revision: '1'},
    {id: 'local', revision: ''}
  ]) {
    expect(() => new OperationCatalog([operation({grids: [grid]})])).toThrow(/grid/);
    expect(() =>
      new OperationCatalog([operation()]).select({...request, availableGrids: [grid]})
    ).toThrow(/grid/);
  }
  expect(
    () => new OperationCatalog([operation({ballpark: 'false' as unknown as boolean})])
  ).toThrow(/boolean/);
  expect(() =>
    new OperationCatalog([operation()]).select({
      ...request,
      allowBallpark: 'false' as unknown as boolean
    })
  ).toThrow(/boolean/);
  expect(() =>
    new OperationCatalog([operation()]).select({
      ...request,
      allowUnknownAccuracy: 1 as unknown as boolean
    })
  ).toThrow(/boolean/);
  expect(() => new OperationCatalog([operation()]).select({...request, epoch: Infinity})).toThrow(
    /epoch/
  );
  expect(
    () => new OperationCatalog([operation({epochRange: undefined as unknown as null})])
  ).toThrow(/epoch/);
});

test('sparse catalogues and grid lists fail validation before selection', () => {
  expect(() => new OperationCatalog(new Array(1))).toThrow(/metadata/);
  expect(() => new OperationCatalog([operation({grids: new Array(1)})])).toThrow(/grid/);
  expect(() =>
    new OperationCatalog([operation()]).select({...request, availableGrids: new Array(1)})
  ).toThrow(/grid/);
  expect(() => new OperationCatalog(null as unknown as CoordinateOperation<string>[])).toThrow(
    /array/
  );
  expect(() => new OperationCatalog([operation({grids: null as unknown as []})])).toThrow(/array/);
});

test('tiny out-of-area differences never round into coverage', () => {
  const catalog = new OperationCatalog([operation({area: [0, -1, 1, 1]})]);
  for (const west of [-Number.MIN_VALUE, -1e-16, -1e-14]) {
    expect(catalog.select({...request, area: [west, 0, west, 0]})).toBeUndefined();
    expect(catalog.select({...request, area: [west, 0, 0.5, 0]})).toBeUndefined();
  }
  expect(catalog.select({...request, area: [0, 0, Number.MIN_VALUE, 0]})?.id).toBe('reviewed');
  const tiny = new OperationCatalog([operation({area: [-1e-16, -1, 1e-16, 1]})]);
  expect(tiny.select({...request, area: [-2e-16, 0, 0, 0]})).toBeUndefined();
  expect(tiny.select({...request, area: [0, 0, 2e-16, 0]})).toBeUndefined();
  expect(tiny.select({...request, area: [-1e-16, 0, 1e-16, 0]})?.id).toBe('reviewed');
});
