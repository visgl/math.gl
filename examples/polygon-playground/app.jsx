// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {Deck, OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {SolidPolygonLayer, LineLayer} from '@deck.gl/layers';
import {
  EditableGeoJsonLayer,
  ModifyMode,
  DrawPolygonMode
} from '@deck.gl-community/editable-layers';
import {earcut, getPolygonSignedArea, getPolygonWindingDirection} from '@math.gl/polygon';
import './styles.css';

const initial = [
  [70, 70],
  [430, 70],
  [430, 330],
  [270, 280],
  [70, 330]
];
const hole = [
  [180, 140],
  [180, 210],
  [250, 210],
  [250, 140]
];
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function intersects(a, b, c, d) {
  return (
    cross(a, b, c) * cross(a, b, d) <= 0 &&
    cross(c, d, a) * cross(c, d, b) <= 0 &&
    Math.max(a[0], b[0]) >= Math.min(c[0], d[0]) &&
    Math.max(c[0], d[0]) >= Math.min(a[0], b[0]) &&
    Math.max(a[1], b[1]) >= Math.min(c[1], d[1]) &&
    Math.max(c[1], d[1]) >= Math.min(a[1], b[1])
  );
}
function contains(ring, point) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function validRing(ring) {
  if (ring.length < 3 || Math.abs(getPolygonSignedArea(ring.flat())) < 10) return false;
  for (let i = 0; i < ring.length; i++) {
    if (Math.hypot(...ring[i].map((v, k) => v - ring[(i + 1) % ring.length][k])) < 1) return false;
    for (let j = i + 1; j < ring.length; j++) {
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      if (intersects(ring[i], ring[(i + 1) % ring.length], ring[j], ring[(j + 1) % ring.length]))
        return false;
    }
  }
  return true;
}
function validRings(rings) {
  if (!rings.every(validRing)) return false;
  for (let i = 1; i < rings.length; i++) {
    if (!rings[i].every((p) => contains(rings[0], p))) return false;
    for (let j = 0; j < i; j++) {
      if (
        rings[i].some((a, k) =>
          rings[j].some((b, l) =>
            intersects(
              a,
              rings[i][(k + 1) % rings[i].length],
              b,
              rings[j][(l + 1) % rings[j].length]
            )
          )
        )
      )
        return false;
      if (j > 0 && (contains(rings[j], rings[i][0]) || contains(rings[i], rings[j][0])))
        return false;
    }
  }
  return true;
}
const collection = (rings) => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {type: 'Polygon', coordinates: rings.map((ring) => [...ring, ring[0]])}
    }
  ]
});
const openRings = (data) =>
  data.features[0]?.geometry.coordinates.map((ring) =>
    ring.slice(0, -1).map((p) => p.slice(0, 2))
  ) || [];

