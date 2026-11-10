// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {MapEngine} from '@math.gl/geospatial/maps';
import {getSunTerminator} from '@math.gl/earth/sun';
import land from 'website-examples/common/land.json';
import styles from './styles.module.css';

const displayNames = {
  robinson: 'Robinson',
  winkel3: 'Winkel Tripel',
  'natural-earth2': 'Natural Earth II'
};
// Alternate oval, angular, circular, rectangular, and asymmetric silhouettes.
// Keep related variants apart, including across the end of the loop.
const projectionOrder = [
  'robinson',
  'collignon',
  'mollweide',
  'bonne',
  'cylindrical-equal-area',
  'nicolosi',
  'sinusoidal',
  'gringorten',
  'aitoff',
  'august',
  'miller',
  'lagrange',
  'eckert1',
  'hammer',
  'polyconic',
  'van-der-grinten'
];
const presets = projectionOrder.map(name => [
  name,
  displayNames[name] ||
    name
      .replace(/-/g, ' ')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/\b[a-z]/g, c => c.toUpperCase())
]);
const grid = [];
for (let lon = -180; lon <= 180; lon += 30)
  grid.push(Array.from({length: 91}, (_, i) => [lon, -90 + i * 2]));
for (let lat = -60; lat <= 60; lat += 30)
  grid.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]));
const maps = presets.map(
  ([projection]) =>
    new MapEngine(
      {
        version: 1,
        id: projection,
        definition: {type: 'world', projection}
      },
      {presets: [worldMapPreset], geometry: mapGeometry, transitions: mapTransitions, ...({sampling: {tolerance: 0.008}})}
    )
);
const cells = [];
for (let lon = -180; lon < 180; lon += 5) {
  for (let lat = -90; lat < 90; lat += 5) {
    const a = ((lon + 2.5) * Math.PI) / 180;
    const b = ((lat + 2.5) * Math.PI) / 180;
    cells.push({
      normal: [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)],
      ring: [
        [lon, lat],
        [lon + 5, lat],
        [lon + 5, lat + 5],
        [lon, lat + 5]
      ]
    });
  }
}

