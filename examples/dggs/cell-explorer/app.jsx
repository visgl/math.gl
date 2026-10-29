// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Deck, _GlobeView} from '@deck.gl/core';
import {PolygonLayer, ScatterplotLayer} from '@deck.gl/layers';
import ExamplePanel from '../../common/example-panel';
import {SAMPLES, decodeCell, s2Hierarchy} from './model';
import './styles.css';

export default function CellExplorer() {
  const [grid, setGrid] = useState('h3');
  const [token, setToken] = useState(SAMPLES.h3);
  const [unwrap, setUnwrap] = useState(true);
  const [compare, setCompare] = useState(false);
  const root = useRef(null);
  const deck = useRef(null);
  const result = useMemo(() => {
    try {
      return {
        ...decodeCell(grid, token, unwrap),
        hierarchy: grid === 's2' ? s2Hierarchy(token) : null
      };
    } catch (error) {
      return {error: error.message};
    }
  }, [grid, token, unwrap]);
  useEffect(() => {
    deck.current = new Deck({
      parent: root.current,
      views: new _GlobeView({controller: true}),
      initialViewState: {longitude: -122.4, latitude: 37.78, zoom: 9},
      getTooltip: info => info.object?.label || null
    });
    return () => {
      deck.current.finalize();
      deck.current = null;
    };
  }, []);
  useEffect(() => {
    const cells = result.error ? [] : [{...result, label: `${grid}: ${token}`}];
    if (compare)
      Object.entries(SAMPLES).forEach(([name, id]) => {
        if (name !== grid) cells.push({...decodeCell(name, id), label: `${name}: ${id}`});
      });
    deck.current?.setProps({
      layers: [
        new PolygonLayer({
          id: 'cell-boundaries',
          data: cells,
          getPolygon: cell => cell.boundary,
          getFillColor: (_, {index}) =>
            [
              [45, 190, 225, 90],
              [255, 180, 65, 80],
              [185, 110, 240, 90]
            ][index % 3],
          getLineColor: [170, 230, 255],
          lineWidthMinPixels: 2,
          pickable: true
        }),
        new ScatterplotLayer({
          id: 'centers',
          data: cells,
          getPosition: cell => cell.center,
          getFillColor: [255, 210, 100],
          radiusMinPixels: 4,
          pickable: true
        })
      ]
    });
  }, [result, compare, grid, token]);
  const locate = () => {
    if (result.error) return;
    const [west, south] = result.bounds[0],
      [east, north] = result.bounds[1];
    deck.current?.setProps({
      initialViewState: {
        longitude: result.center[0],
        latitude: result.center[1],
        zoom: Math.max(
          0,
          Math.min(16, Math.log2(180 / Math.max(east - west, north - south, 0.001)))
        )
      }
    });
  };
  return (
    <div className="dggs-explorer">
      <div className="dggs-globe" ref={root} aria-label="DGGS boundaries on an interactive globe" />
      <ExamplePanel title="DGGS cell explorer">
        <p>Decode cell IDs into centers and boundaries. Drag to rotate; scroll to zoom.</p>
        <label>
          Grid
          <select
            value={grid}
            onChange={event => {
              setGrid(event.target.value);
              setToken(SAMPLES[event.target.value]);
            }}
          >
            {Object.keys(SAMPLES).map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Cell ID
          <input value={token} onChange={event => setToken(event.target.value)} />
        </label>
        <button onClick={locate} disabled={Boolean(result.error)}>
          Fit cell
        </button>
        <button onClick={() => setToken(SAMPLES[grid])}>Reset ID</button>
        <label>
          <input
            type="checkbox"
            checked={unwrap}
            onChange={event => setUnwrap(event.target.checked)}
          />
          Unwrap antimeridian
        </label>
        <label>
          <input
            type="checkbox"
            checked={compare}
            onChange={event => setCompare(event.target.checked)}
          />
          Compare six San Francisco sample cells
        </label>
        {result.error ? (
          <p role="alert">{result.error}</p>
        ) : (
          <>
            <p data-testid="cell-center">
              Center: {result.center.map(value => value.toFixed(6)).join(', ')}°
            </p>
            <p>
              Bounds (west, south / east, north):
              <br />
              {result.bounds
                .map(pair => pair.map(value => value.toFixed(6)).join(', '))
                .join(' / ')}
            </p>
            <p>{result.boundary.length - 1} boundary segments</p>
            {result.hierarchy && (
              <div>
                <p>S2 level: {result.hierarchy.level}</p>
                <button
                  disabled={!result.hierarchy.parent}
                  onClick={() => setToken(result.hierarchy.parent)}
                >
                  Parent
                </button>
                {result.hierarchy.children.map((child, i) => (
                  <button key={child} onClick={() => setToken(child)}>
                    Child {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <p>
          Samples have different resolutions; their sizes are not equivalent. The globe renders
          math.gl decoder output with deck.gl.
        </p>
        <a href="https://github.com/visgl/deck.gl-community/tree/master/examples/geo-layers/global-grid-layer">
          Inspired by the community global grid example
        </a>
      </ExamplePanel>
    </div>
  );
}
