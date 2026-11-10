// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {MapEngine, type MapDescription} from '@math.gl/geospatial/maps';
import {albersUsaMapPreset, h3MapPreset} from '@math.gl/geospatial/maps/presets';
import {mapGeometry} from '@math.gl/geospatial/maps/geometry';
import {prepareMapSurface} from '@math.gl/geospatial/maps/surfaces';
import {mapTransitions} from '@math.gl/geospatial/maps/transitions';
const description: MapDescription = {version: 1, id: 'usa', definition: {type: 'albers-usa'}};
const ring = [
  [-120, 30],
  [-110, 30],
  [-115, 40]
] as const;
test('presets and optional operations are local to each engine', () => {
  const rich = new MapEngine(description, {
    presets: [albersUsaMapPreset],
    geometry: mapGeometry,
    transitions: mapTransitions
  });
  expect(rich.projectPolygon([ring]).length).toBeGreaterThan(0);
  const points = new MapEngine(description, {presets: [albersUsaMapPreset]});
  expect(points.projectPoint([-122, 47])).toEqual(rich.projectPoint([-122, 47]));
  expect(prepareMapSurface(points, {maxAngularStep: 5}).vertexCount).toBeGreaterThan(0);
  expect(() => points.projectPolygon([ring])).toThrow(/geometry/);
  expect(() => points.prepareFeatures([])).toThrow(/geometry/);
  expect(() => points.createTransitionTo(rich)).toThrow(/transition/);
  expect(() => new MapEngine(description, {presets: [h3MapPreset]})).toThrow(/Missing map preset/);
  expect(() => new MapEngine(description, {presets: []})).toThrow(/Missing map preset/);
});
test('prepared descriptions require explicit bindings in the receiving context', () => {
  const map = new MapEngine(description, {presets: [albersUsaMapPreset]});
  const prepared = structuredClone(map.toPrepared());
  expect(() => MapEngine.fromPrepared(prepared, {presets: []})).toThrow(/Missing map preset/);
  const restored = MapEngine.fromPrepared(prepared, {presets: [albersUsaMapPreset]});
  expect(restored.projectPoint([-122, 47])).toEqual(map.projectPoint([-122, 47]));
  expect(() => restored.projectPolygon([ring])).toThrow(/geometry/);
});
