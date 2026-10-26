// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {HingeTree, type HingePanel} from '@math.gl/geometry';

// Six unit squares in a cross-shaped net. These coordinates and hinge axes are
// derived directly from a unit cube, independently of any external demo assets.
export const corners = [
  [-0.5, -0.5, 0],
  [0.5, -0.5, 0],
  [0.5, 0.5, 0],
  [-0.5, 0.5, 0]
];
export const panels: HingePanel[] = [
  {parent: -1},
  {
    parent: 0,
    pivot: [0, 0.5, 0],
    axis: [1, 0, 0],
    restTransform: new Matrix4().translate([0, 1, 0])
  },
  {
    parent: 0,
    pivot: [0, -0.5, 0],
    axis: [-1, 0, 0],
    restTransform: new Matrix4().translate([0, -1, 0])
  },
  {
    parent: 0,
    pivot: [0.5, 0, 0],
    axis: [0, -1, 0],
    restTransform: new Matrix4().translate([1, 0, 0])
  },
  {
    parent: 0,
    pivot: [-0.5, 0, 0],
    axis: [0, 1, 0],
    restTransform: new Matrix4().translate([-1, 0, 0])
  },
  {
    parent: 1,
    pivot: [0, 0.5, 0],
    axis: [1, 0, 0],
    restTransform: new Matrix4().translate([0, 1, 0])
  }
];
export const tree = new HingeTree(panels);
