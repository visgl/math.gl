// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  createTerrainCutoutSkirts,
  createTerrainMesh,
  HeightField,
  splitTerrainMesh
} from '@math.gl/geospatial/terrain';
import TerrainControls from './terrain-controls';

const mesh = createTerrainMesh(
  new HeightField({
    width: 9,
    height: 9,
    heights: Float64Array.from({length: 81}, (_, i) => {
      const x = i % 9;
      const y = Math.floor(i / 9);
      return 2.2 * Math.exp(-((x - 4) ** 2 + (y - 5) ** 2) / 9) + 0.12 * y;
    })
  }),
  {origin: [0, 0, 0]}
);
const rings = {
  Rectangle: [
    [2.2, 1.7],
    [6.4, 1.7],
    [6.4, 5.9],
    [2.2, 5.9]
  ],
  Oblique: [
    [1.37, 3.13],
    [4.23, 1.12],
    [6.72, 3.38],
    [4.83, 6.67],
    [2.06, 5.82]
  ]
};

/** Project a local Cartesian vertex into the lab's oblique view. */
function project(positions, index) {
  const [x, y, z] = positions.subarray(index * 3, index * 3 + 3);
  return [260 + 27 * (x - y), 120 + 13 * (x + y) - 32 * z, 32 * (x + y) + 26 * z];
}

/** Draw projected triangles in depth order, culling back-facing walls. */
function faces(piece, showWall, patch) {
  const mesh = showWall && piece.skirt ? piece.skirt : piece.surface;
  const topTriangles = piece.surface.indices.length / 3;
  const result = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.subarray(i, i + 3), id =>
      project(mesh.positions, id)
    );
    const wall = i / 3 >= topTriangles;
    const facing = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (wall && facing <= 0) continue;
    result.push({
      key: (patch ? 'patch' : 'remainder') + i,
      depth: a[2] + b[2] + c[2],
      points: [a, b, c].map(p => p.slice(0, 2).join(',')).join(' '),
      color: wall ? (patch ? '#82532e' : '#533d2d') : patch ? '#e6ac62' : '#6c9d84'
    });
  }
  return result;
}

/** Inspect the shared terrain cut and the two differently oriented walls. */
export default function CutoutLab({controlsRoot}) {
  const [shape, setShape] = useState('Rectangle');
  const [lift, setLift] = useState(2);
  const [patchWall, setPatchWall] = useState(true);
  const [remainderWall, setRemainderWall] = useState(true);
  const [edges, setEdges] = useState(true);
  const cut = useMemo(() => splitTerrainMesh(mesh, rings[shape]), [shape]);
  const pieces = useMemo(
    () => createTerrainCutoutSkirts(cut, {lift, patch: {baseZ: -1}, remainder: {baseZ: -1}}),
    [cut, lift]
  );
  const triangles = [
    ...faces(pieces.patch, lift !== 0 && patchWall, true),
    ...faces(pieces.remainder, lift !== 0 && remainderWall, false)
  ].sort((a, b) => a.depth - b.depth);
  return (
    <>
      <TerrainControls target={controlsRoot}>
        <label>
          Cut shape
          <select value={shape} onChange={event => setShape(event.target.value)}>
            {Object.keys(rings).map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Patch lift{' '}
          <input
            type="range"
            min="0"
            max="4"
            step="0.1"
            value={lift}
            onChange={event => setLift(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={patchWall}
            onChange={event => setPatchWall(event.target.checked)}
          />{' '}
          Patch skirt
        </label>
        <label>
          <input
            type="checkbox"
            checked={remainderWall}
            onChange={event => setRemainderWall(event.target.checked)}
          />{' '}
          Remainder skirt
        </label>
        <label>
          <input
            type="checkbox"
            checked={edges}
            onChange={event => setEdges(event.target.checked)}
          />{' '}
          Cut edges
        </label>
      </TerrainControls>
      <svg
        role="img"
        aria-label="Terrain cutout with paired skirts"
        viewBox="0 0 520 380"
        style={{width: '100%', maxHeight: 520}}
      >
        {triangles.map(t => (
          <polygon
            key={t.key}
            points={t.points}
            fill={t.color}
            stroke={t.color}
            strokeWidth="0.7"
          />
        ))}
        {edges &&
          [pieces.remainder.surface, pieces.patch.surface].map((piece, side) =>
            Array.from({length: piece.cutEdges.length / 2}, (_, i) => {
              const [x1, y1] = project(piece.positions, piece.cutEdges[i * 2]);
              const [x2, y2] = project(piece.positions, piece.cutEdges[i * 2 + 1]);
              return (
                <line
                  key={side + ':' + i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={side ? '#ffe2a8' : '#d3f4e6'}
                  strokeWidth="1.4"
                />
              );
            })
          )}
      </svg>
      <p>
        {cut.patch.cutEdges.length / 2} paired cut edges · lift {lift.toFixed(1)} m
      </p>
    </>
  );
}
