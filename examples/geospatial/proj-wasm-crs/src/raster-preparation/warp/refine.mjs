// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Example-owned evaluation state machine. The driver supplies synchronous points or
// asynchronous batches; neither callbacks nor engine resources cross this boundary.
// Conforming split templates follow geometry's subdivideTriangleMesh implementation.
const probes = [[1/3,1/3,1/3], [.5,.25,.25], [.25,.5,.25], [.25,.25,.5],
  ...[0,1,2].flatMap(i => [.25,.5,.75].map(t => {
    const w = [0,0,0]; w[i] = 1-t; w[(i+1)%3] = t; return w;
  }))];
const blend = (p, w) => [0,1].map(k => p.reduce((v, q, i) => v + q[k]*w[i], 0));
const key = (a,b) => a < b ? `${a}:${b}` : `${b}:${a}`;
export class WarpError extends RangeError {
  constructor(reason, message) { super(message); this.reason = reason; }
}

/** Sampled interpolation error, not a continuous accuracy certificate. Input seed
 * triangles must lie inside a single continuous chart. Invalid samples fail the job;
 * there is deliberately no partial-mesh/omit-triangle success path. */
export function* refineWarp(mesh, {tolerance = .5, maxEdgeLength = Infinity,
  clipBounds, maxDepth = 16, maxVertices = 100000, maxTriangles = 150000, maxSamples = 3000000} = {}) {
  if (!(Number.isFinite(tolerance) && tolerance > 0) || !(maxEdgeLength > 0) ||
    !Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 20 ||
    ![maxVertices,maxTriangles,maxSamples].every(x => Number.isSafeInteger(x) && x > 0) ||
    (clipBounds && (clipBounds.length !== 4 || !clipBounds.every(Number.isFinite) || clipBounds[0]>=clipBounds[2] || clipBounds[1]>=clipBounds[3])) ||
    !mesh || mesh.positions.length % 2 || mesh.indices.length % 3)
    throw new WarpError('input', 'Invalid warp options or mesh');
  const positions = Array.from({length: mesh.positions.length/2}, (_, i) => Array.from(mesh.positions.slice(i*2,i*2+2)));
  let faces = Array.from({length: mesh.indices.length/3}, (_, i) => Array.from(mesh.indices.slice(i*3,i*3+3)));
  if (positions.some(p => !p.every(Number.isFinite)) || faces.flat().some(i => !Number.isInteger(i) || i < 0 || i >= positions.length))
    throw new WarpError('input', 'Invalid seed coordinates or indices');
  let samples = 0, rounds = 0, maximumError = 0;
  function limits() {
    if (positions.length > maxVertices || faces.length > maxTriangles)
      throw new WarpError('limit', 'Warp mesh budget exhausted');
  }
  function* evaluate(points) {
    samples += points.length;
    if (samples > maxSamples) throw new WarpError('limit', 'Warp sample budget exhausted');
    if (!points.length) return [];
    const values = yield new Float64Array(points.flat());
    if (!(values instanceof Float64Array) || values.length !== points.length*2 || !values.every(Number.isFinite))
      throw new WarpError('domain', 'Chart evaluator returned invalid coordinates');
    return Array.from({length: points.length}, (_, i) => [values[i*2],values[i*2+1]]);
  }
  limits();
  const transformed = yield* evaluate(positions);
  for (let depth = 0; ; depth++) {
    rounds++;
    // Bound allocations before constructing the probe frontier.
    if (faces.length * probes.length + samples > maxSamples)
      throw new WarpError('limit', 'Warp sample budget exhausted');
    const points = faces.flatMap(f => probes.map(w => blend(f.map(i => positions[i]), w)));
    const actual = yield* evaluate(points);
    const edges = new Set(); maximumError = 0;
    faces.forEach((f, i) => {
      let split = false;
      const tested=[...f.map(k=>transformed[k]),...actual.slice(i*probes.length,(i+1)*probes.length)];
      // A sampled exclusion policy, qualified against independent coverage probes.
      // All vertices and edge/interior probes must lie beyond the same image edge.
      if (clipBounds && [0,1].some(k=>tested.every(p=>p[k]<clipBounds[k]) || tested.every(p=>p[k]>clipBounds[k+2]))) return;
      probes.forEach((w, j) => {
        const linear = blend(f.map(k => transformed[k]), w);
        const exact = actual[i*probes.length+j];
        const error = Math.hypot(exact[0]-linear[0],exact[1]-linear[1]);
        maximumError = Math.max(maximumError, error);
        split ||= error > tolerance;
      });
      for (let j=0;j<3;j++) {
        const a=positions[f[j]], b=positions[f[(j+1)%3]];
        split ||= Math.hypot(a[0]-b[0],a[1]-b[1]) > maxEdgeLength;
      }
      if (split) for (let j=0;j<3;j++) edges.add(key(f[j], f[(j+1)%3]));
    });
    if (!edges.size) return {sourcePositions: new Float64Array(positions.flat()),
      positions: new Float64Array(transformed.flat()), indices: new Uint32Array(faces.flat()),
      diagnostics: {samples, rounds, maximumError, vertices: positions.length, triangles: faces.length, omittedTriangles: 0}};
    if (depth === maxDepth) throw new WarpError('limit', 'Warp refinement depth exhausted');
    const midpoint = new Map(), previousLength = positions.length, next = [];
    function mid(a,b) {
      const k=key(a,b); if (!edges.has(k)) return -1;
      if (!midpoint.has(k)) {
        if (positions.length >= maxVertices) throw new WarpError('limit', 'Warp vertex budget exhausted');
        midpoint.set(k, positions.length); positions.push(blend([positions[a],positions[b]],[.5,.5]));
      }
      return midpoint.get(k);
    }
    function emit(...f) {
      if (next.length >= maxTriangles) throw new WarpError('limit', 'Warp triangle budget exhausted');
      next.push(f);
    }
    for (const [a,b,c] of faces) {
      const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a), n=Number(ab>=0)+Number(bc>=0)+Number(ca>=0);
      if (!n) emit(a,b,c);
      else if (n===3) {emit(a,ab,ca);emit(ab,b,bc);emit(ca,bc,c);emit(ab,bc,ca);}
      else {
        const v=[a,b,c], m=[ab,bc,ca];
        const start=n===1 ? m.findIndex(i=>i>=0) : (m.findIndex(i=>i<0)+1)%3;
        const x=v[start],y=v[(start+1)%3],z=v[(start+2)%3],xy=m[start],yz=m[(start+1)%3];
        if(n===1){emit(x,xy,z);emit(xy,y,z);}
        else {emit(y,yz,xy);emit(x,xy,z);emit(xy,yz,z);}
      }
    }
    faces=next; limits();
    for (const p of yield* evaluate(positions.slice(previousLength))) transformed.push(p);
  }
}

export function runWarpSync(mesh, evaluate, options) {
  const iterator = refineWarp(mesh, options);
  let step = iterator.next();
  while (!step.done) {
    const output = new Float64Array(step.value.length);
    for (let i=0;i<output.length;i+=2) {
      const p = evaluate([step.value[i],step.value[i+1]]);
      if (!p || p.length !== 2 || !p.every(Number.isFinite)) throw new WarpError('domain', 'Invalid chart sample');
      output.set(p,i);
    }
    step=iterator.next(output);
  }
  return step.value;
}
