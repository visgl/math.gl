// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import TerrainControls from './terrain-controls';
import SeamExplorer from './seam-explorer';
import {createTileTransitionScene} from './tile-transition-model';

export default function TileTransitions({controlsRoot}) {
  const [ratio, setRatio] = useState(2),
    [surface, setSurface] = useState('curved'),
    [factor, setFactor] = useState(0.5);
  const [independent, setIndependent] = useState(false),
    [coarseFactor, setCoarseFactor] = useState(0),
    [fineFactor, setFineFactor] = useState(1);
  const [coordinate, setCoordinate] = useState(true),
    [resident, setResident] = useState(true),
    [missing, setMissing] = useState(false);
  const [method, setMethod] = useState('horn'),
    [sectionY, setSectionY] = useState(3),
    [arrows, setArrows] = useState(true);
  const scene = useMemo(
    () =>
      createTileTransitionScene({
        ratio,
        surface,
        factor,
        independent,
        coarseFactor,
        fineFactor,
        coordinate,
        resident,
        missing,
        method,
        sectionY
      }),
    [
      ratio,
      surface,
      factor,
      independent,
      coarseFactor,
      fineFactor,
      coordinate,
      resident,
      missing,
      method,
      sectionY
    ]
  );
  const slider = (label, value, set, min = 0, max = 1, step = 0.05) => (
    <label key={label}>
      {label}: {value.toFixed(2)}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => set(Number(e.target.value))}
      />
    </label>
  );
  const toggle = (label, value, set) => (
    <label key={label}>
      <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} />
      {label}
    </label>
  );
  const point = (x, y) => `${x},${8 - y}`;
  const profile = (key, color, width, dash) =>
    scene.section.flatMap(tile => {
      const paths = [];
      let run = [];
      for (const sample of [...tile.samples, {x: 0, [key]: undefined}]) {
        if (sample[key] !== undefined) run.push(point(sample.x, sample[key]));
        else if (run.length) {
          paths.push(run);
          run = [];
        }
      }
      return paths.map((points, i) => (
        <polyline
          key={`${key}/${tile.column}/${i}`}
          data-transition-profile={key}
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dash}
        />
      ));
    });
  return (
    <section aria-label="Terrain transitions and seam derivatives">
      <TerrainControls target={controlsRoot}>
        <label>
          Resolution ratio
          <select
            aria-label="Resolution ratio"
            value={ratio}
            onChange={e => setRatio(Number(e.target.value))}
          >
            <option value={2}>2:1</option>
            <option value={4}>4:1</option>
          </select>
        </label>
        <label>
          Surface
          <select aria-label="Surface" value={surface} onChange={e => setSurface(e.target.value)}>
            <option value="plane">Plane</option>
            <option value="curved">Curved</option>
          </select>
        </label>
        {toggle('Independent morph factors', independent, setIndependent)}
        {independent ? (
          <>
            {slider('Coarse morph factor', coarseFactor, setCoarseFactor)}
            {slider('Fine morph factor', fineFactor, setFineFactor)}
          </>
        ) : (
          slider('Morph factor', factor, setFactor)
        )}
        {toggle('Coordinate shared boundary', coordinate, setCoordinate)}
        <label>
          Derivative method
          <select
            aria-label="Derivative method"
            value={method}
            onChange={e => setMethod(e.target.value)}
          >
            <option value="horn">Horn</option>
            <option value="zevenbergen-thorne">Zevenbergen–Thorne</option>
          </select>
        </label>
        {slider('Cross-section row', sectionY, setSectionY, 0, 8, 1)}
        {toggle('Show derivative arrows', arrows, setArrows)}
        {toggle('Coarse neighbor resident', resident, setResident)}
        {toggle('Missing coarse sample', missing, setMissing)}
      </TerrainControls>
      <div className="terrain-transition-comparison">
        <figure className="terrain-mesh-result">
          <figcaption>Surface & seam derivatives</figcaption>
          <svg
            viewBox="-8 -1 16 10"
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label="Shared terrain surface and derivative arrows"
          >
            {!resident && <rect x="-8" y="0" width="8" height="8" fill="#273541" />}
            {scene.tiles.flatMap(tile =>
              Array.from({length: tile.mesh.indices.length / 3}, (_, i) => {
                const ids = [...tile.mesh.indices.slice(i * 3, i * 3 + 3)];
                const height =
                  ids.reduce(
                    (sum, id) =>
                      sum +
                      tile.field.getHeight(
                        tile.mesh.gridCoordinates[id * 2],
                        tile.mesh.gridCoordinates[id * 2 + 1]
                      ),
                    0
                  ) / 3;
                return (
                  <polygon
                    key={`${tile.column}/${i}`}
                    points={ids
                      .map(id =>
                        point(
                          tile.column + tile.mesh.gridCoordinates[id * 2] * tile.spacing,
                          tile.mesh.gridCoordinates[id * 2 + 1] * tile.spacing
                        )
                      )
                      .join(' ')}
                    fill={`hsl(${220 - (height + 1) * 20},55%,45%)`}
                    stroke="#b7ecff"
                    strokeWidth="0.012"
                  />
                );
              })
            )}
            <line x1="0" y1="0" x2="0" y2="8" stroke="#ffcb70" strokeWidth="0.05" />
            <line
              x1="-8"
              y1={8 - sectionY}
              x2="8"
              y2={8 - sectionY}
              stroke="#fff"
              strokeWidth="0.035"
              strokeDasharray="0.15 0.15"
            />
            {arrows &&
              scene.gradients.flatMap(tile =>
                tile.nodes.map((node, i) => {
                  const g = node.gradient,
                    length = g ? Math.hypot(g.x, g.y) : 0,
                    scale = 2 / Math.max(1, length * 2);
                  return (
                    <g key={`${tile.column}/${i}`}>
                      <circle
                        cx={node.x}
                        cy={8 - node.y}
                        r="0.045"
                        fill={g ? '#e6f4ff' : '#e97574'}
                      />
                      {g && (
                        <line
                          data-derivative-arrow=""
                          x1={node.x}
                          y1={8 - node.y}
                          x2={node.x + g.x * scale}
                          y2={8 - node.y - g.y * scale}
                          stroke="#ffcb70"
                          strokeWidth="0.035"
                        />
                      )}
                    </g>
                  );
                })
              )}
          </svg>
          <p>
            <span style={{color: '#ffcb70'}}>Shared boundary</span> ·{' '}
            <span style={{color: '#fff'}}>Cross-section row</span>
          </p>
          <SeamExplorer scene={scene} />
        </figure>
        <figure className="terrain-mesh-result">
          <figcaption>Morph cross section</figcaption>
          <svg
            viewBox="-8 -1 16 10"
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label="Shared terrain morph cross section"
          >
            <line x1="-8" y1="8" x2="8" y2="8" stroke="#426277" strokeWidth="0.035" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="#426277"
              strokeWidth="0.035"
              strokeDasharray="0.15 0.15"
            />
            {profile('fine', '#687587', 0.12)}
            {profile('raw', '#63cde2', 0.07, '0.12 0.08')}
            {profile('displayed', '#ffcb70', 0.05)}
          </svg>
          <p>
            <span style={{color: '#91a9be'}}>Fine reference</span> ·{' '}
            <span style={{color: '#63cde2'}}>Independent morphs</span> ·{' '}
            <span style={{color: '#ffcb70'}}>Displayed surface</span>
          </p>
          <p data-testid="transition-result">
            Shared height gap: {scene.gap === null ? 'unavailable' : scene.gap.toFixed(6)}
            <br />
            Uncoordinated gap: {scene.rawGap === null ? 'unavailable' : scene.rawGap.toFixed(6)}
            <br />
            Maximum adjustment: {scene.adjustment.toFixed(3)}
          </p>
        </figure>
        <p className="terrain-view-description">
          Explore how terrain resolution and morph factors affect shared heights and slopes.
        </p>
      </div>
    </section>
  );
}
