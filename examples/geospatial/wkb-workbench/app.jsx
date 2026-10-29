// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import ExamplePanel from '../../common/example-panel';
import {FIXTURES, inspectGeometry, geometryParts} from './model';
import './styles.css';

function Preview({result}) {
  const bounds = result.statistics.bounds;
  if (!bounds) return <p className="wkb-empty">Empty geometry · no finite XY bounds</p>;
  const width = Math.max(bounds.xmax - bounds.xmin, 1),
    height = Math.max(bounds.ymax - bounds.ymin, 1);
  const scale = Math.min(520 / width, 320 / height);
  const point = ([x, y]) => [
    300 + (x - (bounds.xmin + bounds.xmax) / 2) * scale,
    190 - (y - (bounds.ymin + bounds.ymax) / 2) * scale
  ];
  return (
    <svg viewBox="0 0 600 380" role="img" aria-label="Geometry preview in XY coordinates">
      {geometryParts(result.geometry).map((part, i) => {
        if (part.kind === 'point')
          return part.coordinates
            .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
            .map((p, j) => (
              <circle key={`${i}-${j}`} cx={point(p)[0]} cy={point(p)[1]} r="5" fill="#ffd080" />
            ));
        if (part.kind === 'line')
          return (
            <polyline
              key={i}
              points={part.coordinates.map(p => point(p).join(',')).join(' ')}
              fill="none"
              stroke="#ffd080"
              strokeWidth="3"
            />
          );
        const path = part.coordinates
          .filter(ring => ring.length)
          .map(ring => 'M' + ring.map(p => point(p).join(',')).join('L') + 'Z')
          .join('');
        return (
          <path
            key={i}
            d={path}
            fill="#3cabc477"
            fillRule="evenodd"
            stroke="#72dcff"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
export default function WKBWorkbench() {
  const [mode, setMode] = useState('wkt');
  const [text, setText] = useState(FIXTURES['Polygon with hole'].text);
  const [fixture, setFixture] = useState('Polygon with hole');
  const result = useMemo(() => {
    try {
      return inspectGeometry(mode, text);
    } catch (error) {
      return {error: error.message};
    }
  }, [mode, text]);
  const load = name => {
    setFixture(name);
    setMode(FIXTURES[name].mode);
    setText(FIXTURES[name].text);
  };
  return (
    <div className="wkb-workbench">
      <main className="wkb-main">
        <h2>WKT ↔ WKB workbench</h2>
        <p>
          Edit text or hexadecimal bytes. Geometry is previewed in XY; Z and M remain visible in the
          coordinate table.
        </p>
        <label>
          Input format
          <select
            aria-label="Input format"
            value={mode}
            onChange={event => {
              setMode(event.target.value);
              setText(
                event.target.value === 'wkt'
                  ? FIXTURES['Polygon with hole'].text
                  : '0101000000000000000000f03f0000000000000040'
              );
            }}
          >
            <option value="wkt">WKT</option>
            <option value="hex">WKB hexadecimal</option>
          </select>
        </label>
        <label>
          Geometry input
          <textarea
            aria-label="Geometry input"
            spellCheck="false"
            value={text}
            onChange={event => setText(event.target.value)}
          />
        </label>
        {result.error ? (
          <p role="alert">{result.error}</p>
        ) : (
          <>
            <Preview result={result} />
            <label>
              Formatted WKT
              <textarea aria-label="Formatted WKT" readOnly value={result.wkt} />
            </label>
            <label>
              WKB bytes
              <textarea aria-label="WKB bytes" readOnly value={result.hex} />
            </label>
            <p>
              Header bytes:{' '}
              <code>
                {result.hex.split(' ').slice(0, result.statistics.header.byteLength).join(' ')}
              </code>{' '}
              · Remaining bytes contain the geometry body.
            </p>
            <h3>Coordinate visitor</h3>
            <p>First 100 coordinates, with offsets into the original byte buffer.</p>
            <div className="wkb-table">
              <table>
                <thead>
                  <tr>
                    {['Byte offset', 'X', 'Y', 'Z', 'M'].map(name => (
                      <th key={name}>{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.coordinates.slice(0, 100).map((coordinate, i) => (
                    <tr key={i}>
                      {['byteOffset', 'x', 'y', 'z', 'm'].map(key => (
                        <td key={key}>
                          {coordinate[key] === undefined ? '—' : String(coordinate[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
      <ExamplePanel title="Geometry codecs">
        <label>
          Fixture
          <select aria-label="Fixture" value={fixture} onChange={event => load(event.target.value)}>
            {Object.keys(FIXTURES).map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <button onClick={() => load(fixture)}>Reset fixture</button>
        {!result.error && (
          <div data-testid="wkb-statistics">
            <p>
              {result.statistics.header.geometryType} ·{' '}
              {result.statistics.header.dimension.toUpperCase()}
            </p>
            <p>
              {result.statistics.byteLength} bytes · {result.statistics.coordinateCount} coordinates
              · {result.statistics.ringCount} rings
            </p>
            <p>
              {result.statistics.header.dialect} ·{' '}
              {result.statistics.header.littleEndian ? 'Little endian' : 'Big endian'}
            </p>
            <p>SRID: {result.statistics.header.srid ?? 'not embedded'}</p>
            <pre>{JSON.stringify(result.statistics.bounds ?? {}, null, 2)}</pre>
          </div>
        )}
        <p>
          WKT input writes deterministic little-endian ISO WKB. Pasted WKB can also contain EWKB
          SRIDs or big-endian data. An SRID labels coordinates; this example does not reproject
          them.
        </p>
        <p>
          Input is limited to 100,000 characters and binary traversal to 10,000 declared elements
          and 32 nesting levels.
        </p>
      </ExamplePanel>
    </div>
  );
}
