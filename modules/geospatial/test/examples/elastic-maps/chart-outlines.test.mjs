// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {groupChartOutlines} from '../../../../../examples/common/group-chart-outlines.js';

test('chart coverage groups holes with their exterior and fills separate components', () => {
  const exterior = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const hole = [[2, 2], [2, 8], [8, 8], [8, 2]];
  const island = [[3, 3], [5, 3], [5, 5], [3, 5]];
  const disjoint = [[11, 0], [11, 1], [12, 1], [12, 0]];
  assert.deepEqual(groupChartOutlines([hole, disjoint, island, exterior]), [
    [exterior, hole],
    [island],
    [disjoint]
  ]);
});
