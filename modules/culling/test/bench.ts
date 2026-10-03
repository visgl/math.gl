// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms.
// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4} from '@math.gl/core';
import {BoundingSphere, Plane} from '@math.gl/culling';

const plane = new Plane();
const boundingSphere = new BoundingSphere();
const transform = new Matrix4();

// eslint-disable-next-line
export function cullingBench(suite, addReferenceBenchmarks) {
  suite
    .group('BoundingSphere')
    .add('BoundingSphere#new()', () => new BoundingSphere())
    .add('BoundingSphere#transform', () => boundingSphere.transform(transform))

    .group('Plane')
    .add('Plane#new()', () => new Plane())
    .add('Plane#transform', () => plane.transform(transform));

  return suite;
}
