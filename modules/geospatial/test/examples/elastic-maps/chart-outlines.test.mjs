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

test('chart rings sharing a boundary vertex retain their separate fills', () => {
  const outer = [[0, 0], [4, 0], [4, 4], [0, 4]];
  const neighbor = [[0, 2], [-1, 3], [-1, 1]];
  const hole = [[0, 2], [1, 3], [1, 1]];
  assert.deepEqual(groupChartOutlines([outer, neighbor, hole]), [[outer, hole], [neighbor]]);
});
