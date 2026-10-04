// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reviewed compound/dynamic metadata, model revision and irregular coverage tests.
import {expect, test} from 'vitest';
import {OperationCatalog} from '@math.gl/projection/operations';
import type {
  CoordinateOperation,
  OperationSelectionRequest,
  OperationCRSMetadata
} from '@math.gl/projection/operations';
const source: OperationCRSMetadata = {
  horizontalCRS: 'app:horizontal',
  verticalCRS: 'app:height',
  referenceFrame: 'app:frame',
  frameKind: 'dynamic',
  frameEpoch: 2010
};
const target: OperationCRSMetadata = {
  ...source,
  referenceFrame: 'app:target-frame',
  frameEpoch: 2020
};
function operation(): CoordinateOperation<string> {
  return {
    id: 'regional',
    sourceCRS: 'app:source',
    targetCRS: 'app:target',
    sourceMetadata: source,
    targetMetadata: target,
    area: [-10, -10, 10, 10],
    coverage: [
      [-10, -10, -2, 10],
      [2, -10, 10, 10]
    ],
    epochRange: [2000, 2030],
    accuracyMeters: 0.02,
    models: [
      {
        id: 'deformation',
        revision: 'reviewed-v1',
        license: 'MIT authored fixture',
        termsReference: 'application review / fixture terms'
      }
    ],
    provenance: {
      authority: 'math.gl test authors',
      version: '1',
      reference: 'authored conservative covered regions'
    },
    operation: 'payload'
  };
}
function request(): OperationSelectionRequest {
  return {
    sourceCRS: 'app:source',
    targetCRS: 'app:target',
    sourceMetadata: source,
    targetMetadata: target,
    area: [3, 0, 5, 1],
    epoch: [2010, 2020],
    availableModels: [{id: 'deformation', revision: 'reviewed-v1'}]
  };
}
test('covered irregular region requires exact prepared model and compound/dynamic identities', () => {
  const catalog = new OperationCatalog([operation()]);
  expect(catalog.select(request())?.operation).toBe('payload');
  for (const area of [
    [-1, 0, 1, 1],
    [-5, 0, 5, 1],
    [-11, 0, -5, 1]
  ])
    expect(
      catalog.inspect({...request(), area: area as [number, number, number, number]}).rejected[0]
        .reasons
    ).toContain(area[0] === -11 ? 'area' : 'coverage');
  expect(
    catalog.inspect({...request(), availableModels: [{id: 'deformation', revision: 'old'}]})
      .rejected[0].missingModels
  ).toEqual(operation().models);
  expect(catalog.inspect({...request(), sourceMetadata: undefined}).rejected[0].reasons).toContain(
    'source-metadata'
  );
  expect(
    catalog.inspect({...request(), targetMetadata: {...target, verticalCRS: 'other-height'}})
      .rejected[0].reasons
  ).toContain('target-metadata');
  expect(
    catalog.inspect({...request(), sourceMetadata: {...source, frameEpoch: 2011}}).rejected[0]
      .reasons
  ).toContain('source-metadata');
  expect(catalog.inspect({...request(), epoch: undefined}).rejected[0].reasons).toContain(
    'epoch-required'
  );
});
test('conservative cells snapshot, reject malformed model terms and unbounded dynamic frames', () => {
  const value = operation(),
    cells = value.coverage as number[][],
    catalog = new OperationCatalog([value]);
  cells[0][0] = 9;
  cells.length = 0;
  expect(catalog.select({...request(), area: [-5, 0, -3, 1]})).toBeDefined();
  for (const invalid of [
    {coverage: []},
    {coverage: [[-20, 0, 0, 1]]},
    {epochRange: null},
    {models: [{id: 'model', revision: '1', license: '', termsReference: 'terms'}]},
    {sourceMetadata: {...source, frameEpoch: Infinity}},
    {targetMetadata: {...target, frameKind: 'static'}}
  ])
    expect(
      () => new OperationCatalog([{...operation(), ...invalid} as CoordinateOperation<string>])
    ).toThrow();
});
test('metadata-bearing requests cannot fall back to unreviewed frame metadata', () => {
  const plain = {
    ...operation(),
    sourceMetadata: undefined,
    targetMetadata: undefined,
    epochRange: null
  };
  expect(new OperationCatalog([plain]).select(request())).toBeUndefined();
});
test('dateline cells cover both seam spellings and reject a gap', () => {
  const value = {
    ...operation(),
    area: [170, -10, -170, 10] as const,
    coverage: [
      [170, -10, 180, 10],
      [-180, -10, -170, 10]
    ] as const
  };
  const catalog = new OperationCatalog([value]);
  for (const longitude of [-180, 180, 175, -175])
    expect(catalog.select({...request(), area: [longitude, 0, longitude, 0]})).toBeDefined();
  expect(catalog.select({...request(), area: [175, 0, -175, 1]})).toBeUndefined(); // spans cells; conservative single-cell containment
});