export default function HomeMap() {
  const canvas = useRef(null);
  const [label, setLabel] = useState({name: presets[0][1], key: 0});
  useEffect(() => {
    const element = canvas.current;
    const ctx = element.getContext('2d');
    if (!ctx) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const epoch = Date.now();
    let paintedTime = -1,
      paintedWidth = 0,
      paintedHeight = 0,
      lastPaint = -100;
    let width = 1,
      height = 1,
      frame,
      time = 0,
      last = 0,
      next = 5000;
    let source = 0,
      target = 0,
      started = -2000;
    let transition, coast, lines, mesh;
    function pickNext() {
      return (target + 1) % maps.length;
    }
    function prepare() {
      transition = maps[source].createTransitionTo(maps[target], {strategy: 'auto'});
      coast = land.flatMap(rings => rings.map(ring => transition.prepareLine(ring)));
      lines = grid.map(line => transition.prepareLine(line));
      mesh = cells.map(cell => ({
        ...cell,
        from: cell.ring.map(p =>
          transition.projectPoint([Math.max(-179.999999, Math.min(179.999999, p[0])), p[1]], 0)
        ),
        to: cell.ring.map(p =>
          transition.projectPoint([Math.max(-179.999999, Math.min(179.999999, p[0])), p[1]], 1)
        )
      }));
    }
    prepare();
    function path(rings, close) {
      ctx.beginPath();
      for (const ring of rings) {
        ring.forEach(([x, y], i) => (i ? ctx.lineTo(x, -y) : ctx.moveTo(x, -y)));
        if (close) ctx.closePath();
      }
    }
    function draw(now) {
      const delta = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!document.hidden && !reduced.matches) time += delta;
      if (
        document.hidden ||
        (time === paintedTime && width === paintedWidth && height === paintedHeight) ||
        now - lastPaint < 30
      ) {
        frame = requestAnimationFrame(draw);
        return;
      }
      paintedTime = time;
      paintedWidth = width;
      paintedHeight = height;
      lastPaint = now;
      if (time >= next) {
        source = target;
        target = pickNext();
        started = time;
        next = time + 5000;
        prepare();
        setLabel({name: presets[target][1], key: next});
      }
      const phase = Math.min(1, (time - started) / 1800);
      const t = phase * phase * (3 - 2 * phase);
      ctx.setTransform(element.width / width, 0, 0, element.height / height, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const cell of mesh) {
        cell.current = null;
        if (cell.from.some(p => !p) || cell.to.some(p => !p)) continue;
        cell.current =
          transition.strategy === 'direct'
            ? cell.from.map((p, i) => p.map((v, j) => v * (1 - t) + cell.to[i][j] * t))
            : cell.ring.map(p =>
                transition.projectPoint(
                  [Math.max(-179.999999, Math.min(179.999999, p[0])), p[1]],
                  t
                )
              );
        if (cell.current.some(p => !p)) {
          cell.current = null;
          continue;
        }
      }
      // Projection extents differ: fit and center the geometry actually being drawn.
      let minimumX = Infinity, maximumX = -Infinity;
      let minimumY = Infinity, maximumY = -Infinity;
      for (const cell of mesh) {
        for (const point of cell.current || []) {
          if (!point.every(Number.isFinite)) continue;
          minimumX = Math.min(minimumX, point[0]);
          maximumX = Math.max(maximumX, point[0]);
          minimumY = Math.min(minimumY, point[1]);
          maximumY = Math.max(maximumY, point[1]);
        }
      }
      const extentWidth = maximumX - minimumX;
      const extentHeight = maximumY - minimumY;
      if (!(extentWidth > 0 && extentHeight > 0)) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const scale = Math.min(width * 0.94 / extentWidth, height * 0.94 / extentHeight);
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-(minimumX + maximumX) / 2, (minimumY + maximumY) / 2);
      ctx.lineWidth = 0.6 / scale;
      const sun = getSunTerminator(epoch + time * 8640, {resolution: 120});
      for (const cell of mesh) {
        if (!cell.current) continue;
        path([cell.current], true);
        ctx.fillStyle = '#173c50';
        ctx.fill();
      }
      ctx.fillStyle = '#66938f';
      ctx.strokeStyle = '#8ec3bd';
      for (const geometry of coast)
        for (const part of geometry.evaluate(t)) {
          path(part.coordinates, false);
          ctx.globalAlpha = part.opacity;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      for (const cell of mesh) {
        if (!cell.current) continue;
        const dot = cell.normal.reduce((sum, v, i) => sum + v * sun.sunDirection[i], 0);
        const darkness = Math.max(0, Math.min(0.76, -dot * 5));
        if (!darkness) continue;
        path([cell.current], true);
        ctx.fillStyle = `rgba(2,8,23,${darkness})`;
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(166,218,230,0.18)';
      for (const geometry of lines)
        for (const part of geometry.evaluate(t)) {
          path(part.coordinates, false);
          ctx.globalAlpha = part.opacity;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      ctx.strokeStyle = 'rgba(255,216,145,0.65)';
      ctx.lineWidth = 1 / scale;
      for (const line of sun.geometry.coordinates) {
        const points = line.map(p => transition.projectPoint(p, t)).filter(Boolean);
        // A seam endpoint may select the opposite chart edge; never bridge the map.
        ctx.beginPath();
        points.forEach(([x, y], i) => {
          const previous = points[i - 1];
          if (!previous || Math.hypot(x - previous[0], y - previous[1]) > 1.5) ctx.moveTo(x, -y);
          else ctx.lineTo(x, -y);
        });
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    }
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.max(1, width * ratio);
      element.height = Math.max(1, height * ratio);
    });
    resize.observe(element);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, []);
  return <>
    <div className={styles.scene}>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
    <div className={styles.caption}>
      <span key={label.key} className={styles.name}>{label.name}</span>
    </div>
  </>;
}

import {worldMapPreset, mapGeometry, mapTransitions} from '@math.gl/geospatial/maps';
