// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo, useState} from 'react';
import {
  getGeographicTileRanges,
  getGeographicTileBounds,
  splitGlobeBounds
} from '@math.gl/geospatial';
import '../shared/query-example.css';
import './styles.css';

export default function Example() {
  const [longitude, setLongitude] = useState(170);
  const [latitude, setLatitude] = useState(20);
  const [level, setLevel] = useState(3);
  const wrap = x => ((x + 180 + 360) % 360) - 180;
  const bounds = [
    wrap(longitude - 30),
    Math.max(-90, latitude - 20),
    wrap(longitude + 30),
    Math.min(90, latitude + 20)
  ];
  const ranges = getGeographicTileRanges(bounds, level);
  const tiles = useMemo(() => {
    const result = [];
    for (let y = 0; y < 2 ** level; y++)
      for (let x = 0; x < 2 ** level; x++) {
        const [w, s, e, n] = getGeographicTileBounds({x, y, level});
        result.push({x, y, w, s, e, n});
      }
    return result;
  }, [level]);
  const count = ranges.reduce((sum, r) => sum + (r.maxX - r.minX + 1) * (r.maxY - r.minY + 1), 0);
  return (
    <div className="query-example geographic-example">
      <svg
        viewBox="-190 -105 380 210"
        role="img"
        aria-label="Longitude latitude tile grid. Cyan tiles overlap the pink query region."
      >
        <defs>
          <radialGradient id="tile-ocean">
            <stop stopColor="#183b56" />
            <stop offset="1" stopColor="#071321" />
          </radialGradient>
        </defs>
        <rect x="-180" y="-90" width="360" height="180" fill="url(#tile-ocean)" />
        {tiles.map(t => {
          const hit = ranges.some(
            r => t.x >= r.minX && t.x <= r.maxX && t.y >= r.minY && t.y <= r.maxY
          );
          return (
            <rect
              key={`${t.x}/${t.y}`}
              x={t.w}
              y={-t.n}
              width={t.e - t.w}
              height={t.n - t.s}
              fill={hit ? '#4bd8ed55' : 'transparent'}
              stroke={hit ? '#65e9ff' : '#31536b'}
              strokeWidth="0.4"
            />
          );
        })}
        {splitGlobeBounds(bounds).map(([w, s, e, n], i) => (
          <rect
            key={i}
            x={w}
            y={-n}
            width={e - w}
            height={n - s}
            fill="#ff73bd22"
            stroke="#ff73bd"
            strokeWidth="1"
          />
        ))}
        <text x="-180" y="100">
          180°W
        </text>
        <text x="-10" y="100">
          0°
        </text>
        <text x="156" y="100">
          180°E
        </text>
        <text x="-180" y="-95">
          90°N · equal-angle grid
        </text>
      </svg>
      <details>
        <summary>Dateline tile explorer</summary>
        <div className="query-controls">
          <p>
            Move the pink region across the dateline. Cyan marks candidate tiles; compact ranges
            split at the seam.
          </p>
          <label>
            Longitude {longitude}°
            <input
              type="range"
              min="-180"
              max="180"
              value={longitude}
              onChange={e => setLongitude(Number(e.target.value))}
            />
          </label>
          <label>
            Latitude {latitude}°
            <input
              type="range"
              min="-90"
              max="90"
              value={latitude}
              onChange={e => setLatitude(Number(e.target.value))}
            />
          </label>
          <label>
            Level {level}
            <input
              type="range"
              min="0"
              max="5"
              value={level}
              onChange={e => setLevel(Number(e.target.value))}
            />
          </label>
          <pre>{JSON.stringify(ranges, null, 2)}</pre>
          <p>
            This geographic grid uses equal longitude/latitude steps, rather than Mercator
            projection.
          </p>
        </div>
      </details>
      <p className="query-caption" role="status">
        {count} candidate tiles · {ranges.length} compact ranges · {2 ** level} × {2 ** level} world
        grid
      </p>
    </div>
  );
}
