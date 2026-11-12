// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {_GlobeView} from '@deck.gl/core';
import {DeckGL} from '@deck.gl/react';
import {TileLayer} from '@deck.gl/geo-layers';
import {DGGS_DECODERS} from '@math.gl/dggs';
import {PolygonLayer, ScatterplotLayer} from '@deck.gl/layers';
import ExamplePanel from '../../../common/example-panel';
import {getGridLevel, generateCells} from './generator';
import './styles.css';

const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const GLOBE_VIEW = new _GlobeView({controller: true});
const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 30,
  zoom: 2,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM
};

export default function CellExplorer() {
  const [grid, setGrid] = useState('h3');
  const [hoveredCellId, setHoveredCellId] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [tileStatus, setTileStatus] = useState(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const cellLevel = getGridLevel(grid, Math.floor(viewState.zoom));
  const decoder = DGGS_DECODERS.find(item => item.name === grid);
  const layers = useMemo(() => {
    return [
      new TileLayer({
        id: `grid-tiles-${grid}`,
        tileSize: 512,
        minZoom: 0,
        maxZoom: MAX_ZOOM,
        refinementStrategy: 'no-overlap',
        parameters: {depthCompare: 'always'},
        getTileData: ({bbox: {west, south, east, north}, index: {z}}) =>
          generateCells(
            grid,
            [
              [west, south],
              [east, north]
            ],
            getGridLevel(grid, z)
          ),
        onViewportLoad: tiles => {
          // Count each boundary cell once even when several tiles contain its ID.
          const cellIds = new Set(tiles.flatMap(tile => tile.content || []));
          setTileStatus({grid, count: cellIds.size});
        },
        onTileError: error => setGenerationError(error.message),
        renderSubLayers: props =>
          new PolygonLayer(props, {
            id: `${props.id}-cells`,
            getPolygon: id =>
              decoder.cellToBoundary(id, {
                unwrap: true,
                referenceLongitude: (props.tile.bbox.west + props.tile.bbox.east) / 2
              }),
            // Boundary cells belong to several tiles. Identical opaque fills keep
            // them uniform while rendering their complete decoded geometry.
            getFillColor: [13, 53, 70, 255],
            getLineColor: [120, 205, 230, 255],
            lineWidthMinPixels: 1,
            pickable: true
          })
      })
    ];
  }, [grid, decoder]);
  const hoverHighlightLayer = useMemo(
    () =>
      hoveredCellId
        ? [
            new ScatterplotLayer({
              id: 'hovered-cell-center',
              data: [hoveredCellId],
              getPosition: cellId => decoder.cellToLngLat(cellId),
              getRadius: 3,
              radiusUnits: 'pixels',
              getFillColor: [255, 210, 80],
              stroked: true,
              getLineColor: [255, 255, 255],
              getLineWidth: 1,
              lineWidthUnits: 'pixels',
              // Let picking reach the underlying polygon so the marker cannot steal hover.
              pickable: false,
              parameters: {depthCompare: 'always'}
            })
          ]
        : null,
    [hoveredCellId, decoder]
  );
  return (
    <div className="dggs-explorer">
      <div className="dggs-globe" aria-label="DGGS boundaries on an interactive globe">
        <DeckGL
          views={GLOBE_VIEW}
          viewState={viewState}
          onViewStateChange={({viewState: next}) => {
            if (next.zoom < 0) {
              return;
            }
            if (getGridLevel(grid, Math.floor(next.zoom)) !== cellLevel) {
              // Discard the old resolution's ID before drawing its center at the new level.
              setHoveredCellId(null);
            }
            setViewState(next);
          }}
          onHover={({object}) => setHoveredCellId(object || null)}
          layers={[...layers, hoverHighlightLayer]}
          getTooltip={({object}) => {
            if (!object) return null;
            const [longitude, latitude] = decoder.cellToLngLat(object);
            return `${object}\nCenter: ${longitude.toFixed(6)}°, ${latitude.toFixed(6)}°`;
          }}
        />
      </div>
      <ExamplePanel title="DGGS cell explorer">
        <label>
          Grid
          <select
            aria-label="Grid"
            value={grid}
            onChange={event => {
              setHoveredCellId(null);
              setGrid(event.target.value);
              setTileStatus(null);
              setGenerationError(null);
            }}
          >
            {DGGS_DECODERS.map(({name}) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <p data-testid="grid-level">Cell level: {cellLevel}</p>
        <p data-testid="cell-count">
          Loaded cells: {tileStatus?.grid === grid ? tileStatus.count : 0}
        </p>
        {generationError && <p role="alert">{generationError}</p>}
      </ExamplePanel>
    </div>
  );
}
