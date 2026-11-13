// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Qualification only: XYZ in source sample-lattice coordinates, Z in source units.
// Deliberately independent of terrain sampling/error routines. Never exported by a package.
const EPS = 1e-10;
const cross = (ax, ay, bx, by) => ax * by - ay * bx;

export function indexMesh(mesh) {
  const {positions: p, indices: ids} = mesh;
  if (p.length % 3 || ids.length % 3 || !p.every(Number.isFinite))
    throw new Error('Invalid XYZ mesh');
  const triangles = [];
  const bins = new Map();
  const cell = 2;
  for (let i = 0; i < ids.length; i += 3) {
    const vertices = Array.from(ids.slice(i, i + 3), id => {
      if (!Number.isInteger(id) || id < 0 || id * 3 >= p.length) throw new Error('Invalid index');
      return Array.from(p.slice(id * 3, id * 3 + 3));
    });
    const [a, b, c] = vertices;
    const det = cross(b[0] - a[0], b[1] - a[1], c[0] - a[0], c[1] - a[1]);
    if (!Number.isFinite(det) || det === 0) throw new Error('Degenerate triangle');
    const bounds = [
      Math.min(a[0], b[0], c[0]),
      Math.min(a[1], b[1], c[1]),
      Math.max(a[0], b[0], c[0]),
      Math.max(a[1], b[1], c[1])
    ];
    const t = {vertices, det, id: i / 3, bounds};
    triangles.push(t);
    for (let y = Math.floor(bounds[1] / cell); y <= Math.floor(bounds[3] / cell); y++) {
      for (let x = Math.floor(bounds[0] / cell); x <= Math.floor(bounds[2] / cell); x++) {
        const key = `${x},${y}`;
        if (!bins.has(key)) bins.set(key, []);
        bins.get(key).push(t);
      }
    }
  }
  return {
    triangles,
    queryBounds(a, b) {
      const found = new Set();
      for (
        let y = Math.floor(Math.min(a[1], b[1]) / cell);
        y <= Math.floor(Math.max(a[1], b[1]) / cell);
        y++
      )
        for (
          let x = Math.floor(Math.min(a[0], b[0]) / cell);
          x <= Math.floor(Math.max(a[0], b[0]) / cell);
          x++
        )
          for (const t of bins.get(`${x},${y}`) || []) found.add(t);
      return found;
    },
    candidates(x, y) {
      return bins.get(`${Math.floor(x / cell)},${Math.floor(y / cell)}`) || [];
    }
  };
}

function weights(t, x, y) {
  const [a, b, c] = t.vertices;
  const u = cross(x - a[0], y - a[1], c[0] - a[0], c[1] - a[1]) / t.det;
  const v = cross(b[0] - a[0], b[1] - a[1], x - a[0], y - a[1]) / t.det;
  return [1 - u - v, u, v];
}
const height = (t, w) => w.reduce((sum, value, i) => sum + value * t.vertices[i][2], 0);
export function sampleMesh(index, x, y) {
  const hits = [];
  for (const t of index.candidates(x, y)) {
    const w = weights(t, x, y);
    if (Math.min(...w) >= -EPS) hits.push({z: height(t, w), interior: Math.min(...w) > EPS});
  }
  return hits;
}

/** Worst error at each supplied probe, including overlapping faces; no coverage is not zero error. */
export function measureProbes(index, probes) {
  let maxInteriorError = null,
    maxEdgeOnlyError = null,
    worstProbe = null;
  let maxError = null,
    sum = 0,
    covered = 0,
    uncovered = 0,
    overlap = 0;
  for (const [x, y, z] of probes) {
    if (![x, y, z].every(Number.isFinite)) throw new Error('Invalid probe');
    const hits = sampleMesh(index, x, y);
    if (!hits.length) {
      uncovered++;
      continue;
    }
    if (hits.filter(h => h.interior).length > 1) overlap++;
    const error = Math.max(...hits.map(h => Math.abs(h.z - z)));
    if (hits.some(h => h.interior)) maxInteriorError = Math.max(maxInteriorError ?? 0, error);
    else maxEdgeOnlyError = Math.max(maxEdgeOnlyError ?? 0, error);
    if (maxError === null || error > maxError)
      worstProbe = {x, y, expectedZ: z, edgeOnly: hits.every(h => !h.interior)};
    maxError = Math.max(maxError ?? 0, error);
    sum += error * error;
    covered++;
  }
  return {
    maxError,
    maxInteriorError,
    maxEdgeOnlyError,
    worstProbe,
    rmsError: covered ? Math.sqrt(sum / covered) : null,
    covered,
    uncovered,
    overlappingProbes: overlap
  };
}

