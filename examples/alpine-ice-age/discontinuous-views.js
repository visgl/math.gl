// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {triangulateSourcePolygon, isConvexSourcePolygon} from './triangulate-source-polygon.js';
import {MapEngine, MAP_PROJECTIONS} from '@math.gl/geospatial/discontinuous';
import {MYRIAHEDRAL_VIEWS} from './map-options.js';
export {MYRIAHEDRAL_VIEWS, DISCONTINUOUS_VIEWS} from './map-options.js';

import {isLand} from '../common/land-mask.js';
import {myriahedralGridSteps} from './myriahedral-grid.js';
import {
  createH3MyriahedralMesh,
  createA5MyriahedralMesh,
  createS2MyriahedralMesh,
  dggsCellWeight,
  dggsCellOutlines
} from './dggs-mesh.js';

import hawaiiLand from './assets/hawaii-land.json' with {type: 'json'};

// DGGS panel topology is independent of the ice-age snapshot.
const dggsMeshes = new Map();
function dggsPanels(system) {
  if (!dggsMeshes.has(system))
    dggsMeshes.set(
      system,
      system === 'h3'
        ? createH3MyriahedralMesh()
        : system === 's2'
          ? createS2MyriahedralMesh()
          : system === 's2-1'
            ? createS2MyriahedralMesh(1)
            : createA5MyriahedralMesh(system === 'a5-1' ? 1 : 0)
    );
  return dggsMeshes.get(system);
}
const definitions = {
  ...Object.fromEntries(
    MAP_PROJECTIONS.map(projection => [
      `projection:${projection}`,
      {type: 'projection', projection}
    ])
  ),
  albersUsa: {type: 'albers-usa'},
  airOcean: {type: 'air-ocean'},
  peirceQuincuncial: {type: 'peirce-quincuncial'},
  berghaus: {type: 'berghaus'},
  gingery: {type: 'gingery'},
  'gray-fuller': {type: 'gray-fuller'},
  petroff: {type: 'petroff'},
  isea: {type: 'isea'},
  dsea: {type: 'dsea'},
  healpix: {type: 'healpix'},
  'interrupted-custom': {
    type: 'interrupted',
    projection: 'sinusoidal',
    centralMeridian: 20,
    lobes: {
      north: [
        [-180, -90, 0],
        [0, 90, 180]
      ],
      south: [
        [-180, -90, 0],
        [0, 90, 180]
      ]
    }
  },
  guyou: {type: 'guyou'},
  'gringorten-quincuncial': {type: 'gringorten-quincuncial'},
  butterfly: {type: 'butterfly'},
  'collignon-butterfly': {type: 'collignon-butterfly'},
  waterman: {type: 'waterman'},
  'goode-ocean': {type: 'goode-ocean'},
  'interrupted-boggs': {type: 'interrupted-boggs'},
  'interrupted-sinu-mollweide': {type: 'interrupted-sinu-mollweide'},
  'interrupted-quartic-authalic': {type: 'interrupted-quartic-authalic'},
  'interrupted-mollweide-hemispheres': {
    type: 'interrupted-mollweide-hemispheres'
  },

  interruptedSinusoidal: {type: 'interrupted-sinusoidal'},
  interruptedMollweide: {type: 'interrupted-mollweide'},
  interruptedHomolosine: {type: 'goode'}
};
export function createMap(view) {
  const options = MYRIAHEDRAL_VIEWS[view];
  const panels = options?.dggs ? dggsPanels(options.dggs) : null;
  const definition = options
    ? {
        type: 'myriahedral',
        preset: options.preset,
        ...(panels ? {mesh: panels.mesh} : options)
      }
    : definitions[view];
  if (!definition) throw new Error(`Unknown map: ${view}`);
  return new MapEngine(
    {version: 1, id: view, definition},
    {
      isLand: ([lon, lat]) => isLand(lon, lat),
      edgeWeight: panels ? (edge, weight) => dggsCellWeight(edge, weight, panels) : undefined
    }
  );
}
const cache = new Map();

