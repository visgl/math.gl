// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  NormalGravity,
  type GravityVector,
  type NormalGravityOptions
} from '@math.gl/earth/normal-gravity';
const options: NormalGravityOptions = {
  semiMajorAxis: 2,
  flattening: 0,
  gravitationalParameter: 8,
  angularVelocity: 0
};
const gravity = new NormalGravity(options);
const xyz: GravityVector = gravity.evaluate(30, 40, 1).acceleration;
gravity.evaluateCartesian(...xyz);
gravity.surfaceGravity(30);
NormalGravity.WGS84().surfacePotential;
// @ts-expect-error Constants require mass and rotation, not radii alone.
new NormalGravity({semiMajorAxis: 2, flattening: 0});