/** Clip each supplied linear XYZ boundary segment against mesh triangles.
 * Height error is the maximum over covered intervals (linear on each face).
 * Interior crossings exclude vertex touches and segments coincident with mesh edges.
 */
export function measureBoundaries(index, segments) {
  let maxHeightError = null,
    totalLength = 0,
    uncoveredLength = 0;
  const crossingTriangles = new Set(),
    uncoveredIntervals = [];
  for (let s = 0; s < segments.length; s++) {
    const [a, b] = segments[s];
    if (a.length !== 3 || b.length !== 3 || ![...a, ...b].every(Number.isFinite))
      throw new Error('Invalid boundary');
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!length) throw new Error('Zero-length boundary');
    totalLength += length;
    const intervals = [];
    for (const t of index.queryBounds(a, b)) {
      const box = t.bounds;
      if (
        Math.max(a[0], b[0]) < box[0] ||
        Math.min(a[0], b[0]) > box[2] ||
        Math.max(a[1], b[1]) < box[1] ||
        Math.min(a[1], b[1]) > box[3]
      )
        continue;
      const wa = weights(t, a[0], a[1]),
        wb = weights(t, b[0], b[1]);
      let lo = 0,
        hi = 1;
      for (let k = 0; k < 3; k++) {
        const delta = wb[k] - wa[k];
        if (Math.abs(delta) < EPS) {
          if (wa[k] < -EPS) hi = -1;
        } else if (delta > 0) lo = Math.max(lo, -wa[k] / delta);
        else hi = Math.min(hi, -wa[k] / delta);
      }
      if (hi - lo <= EPS) continue;
      intervals.push([lo, hi]);
      const mid = (lo + hi) / 2;
      if (wa.every((w, k) => w + mid * (wb[k] - w) > EPS)) crossingTriangles.add(t.id);
      for (const f of [lo, hi]) {
        const w = wa.map((v, k) => v + f * (wb[k] - v));
        const error = Math.abs(height(t, w) - (a[2] + f * (b[2] - a[2])));
        maxHeightError = Math.max(maxHeightError ?? 0, error);
      }
    }
    intervals.sort((x, y) => x[0] - y[0]);
    let end = 0;
    const gap = (lo, hi) => {
      if (hi - lo > EPS) {
        uncoveredLength += (hi - lo) * length;
        uncoveredIntervals.push({segment: s, start: lo, end: hi});
      }
    };
    for (const [lo, hi] of intervals) {
      gap(end, lo);
      end = Math.max(end, hi);
    }
    gap(end, 1);
  }
  return {
    maxHeightError,
    totalLength,
    uncoveredLength,
    uncoveredIntervals,
    crossingTriangles: [...crossingTriangles].sort((a, b) => a - b)
  };
}

/** Cell-center quadrature, not an exact polygon area certificate. Domain callback uses XY. */
export function measureCoverage(index, {width, height, contains, subdivisions = 4}) {
  if (!Number.isInteger(subdivisions) || subdivisions < 1) throw new Error('Invalid subdivisions');
  let missing = 0,
    excess = 0,
    overlap = 0,
    expected = 0;
  for (let iy = 0; iy < (height - 1) * subdivisions; iy++) {
    for (let ix = 0; ix < (width - 1) * subdivisions; ix++) {
      const x = (ix + 0.5) / subdivisions,
        y = (iy + 0.5) / subdivisions;
      const inside = contains(x, y),
        hits = sampleMesh(index, x, y);
      if (inside) expected++;
      if (inside && !hits.length) missing++;
      if (!inside && hits.length) excess++;
      if (hits.filter(h => h.interior).length > 1) overlap++;
    }
  }
  const area = count => count / (subdivisions * subdivisions);
  return {
    method: 'cell-center quadrature',
    subdivisions,
    units: 'sample-cell area',
    expectedArea: area(expected),
    missingArea: area(missing),
    excessArea: area(excess),
    overlapArea: area(overlap)
  };
}

export function gridDomain(fixture, policy) {
  const {width, height, heights} = fixture;
  const valid = (x, y) => Number.isFinite(heights[y * width + x]);
  return (x, y) => {
    if (x < 0 || y < 0 || x >= width - 1 || y >= height - 1) return false;
    const i = Math.floor(x),
      j = Math.floor(y);
    const a = valid(i, j),
      b = valid(i + 1, j),
      c = valid(i, j + 1),
      d = valid(i + 1, j + 1);
    if (policy === 'four-corners') return a && b && c && d;
    if (policy !== 'triangles') throw new Error('Unknown domain');
    return y - j <= x - i ? a && b && d : a && d && c;
  };
}
