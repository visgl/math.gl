// math.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Derived from Cesium. See the repository LICENSE for upstream attribution and Apache-2.0 terms.

// This file is derived from the Cesium library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Vector3} from '@math.gl/core';

/* Represents a ray that extends infinitely from the provided origin in the provided direction. */
export class Ray {
  origin: Vector3;
  direction: Vector3;

  /**
   * Creates a new ray that extends infinitely from the provided origin in the provided direction.
   *
   * @param [origin=Vector3] The origin of the ray.
   * @param [direction=Vector3] The direction of the ray.
   */
  constructor(origin?: Vector3, direction?: Vector3) {
    if (origin) origin = origin.clone();
    else origin = new Vector3();

    if (direction) direction = direction.clone().normalize();
    else direction = new Vector3();

    this.origin = origin;
    this.direction = direction;
  }
}
