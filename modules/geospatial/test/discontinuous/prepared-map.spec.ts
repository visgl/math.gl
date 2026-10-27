// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {MapEngine, type MapDefinition} from '../../src/discontinuous';

test('prepared maps retain sampled layouts, coordinates, inverse and hinge poses', () => {
  for (const definition of [
    {type: 'mercator'},
    {type: 'myriahedral', preset: 'sealine', columns: 12}
  ]) {
    let landCalls = 0;
    const map = new MapEngine(
      {version: 1, id: 'test', radius: 2, definition: definition as MapDefinition},
      {
        isLand: () => {
          landCalls++;
          return true;
        }
      }
    );
    const snapshot = map.toPrepared();
    const before = landCalls;
    const restored = MapEngine.fromPrepared(structuredClone(snapshot));
    expect(landCalls).toBe(before);
    expect(restored.getLayout()).toEqual(map.getLayout());
    expect(restored.capabilities).toEqual(map.capabilities);
    const point = map.projectPoint([23, 35])!;
    expect(restored.projectPoint([23, 35])).toEqual(point);
    expect(restored.unprojectPoint(point.position, point.regionId)).toEqual(
      map.unprojectPoint(point.position, point.regionId)
    );
    if (map.motion)
      for (const amount of [0, 0.4, 1])
        expect(
          restored
            .evaluate({type: 'hinge', amount})
            .projectPlacedPoint(point.position, point.regionId)
        ).toEqual(
          map.evaluate({type: 'hinge', amount}).projectPlacedPoint(point.position, point.regionId)
        );
  }
});
