// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { Deck, OrbitView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { TextLayer } from '@deck.gl/layers';
import { Geometry } from '@luma.gl/engine';
import { Vector3 } from '@math.gl/core';
import { interpolateField } from './data.js';
const a = new Vector3(),
  b = new Vector3(),
  n = new Vector3();
export function terrainColor(elevation) {
  const low = [0.25, 0.34, 0.26],
    high = [0.72, 0.69, 0.61];
  const t = Math.max(0, Math.min(1, (elevation - 400) / 2400));
  return low.map((c, i) => c * (1 - t) + high[i] * t);
}
export function makeSurface(model, age, exaggeration, showIce, ghost) {
  const { manifest: m, bed, ice, count } = model;
  const thickness = interpolateField(ice, count, m.ages, age);
  const positions = new Float32Array(count * 3),
    colors = new Float32Array(count * 3),
    normals = new Float32Array(count * 3);
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const i = y * m.width + x,
        offset = i * 3,
        h = showIce ? thickness[i] : 0;
      positions[offset] = (x - (m.width - 1) / 2) * m.spacingKm;
      positions[offset + 1] = (y - (m.height - 1) / 2) * m.spacingKm;
      positions[offset + 2] = ((bed[i] + h) / 1000) * exaggeration;
      const land = terrainColor(bed[i]);
      const cover = Math.min(1, h / 65);
      const blend = cover * (ghost ? 0.78 : 1);
      const luminance = land[0] * 0.2126 + land[1] * 0.7152 + land[2] * 0.0722;
      for (let c = 0; c < 3; c++) land[c] = land[c] * (1 - cover * 0.9) + luminance * cover * 0.9;
      const shade = Math.min(1, h / 800);
      const snow = [0.61 + 0.32 * shade, 0.79 + 0.17 * shade, 0.87 + 0.12 * shade];
      for (let c = 0; c < 3; c++) colors[offset + c] = land[c] * (1 - blend) + snow[c] * blend;
    }
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++) {
      const i = y * m.width + x;
      const left = (y * m.width + Math.max(0, x - 1)) * 3,
        right = (y * m.width + Math.min(m.width - 1, x + 1)) * 3;
      const down = (Math.max(0, y - 1) * m.width + x) * 3,
        up = (Math.min(m.height - 1, y + 1) * m.width + x) * 3;
      a.set(positions[right] - positions[left], 0, positions[right + 2] - positions[left + 2]);
      b.set(0, positions[up + 1] - positions[down + 1], positions[up + 2] - positions[down + 2]);
      n.copy(a).cross(b).normalize();
      normals.set(n, i * 3);
    }
  const indices = new Uint32Array((m.width - 1) * (m.height - 1) * 6);
  let k = 0;
  for (let y = 0; y < m.height - 1; y++)
    for (let x = 0; x < m.width - 1; x++) {
      const i = y * m.width + x;
      indices.set([i, i + 1, i + m.width, i + 1, i + m.width + 1, i + m.width], k);
      k += 6;
    }
  return new Geometry({
    attributes: {
      positions: { size: 3, value: positions },
      normals: { size: 3, value: normals },
      colors: { size: 3, value: colors }
    },
    indices
  });
}
export function createScene(canvas, onError) {
  const deck = new Deck({
    canvas,
    views: new OrbitView({ orbitAxis: 'Z' }),
    controller: true,
    initialViewState: {
      target: [0, 0, 10],
      rotationX: 35,
      rotationOrbit: 0,
      zoom: -0.4,
      minZoom: -2,
      maxZoom: 5
    },
    getCursor: () => 'grab',
    onError
  });
  return {
    render(model, options) {
      const mesh = makeSurface(
        model,
        options.age,
        options.exaggeration,
        options.showIce,
        options.ghost
      );
      const labels = model.manifest.places.map((place) => ({
        ...place,
        position: [place.x, place.y, (place.elevation / 1000) * options.exaggeration + 4]
      }));
      deck.setProps({
        layers: [
          new SimpleMeshLayer({
            id: 'alpine-surface',
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            data: [{}],
            mesh,
            getPosition: [0, 0, 0],
            getColor: [255, 255, 255],
            material: { ambient: 0.45, diffuse: 0.8, shininess: 25, specularColor: [40, 55, 65] }
          }),
          options.iceNames &&
            new TextLayer({
              id: 'alpine-ice-age-name',
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              data: [
                {
                  position: [0, 0, 35],
                  name:
                    options.age > 115
                      ? 'LAST INTERGLACIAL'
                      : options.age >= 11.7
                        ? 'WÜRM'
                        : 'HOLOCENE'
                }
              ],
              getPosition: (d) => d.position,
              getText: (d) => d.name,
              getSize: 24,
              getColor: [241, 248, 252],
              fontFamily: 'system-ui',
              fontWeight: 600,
              characterSet: 'auto',
              fontSettings: { sdf: true },
              outlineWidth: 0.15,
              outlineColor: [13, 32, 43, 220],
              billboard: true,
              parameters: { depthCompare: 'always', depthWriteEnabled: false }
            }),
          options.labels &&
            new TextLayer({
              id: 'alpine-places',
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              data: labels,
              getPosition: (d) => d.position,
              getText: (d) => d.name,
              getSize: 12,
              getColor: [243, 247, 248],
              fontFamily: 'system-ui',
              characterSet: 'auto',
              fontSettings: { sdf: true },
              parameters: { depthCompare: 'always', depthWriteEnabled: false },
              outlineWidth: 0.15,
              outlineColor: [10, 21, 30, 230],
              billboard: true
            })
        ]
      });
    },
    view(map) {
      deck.setProps({
        controller: { dragRotate: !map, dragPan: true },
        initialViewState: {
          target: [0, 0, 10],
          rotationX: map ? 90 : 35,
          rotationOrbit: 0,
          zoom: -0.4,
          minZoom: -2,
          maxZoom: 5
        }
      });
    },
    finalize() {
      deck.finalize();
    }
  };
}