export default function PolygonPlayground() {
  const [data, setData] = useState(() => collection([initial]));
  const [mode, setMode] = useState('edit');
  const [drawingCount, setDrawingCount] = useState(0);
  const [edges, setEdges] = useState(true);
  const [warning, setWarning] = useState('');
  const [vertex, setVertex] = useState(0);
  const root = useRef(null),
    deck = useRef(null);
  const rings = openRings(data),
    ring = rings[0] || [];
  const vertices = rings.flat(),
    holes = [];
  let offset = 0;
  rings.forEach((r, i) => {
    if (i) holes.push(offset);
    offset += r.length;
  });
  const indices = earcut(vertices.flat(), holes, 2);
  const triangles = Array.from({length: indices.length / 3}, (_, i) =>
    indices.slice(i * 3, i * 3 + 3).map((index) => vertices[index])
  );
  const area = rings.reduce(
    (sum, r, i) => sum + (i ? -1 : 1) * Math.abs(getPolygonSignedArea(r.flat())),
    0
  );
  const accept = (updated) => {
    const next = openRings(updated);
    if (next.length && !validRings(next)) {
      setWarning('Keep edges apart and holes inside the outline.');
      return;
    }
    setData(updated);
    setWarning('');
    setVertex((v) => Math.min(v, Math.max(0, next[0]?.length - 1 || 0)));
  };
  useEffect(() => {
    const instance = new Deck({
      parent: root.current,
      canvas: root.current.querySelector('canvas'),
      views: new OrthographicView({flipY: false, controller: true}),
      initialViewState: {target: [250, 200, 0], zoom: 0},
      getCursor: ({isDragging}) => (isDragging ? 'grabbing' : 'crosshair')
    });
    deck.current = instance;
    const resize = new ResizeObserver(([entry]) =>
      instance.setProps({
        initialViewState: {
          target: [250, 200, 0],
          zoom: Math.log2(
            Math.max(0.1, Math.min(entry.contentRect.width / 540, entry.contentRect.height / 440))
          )
        }
      })
    );
    resize.observe(root.current);
    return () => {
      resize.disconnect();
      deck.current = null;
      instance.finalize();
    };
  }, []);
  useEffect(() => {
    deck.current?.setProps({
      layers: [
        new SolidPolygonLayer({
          id: 'math-triangles',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: triangles,
          getPolygon: (p) => p,
          getFillColor: (_, info) => [40 + ((info.index * 13) % 150), 140, 210, 170]
        }),
        new LineLayer({
          id: 'triangle-edges',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: edges ? triangles.flatMap((t) => t.map((p, i) => [p, t[(i + 1) % 3]])) : [],
          getSourcePosition: (d) => d[0],
          getTargetPosition: (d) => d[1],
          getColor: [220, 240, 255],
          getWidth: 1.5
        }),
        new EditableGeoJsonLayer({
          id: 'polygon-editor',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data,
          mode: mode === 'draw' ? DrawPolygonMode : ModifyMode,
          selectedFeatureIndexes: data.features.length ? [0] : [],
          filled: false,
          getLineColor: [112, 199, 255],
          getLineWidth: 3,
          lineWidthUnits: 'pixels',
          getEditHandlePointColor: [255, 216, 117],
          editHandlePointRadiusScale: 1,
          editHandlePointRadiusMinPixels: 6,
          onEdit: ({updatedData, editType}) => {
            if (editType === 'invalidPolygon') {
              setDrawingCount(0);
              setWarning('The drawing has crossing edges. Try drawing it again.');
              return;
            }
            if (editType === 'addTentativePosition') {
              setDrawingCount((count) => count + 1);
              return;
            }
            if (editType === 'updateTentativeFeature') return;
            if (editType === 'cancelFeature') setDrawingCount(0);
            accept(updatedData);
            if (editType === 'addFeature' && validRings(openRings(updatedData))) setMode('edit');
          }
        })
      ]
    });
  });
  const reset = () => {
    setData(collection([initial]));
    setMode('edit');
    setWarning('');
    setVertex(0);
  };
  return (
    <div className="math-playground">
      <aside>
        <h2>Polygon playground</h2>
        <p>
          Drag handles to edit. Click an edge to insert a vertex; click a handle to remove it.
          Scroll to zoom.
        </p>
        <button
          disabled={mode === 'draw'}
          onClick={() => {
            setData({type: 'FeatureCollection', features: []});
            setMode('draw');
            setDrawingCount(0);
            setWarning('');
          }}
        >
          Draw polygon
        </button>
        <button onClick={reset}>Reset</button>
        {mode === 'draw' && (
          <p role="status">
            Click to place vertices, then click the first vertex to finish.{' '}
            <span data-role="drawing-count">{drawingCount} vertices</span>
          </p>
        )}
        <label>
          <input
            type="checkbox"
            checked={rings.length > 1}
            disabled={!ring.length || mode === 'draw'}
            onChange={(e) => accept(collection(e.target.checked ? [ring, hole] : [ring]))}
          />{' '}
          Include a hole
        </label>
        <label>
          <input type="checkbox" checked={edges} onChange={(e) => setEdges(e.target.checked)} />{' '}
          Triangle edges
        </label>
        <button
          disabled={!ring.length}
          onClick={() => accept(collection([[...ring].reverse(), ...rings.slice(1)]))}
        >
          Reverse winding
        </button>
        <p data-role="metrics">
          {indices.length / 3} triangles
          <br />
          Area: {area.toFixed(0)} square units
          <br />
          Outline: {ring.length ? getPolygonWindingDirection(ring.flat()) : 'none'}
          <br />
          Signed area: {getPolygonSignedArea(ring.flat()).toFixed(0)}
        </p>
        {!!ring.length && (
          <>
            <label>
              Outline vertex{' '}
              <select
                aria-label="Outline vertex"
                value={vertex}
                onChange={(e) => setVertex(Number(e.target.value))}
              >
                {ring.map((_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            {['X', 'Y'].map((axis, k) => (
              <label key={axis}>
                Vertex {axis}
                <input
                  aria-label={`Vertex ${axis}`}
                  type="number"
                  step="1"
                  value={Number((ring[vertex]?.[k] || 0).toFixed(2))}
                  onChange={(e) => {
                    if (e.target.value === '') return;
                    const next = ring.map((p, i) =>
                      i === vertex ? p.map((v, j) => (j === k ? Number(e.target.value) : v)) : p
                    );
                    accept(collection([next, ...rings.slice(1)]));
                  }}
                />
              </label>
            ))}
          </>
        )}
        <p role="status">{warning}</p>
        <p>
          Editing: deck.gl-community. Triangulation, area, and winding: math.gl. Coordinates use an
          upward Y axis.
        </p>
      </aside>
      <div className="polygon-editor-view" ref={root}>
        <canvas aria-label="Editable triangulated polygon" />
      </div>
    </div>
  );
}
