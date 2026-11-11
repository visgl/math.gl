// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {applyPanelTheme} from '@deck.gl-community/panels';
import {FIXTURES, inspectGeometry, geometryParts} from './model';
import './styles.css';

function Preview({result}) {
  const bounds = result.statistics.bounds;
  if (!bounds) return <p className="wkb-empty">Empty geometry · no finite XY bounds</p>;
  const width = bounds.xmax - bounds.xmin,
    height = bounds.ymax - bounds.ymin;
  const fitScale = Math.min(
    width > 0 ? 520 / width : Infinity,
    height > 0 ? 320 / height : Infinity
  );
  const scale = Number.isFinite(fitScale) ? fitScale : 1;
  const point = ([x, y]) => [
    300 + (x - (bounds.xmin / 2 + bounds.xmax / 2)) * scale,
    190 - (y - (bounds.ymin / 2 + bounds.ymax / 2)) * scale
  ];
  return (
    <svg viewBox="0 0 600 380" role="img" aria-label="Geometry preview in XY coordinates">
      {geometryParts(result.geometry).map((part, i) => {
        if (part.kind === 'point')
          return part.coordinates
            .filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
            .map((p, j) => (
              <circle
                key={`${i}-${j}`}
                cx={point(p)[0]}
                cy={point(p)[1]}
                r="5"
                fill="var(--panel-accent-color)"
              />
            ));
        if (part.kind === 'line')
          return (
            <polyline
              key={i}
              points={part.coordinates.map(p => point(p).join(',')).join(' ')}
              fill="none"
              stroke="var(--panel-accent-color)"
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
            fill="var(--menu-item-hover)"
            fillRule="evenodd"
            stroke="var(--panel-accent-color)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
export default function WKBWorkbench({style, theme = 'dark'}) {
  const root = useRef(null);
  const inputId = useId();
  const instructionsId = `${inputId}-instructions`;
  useLayoutEffect(() => {
    // Use the shared control palette throughout the app, without mounting an info panel.
    applyPanelTheme(root.current, {base: `sleek-${theme}`, variables: {}});
  }, [theme]);
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
  // Preserve the complete byte stream while marking the root header's hexadecimal prefix.
  const headerHexLength = result.error ? 0 : result.statistics.header.byteLength * 3 - 1;
  return (
    <div className="wkb-workbench" ref={root} style={{colorScheme: theme, ...style}}>
      <main className="wkb-main">
        <h2>WKT ↔ WKB workbench</h2>
        <p className="wkb-description">
          Inspect, convert, and preview geometry in WKT and WKB formats.
        </p>
        <div className="wkb-controls">
          <label>
            Fixture
            <select
              aria-label="Fixture"
              value={fixture}
              onChange={event => load(event.target.value)}
            >
              {Object.keys(FIXTURES).map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
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
          <button type="button" onClick={() => load(fixture)}>
            Reset fixture
          </button>
        </div>
        <div className="wkb-input">
          <label htmlFor={inputId}>Geometry input</label>
          <p className="wkb-help" id={instructionsId}>
            Enter WKT with matching coordinate dimensions in collections, or hexadecimal byte pairs
            with optional whitespace. WKB supports either byte order and EWKB SRIDs. Input is
            limited to 100,000 characters, 10,000 declared elements, and 32 nesting levels.
          </p>
          <textarea
            id={inputId}
            aria-describedby={instructionsId}
            aria-label="Geometry input"
            spellCheck="false"
            value={text}
            onChange={event => setText(event.target.value)}
          />
        </div>
        {result.error ? (
          <p role="alert">{result.error}</p>
        ) : (
          <>
            <Preview result={result} />
            <div className="wkb-results">
              <section
                className="wkb-card wkb-statistics"
                aria-label="Parsed geometry"
                data-testid="wkb-statistics"
              >
                <h3>Parsed geometry</h3>
                <div className="wkb-card-body">
                  <dl>
                    {[
                      ['Geometry', result.statistics.header.geometryType],
                      ['Dimensions', result.statistics.header.dimension.toUpperCase()],
                      ['Size', `${result.statistics.byteLength} bytes`],
                      ['Coordinates', result.statistics.coordinateCount],
                      ['Rings', result.statistics.ringCount],
                      ['Format', result.statistics.header.dialect],
                      [
                        'Byte order',
                        result.statistics.header.littleEndian ? 'Little endian' : 'Big endian'
                      ],
                      ['SRID', result.statistics.header.srid ?? 'Not embedded']
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="wkb-bounds">
                    <span>Bounds</span>
                    <pre>{JSON.stringify(result.statistics.bounds ?? {}, null, 2)}</pre>
                  </div>
                </div>
              </section>
              <section className="wkb-card">
                <h3>Formatted WKT</h3>
                <div className="wkb-card-body">
                  <p className="wkb-help">little-endian ISO WKB</p>
                  <div className="wkb-output" role="region" aria-label="Formatted WKT" tabIndex={0}>
                    {result.wkt}
                  </div>
                </div>
              </section>
              <section className="wkb-card">
                <h3>WKB bytes</h3>
                <div className="wkb-card-body">
                  <div className="wkb-output" role="region" aria-label="WKB bytes" tabIndex={0}>
                    <span className="wkb-header-bytes" title="WKB header">
                      {result.hex.slice(0, headerHexLength)}
                    </span>
                    {result.hex.slice(headerHexLength)}
                  </div>
                </div>
              </section>
              <section className="wkb-card">
                <h3>Coordinate table</h3>
                <div className="wkb-card-body">
                  <p className="wkb-help">
                    First 100 coordinates, with offsets into the original byte buffer.
                  </p>
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
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
