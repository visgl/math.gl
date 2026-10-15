// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {linearUnits} from '@math.gl/crs';

test('linear unit names and conversion factors share one definition', () => {
  expect(linearUnits.m).toEqual({name: 'meters', metersPerUnit: 1});
  expect(linearUnits.ft).toEqual({name: 'feet', metersPerUnit: 0.3048});
  expect(linearUnits['us-ft']).toEqual({name: 'us-survey-feet', metersPerUnit: 1200 / 3937});
  for (const unit of Object.values(linearUnits)) {
    expect(typeof unit.name).toBe('string');
    expect(unit.metersPerUnit).toBeGreaterThan(0);
  }
});