/** Bilinear samples in the example's 360 x 181 periodic, one-degree source grid. */
export function sourceSample([longitude, latitude]) {
  const x = (((longitude + 180) % 360) + 360) % 360;
  const y = Math.max(0, Math.min(180, latitude + 90));
  const west = Math.floor(x),
    south = Math.min(179, Math.floor(y));
  const dx = x - west,
    dy = y - south;
  return {
    indices: [
      south * 360 + west,
      south * 360 + ((west + 1) % 360),
      (south + 1) * 360 + west,
      (south + 1) * 360 + ((west + 1) % 360)
    ],
    weights: [(1 - dx) * (1 - dy), dx * (1 - dy), (1 - dx) * dy, dx * dy]
  };
}
export function sampleField(field, sample) {
  return sample.indices.reduce((sum, index, i) => sum + field[index] * sample.weights[i], 0);
}

/** Clip source grid cells before triangulation; each emitted triangle belongs to one region. */
function* buildGrid(view, step = 1) {
  const key = `${view}:${step}`;
  if (cache.has(key)) {
    const cached = cache.get(key);
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  if (!(step > 0 && 180 % step === 0)) throw new Error('Grid step must divide 180');
  const map = createMap(view);
  const layout = map.getLayout();
  // Match sampling accuracy to the fitted map extent, including unbounded kernels
  // whose finite display horizon spans many more map units than ordinary maps.
  const [minX, minY, maxX, maxY] = layout.bounds;
  const sampling = {tolerance: Math.max(1e-5, Math.max(maxX - minX, maxY - minY) * 1e-5)};
  const ownership = new Map(),
    vertexIds = new Map();
  const regionsAt = p => {
    const key = p.join(',');
    if (!ownership.has(key)) ownership.set(key, map.findRegions(p));
    return ownership.get(key);
  };
  const positions = [],
    sources = [],
    samples = [],
    indices = [],
    regionIds = [];
  const sphere = ([lon, lat]) => {
    const a = (lon * Math.PI) / 180,
      b = (lat * Math.PI) / 180;
    return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
  };
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  // Conservative half-space rejection also catches cells whose corners all lie
  // outside a region but whose interiors cross it. Do not discard those cells.
  const masks = map.regions.map(region => {
    const vectors = region.boundary.map(sphere),
      interior = sphere(region.interior);
    return vectors.map((a, i) => {
      const b = vectors[(i + 1) % vectors.length];
      const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      return dot(n, interior) < 0 ? n.map(v => -v) : n;
    });
  });
  if (MYRIAHEDRAL_VIEWS[view]) {
    yield* myriahedralGridSteps(
      map,
      step,
      {positions, sources, samples, indices, regionIds},
      sourceSample
    );
  }
  if (!MYRIAHEDRAL_VIEWS[view]) {
    // Insets occupy very different fractions of the fitted viewport. Sample
    // their display meshes independently while retaining the source grid's
    // actual 1° resolution for bedrock and ice values.
    const grids =
      view === 'albersUsa' && step === 1
        ? [
            {regionId: 'lower48', step: 1, bounds: [-130, 18, -62, 60]},
            {regionId: 'alaska', step: 0.5, bounds: [-180, 35, -128, 82]},
            // The Aleutian part of the spherical mask wraps past -180°.
            {regionId: 'alaska', step: 0.5, bounds: [150, 35, 180, 82]},
            {regionId: 'hawaii', step: 0.25, bounds: [-180, 15, -150, 32]}
          ]
        : [{regionId: null, step, bounds: [-180, -90, 180, 90]}];
    for (const grid of grids) {
      const [west, south, east, north] = grid.bounds;
      for (let lat = south; lat < north; lat += grid.step) {
        yield;
        for (let lon = west; lon < east; lon += grid.step) {
          if (((lon - west) / grid.step) % 16 === 0) yield;
          const ring = [
            [lon, lat],
            [lon + grid.step, lat],
            [lon + grid.step, lat + grid.step],
            [lon, lat + grid.step]
          ];
          if (lat === -90) ring.splice(1, 1);
          if (lat + grid.step === 90) ring.splice(2, 1);
          const vectors = ring.map(sphere);
          if (!masks.some(normals => normals.every(n => vectors.some(v => dot(n, v) >= -1e-12))))
            continue;
          const common = regionsAt(ring[0]).find(id => ring.every(p => regionsAt(p).includes(id)));
          if (
            common &&
            map.containsConvexPolygon(ring, common) &&
            (!grid.regionId || common === grid.regionId)
          ) {
            const corners = ring.map(p => {
              const key = `${common}:${p.join(',')}`;
              if (!vertexIds.has(key)) {
                vertexIds.set(key, positions.length / 2);
                positions.push(...map.projectPoint(p, common).position);
                sources.push(p);
                samples.push(sourceSample(p));
                regionIds.push(common);
              }
              return vertexIds.get(key);
            });
            for (let i = 1; i < corners.length - 1; i++)
              indices.push(corners[0], corners[i], corners[i + 1]);
            continue;
          }
          const parts = map.projectPolygon([ring], sampling);
          for (const part of parts) {
            if (grid.regionId && part.regionId !== grid.regionId) continue;
            let outline = part.coordinates[0],
              source = part.sourceCoordinates[0];
            if (
              outline.length > 1 &&
              outline[0][0] === outline.at(-1)[0] &&
              outline[0][1] === outline.at(-1)[1]
            ) {
              outline = outline.slice(0, -1);
              source = source.slice(0, -1);
            }
            if (outline.length < 3) continue;
            // These are small convex spherical grid fragments, not arbitrary feature polygons.
            // A spherical interior point keeps the fan inside its local panel.
            const sum = source.map(sphere).reduce((a, p) => a.map((v, i) => v + p[i]), [0, 0, 0]);
            const center = [
              (Math.atan2(sum[1], sum[0]) * 180) / Math.PI,
              (Math.atan2(sum[2], Math.hypot(sum[0], sum[1])) * 180) / Math.PI
            ];
            const projected = map.projectPoint(center, part.regionId);
            if (!projected || !isConvexSourcePolygon(part)) {
              const mesh = triangulateSourcePolygon(part),
                start = positions.length / 2;
              for (let i = 0; i < mesh.sources.length; i++) {
                positions.push(...mesh.positions[i]);
                sources.push(mesh.sources[i]);
                samples.push(sourceSample(mesh.sources[i]));
                regionIds.push(part.regionId);
              }
              indices.push(...mesh.indices.map(index => start + index));
              continue;
            }
            const start = positions.length / 2;
            for (const [p, geographic] of [
              [projected.position, center],
              ...outline.map((p, i) => [p, source[i]])
            ]) {
              positions.push(...p);
              sources.push(geographic);
              samples.push(sourceSample(geographic));
              regionIds.push(part.regionId);
            }
            for (let i = 0; i < outline.length; i++)
              indices.push(start, start + i + 1, start + ((i + 1) % outline.length) + 1);
          }
        }
      }
    }
  }
  const lines = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    yield;
    lines.push(
      ...map
        .projectLine(
          Array.from({length: 181}, (_, i) => [lon, i - 90]),
          sampling
        )
        .map(line => ({...line, meridian: lon}))
    );
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    yield;
    lines.push(
      ...map.projectLine(
        Array.from({length: 361}, (_, i) => [i - 180, lat]),
        sampling
      )
    );
  }
  if (MYRIAHEDRAL_VIEWS[view]?.dggs)
    lines.push(...dggsCellOutlines(map, dggsPanels(MYRIAHEDRAL_VIEWS[view].dggs).cells));
  const result = {
    map,
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
    sources,
    samples,
    regionIds,
    lines,
    layout,
    referenceLand: layout.regions.some(region => region.kind === 'inset')
      ? hawaiiLand.geometry.coordinates.flatMap(polygon =>
          map.projectPolygon(polygon, {tolerance: 1e-5})
        )
      : []
  };
  // Cycling through many panel meshes must not retain every high-resolution grid.
  if (cache.size >= 3) cache.delete(cache.keys().next().value);
  cache.set(key, result);
  return result;
}

/** Synchronous entry point for offline callers and geometry tests. */
export function discontinuousGrid(view, step = 1) {
  const builder = buildGrid(view, step);
  let next;
  do {
    next = builder.next();
  } while (!next.done);
  return next.value;
}

/** Prepare without monopolizing the event loop; abandoned selections stop at a checkpoint. */
export async function prepareDiscontinuousGrid(
  view,
  step = 1,
  {signal, yieldTask = () => new Promise(resolve => setTimeout(resolve, 0))} = {}
) {
  const builder = buildGrid(view, step);
  try {
    // Paint the selection/loading state before starting any geometry work.
    await yieldTask();
    let deadline = performance.now() + 8;
    while (true) {
      signal?.throwIfAborted();
      const next = builder.next();
      if (next.done) return next.value;
      if (performance.now() >= deadline) {
        await yieldTask();
        deadline = performance.now() + 8;
      }
    }
  } finally {
    builder.return();
  }
}
