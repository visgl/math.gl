// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useState} from 'react';
import {
  createTerrainMesh,
  GeographicHeightField,
  HeightField,
  measureGeographicTerrainSeam,
  selectTerrainLod,
  stitchTerrainLodCut
} from '@math.gl/geospatial/terrain';
import TerrainControls from './terrain-controls';

function makeMesh(x, y, step) {
  return createTerrainMesh(
    new HeightField({
      width: 3,
      height: 3,
      origin: [x, y],
      heights: new Float64Array(9),
      columnStep: [step, 0],
      rowStep: [0, step]
    })
  );
}
const coarse = makeMesh(0, 0, 1);
const fine = [makeMesh(2, 0, 0.5), makeMesh(2, 1, 0.5), makeMesh(3, 0, 0.5), makeMesh(3, 1, 0.5)];
const tiles = [
  {id: 'west', min: [0, 0, 0], max: [2, 2, 0], geometricError: 0, resident: true},
  {id: 'east', min: [2, 0, 0], max: [4, 2, 0], geometricError: 0.2, resident: true}
];
const seams = [
  {a: 0, b: 1, edgeA: 'maxColumn', edgeB: 'minColumn', options: {rangeA: [0, 0.5]}},
  {a: 0, b: 2, edgeA: 'maxColumn', edgeB: 'minColumn', options: {rangeA: [0.5, 1]}}
];

export default function GeographicLod({controlsRoot}) {
  const [distance, setDistance] = useState(16);
  const [polar, setPolar] = useState(false);
  const [resident, setResident] = useState(true);
  const [previous, setPrevious] = useState(new Set());
  const latitude = polar ? 88.5 : 0.5;
  const bounds = (west, east) => [west, latitude - 0.5, east, latitude + 0.5];
  const a = new GeographicHeightField({
    bounds: bounds(179, 180),
    width: 2,
    height: 2,
    heights: Float64Array.of(0, 100, 0, 100)
  });
  const b = new GeographicHeightField({
    bounds: bounds(-180, -179),
    width: 3,
    height: 2,
    heights: Float64Array.of(100, 200, 300, 100, 200, 300)
  });
  const [seam] = measureGeographicTerrainSeam(a, resident ? b : null, [[180, latitude]]);
  const [pole] = measureGeographicTerrainSeam(a, b, [[180, 90]]);
  const cut = (d, available, history) =>
    selectTerrainLod(
      [
        tiles[0],
        {
          ...tiles[1],
          children: fine.map((mesh, i) => {
            const [x, y] = mesh.origin;
            return {
              id: `east-${i}`,
              min: [x, y, 0],
              max: [x + 1, y + 1, 0],
              geometricError: 0,
              resident: available || i !== 0
            };
          })
        }
      ],
      {
        position: [3, 1, d],
        verticalFov: Math.PI / 3,
        viewportHeight: 600,
        targetPixels: 10,
        previouslyRefined: history
      }
    );
  const selection = cut(distance, resident, previous);
  const refined = selection.refined.has('east');
  const meshes = refined
    ? stitchTerrainLodCut([coarse, ...fine], seams)
    : [coarse, makeMesh(2, 0, 1)];
  const count = meshes.reduce((sum, mesh) => sum + mesh.indices.length / 3, 0);
  return (
    <section aria-label="Geographic seam and sparse terrain LOD">
      <TerrainControls target={controlsRoot}>
        <label>
          Camera height: {distance} m
          <input
            aria-label="Camera height"
            type="range"
            min="1"
            max="40"
            value={distance}
            onChange={e => {
              setPrevious(selection.refined);
              setDistance(Number(e.target.value));
            }}
          />
        </label>
        <label>
          <input type="checkbox" checked={polar} onChange={e => setPolar(e.target.checked)} />{' '}
          Near-pole seam
        </label>
        <label>
          <input
            type="checkbox"
            checked={resident}
            onChange={e => {
              setPrevious(selection.refined);
              setResident(e.target.checked);
            }}
          />{' '}
          Neighbor and fine tile resident
        </label>
      </TerrainControls>
      <p role="status">
        Antimeridian at {latitude}°:{' '}
        {seam.heightJump === null
          ? 'neighbor unavailable'
          : `height jump ${seam.heightJump.toFixed(2)} m, normal jump ${((seam.normalAngle * 180) / Math.PI).toFixed(3)}°`}
        .{pole.normalAngle === null && ' Exact pole derivatives are outside the domain.'}
      </p>
      <p role="status">
        {refined ? 'Fine east tiles with a sparse west edge' : 'Coarse east tile'} · {count}{' '}
        triangles
        {refined && ' · 64 triangles if both sides use the fine spacing'}.
        {selection.selected.map(({tile, pixels}) => ` ${tile.id}: ${pixels.toFixed(1)} px.`)}
      </p>
      <svg viewBox="-0.05 -0.05 4.1 2.1" role="img" aria-label="Selected terrain mesh wireframe">
        {meshes.flatMap((mesh, t) =>
          Array.from({length: mesh.indices.length / 3}, (_, i) => (
            <polygon
              key={`${t}/${i}`}
              points={Array.from(
                mesh.indices.slice(i * 3, i * 3 + 3),
                id =>
                  `${mesh.positions[id * 3] + mesh.origin[0]},${2 - mesh.positions[id * 3 + 1] - mesh.origin[1]}`
              ).join(' ')}
              stroke={t ? '#94d4fc' : '#ffcf70'}
              strokeWidth="0.012"
              fill="none"
            />
          ))
        )}
      </svg>
    </section>
  );
}
