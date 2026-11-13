// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useEffect, useRef, useState} from 'react';
import TerrainControls from './terrain-controls';
const references = import.meta.glob('./qualification/artifacts/*.json.gz', {
  query: '?url',
  import: 'default',
  eager: true
});
const number = (value, missing = 'uncovered') => (value === null ? missing : value.toFixed(3));

export default function BoundaryLab({controlsRoot}) {
  const [dataset, setDataset] = useState('pacific');
  const [tolerance, setTolerance] = useState(20);
  const [algorithm, setAlgorithm] = useState('delatin');
  const [overlay, setOverlay] = useState(true);
  const [result, setResult] = useState(null);
  const canvas = useRef(null);
  const tolerances = dataset === 'step' ? [0.25, 0.5, 1, 2] : [10, 20, 40];
  useEffect(() => {
    setResult(null);
    const worker = new Worker(new URL('./qualification/boundary-worker.js', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = ({data}) => setResult(data);
    worker.onerror = event => setResult({error: event.message});
    worker.postMessage({
      url: references[`./qualification/artifacts/${dataset}-${tolerance}.json.gz`],
      algorithm
    });
    return () => worker.terminate();
  }, [dataset, tolerance, algorithm]);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#102737';
    ctx.fillRect(0, 0, 768, 768);
    if (!result?.mesh) return;
    const {positions: p, indices: ids} = result.mesh;
    const crossing = new Set(result.metrics.boundary.crossingTriangles);
    const draw = highlighted => {
      ctx.beginPath();
      for (let t = 0; t < ids.length / 3; t++) {
        if (crossing.has(t) !== highlighted) continue;
        const points = [0, 1, 2].map(k => ids[t * 3 + k] * 3);
        ctx.moveTo(p[points[0]] * 3, p[points[0] + 1] * 3);
        for (const i of points.slice(1)) ctx.lineTo(p[i] * 3, p[i + 1] * 3);
        ctx.closePath();
      }
      ctx.strokeStyle = highlighted ? '#ff7c67' : '#779cad';
      ctx.lineWidth = highlighted ? 1.3 : 0.45;
      ctx.stroke();
    };
    draw(false);
    draw(true);
    const witness = result.coverage?.witness;
    if (witness) {
      ctx.beginPath();
      ctx.moveTo(witness.start[0] * 3, witness.start[1] * 3);
      ctx.lineTo(witness.end[0] * 3, witness.end[1] * 3);
      ctx.strokeStyle = '#ff4ada';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (overlay) {
      for (const [segments, color] of [
        [result.domainSegments, '#bcbcff'],
        [result.segments, '#fff06a']
      ]) {
        ctx.beginPath();
        for (const [a, b] of segments) {
          ctx.moveTo(a[0] * 3, a[1] * 3);
          ctx.lineTo(b[0] * 3, b[1] * 3);
        }
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = color;
        ctx.stroke();
      }
    }
  }, [result, overlay]);
  const m = result?.metrics;
  return (
    <section className="terrain-analysis">
      <TerrainControls target={controlsRoot}>
        <div className="terrain-boundary-controls">
          <label>
            Boundary study
            <select
              aria-label="Boundary dataset"
              value={dataset}
              onChange={e => {
                setDataset(e.target.value);
                setAlgorithm('regular');
                setTolerance(e.target.value === 'step' ? 0.5 : 20);
              }}
            >
              <option value="pacific">Pacific derived coastline</option>
              <option value="sierra">Sierra nodata outlines</option>
              <option value="step">Analytical oblique cliff</option>
            </select>
          </label>
          <label>
            Algorithm
            <select
              aria-label="Boundary algorithm"
              value={algorithm}
              onChange={e => setAlgorithm(e.target.value)}
            >
              {dataset === 'pacific' && (
                <option value="breakline">Constrained breakline mesh</option>
              )}
              {dataset === 'sierra' && (
                <option value="valid-domain">Nodata-aware adaptive mesh</option>
              )}
              <option value="regular">Current regular mesh</option>
              <option value="martini">Current MARTINI</option>
              <option value="delatin">Current Delatin</option>
              <option value="constrained">Precomputed constrained reference</option>
            </select>
          </label>
          <label>
            Tolerance
            <select
              aria-label="Boundary tolerance"
              value={tolerance}
              onChange={e => setTolerance(Number(e.target.value))}
            >
              {tolerances.map(v => (
                <option key={v} value={v}>
                  {v} m
                </option>
              ))}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={overlay} onChange={e => setOverlay(e.target.checked)} />
            Boundary and domain overlays
          </label>
          <p>
            Yellow: supplied boundary. Lavender: domain outline. Red: triangles crossed through
            their interior. Touches and coincident edges do not count.
          </p>
          <p>
            Constrained meshes are offline cdtr references. Current meshers run locally. Dense
            surface and area measurements are sampled estimates, not continuous certificates.
          </p>
          {dataset === 'pacific' && (
            <p>
              Study scenario: simplified height-positive coastline, small islands removed, enclosed
              water filled, and coastline samples excluded. This is not geographic ground truth.
            </p>
          )}
          {dataset === 'sierra' && (
            <p>
              The reference uses four-valid-corner cells. Current regular meshes preserve individual
              valid triangles. Both domains are measured below.
            </p>
          )}
        </div>
      </TerrainControls>
      <figure className="terrain-mesh-result" style={{maxWidth: 800}}>
        <figcaption>
          Boundary fidelity — {algorithm === 'constrained' ? 'precomputed reference' : algorithm}
        </figcaption>
        <canvas
          ref={canvas}
          width="768"
          height="768"
          style={{width: '100%', height: 'auto'}}
          aria-label="Mesh boundary comparison"
        />
        {!result && <p role="status">Computing independent qualification…</p>}
        {result?.unsupported && <p role="status">{result.unsupported}</p>}
        {result?.coverage && (
          <p data-testid="boundary-coverage">
            Exact {result.coverageDomain} coverage: {result.coverage.status}. Magenta marks one
            unmatched boundary interval. The reference domain is listed with the result.
          </p>
        )}
        {result?.error && <p role="alert">{result.error}</p>}
        {m && (
          <div data-testid="boundary-metrics">
            {!m.nodalToleranceSatisfied && (
              <p role="status">
                Fails independent nodal tolerance qualification. This precomputed reference is a
                counterexample, not a certified mesh.
              </p>
            )}
            <p>
              Interior / edge-only nodal max: {number(m.nodal.maxInteriorError, 'no probes')} /{' '}
              {number(m.nodal.maxEdgeOnlyError, 'no probes')} m.
            </p>
            <p>
              {m.triangles.toLocaleString()} triangles; actual tessellator: {m.tessellator}
            </p>
            <p>
              Study-mask nodal max / RMS: {number(m.nodal.maxError)} / {number(m.nodal.rmsError)} m;{' '}
              {m.nodal.uncovered} uncovered nodes.
              <br />
              All-valid-node max: {number(m.allValidNodes.maxError)} m; {m.allValidNodes.uncovered}{' '}
              uncovered nodes.
            </p>
            <p>
              4× sampled {m.surface.reference} max / RMS: {number(m.surface.maxError)} /{' '}
              {number(m.surface.rmsError)} m; {m.surface.uncovered} uncovered probes.
            </p>
            <p>
              4× sampled regular-triangle reference max / RMS:{' '}
              {number(m.triangulatedSurface.maxError)} / {number(m.triangulatedSurface.rmsError)} m.
            </p>
            <p>
              Boundary-height max: {number(m.boundary.maxHeightError)} m;{' '}
              {m.boundary.crossingTriangles.length} crossing triangles;{' '}
              {number(m.boundary.uncoveredLength)} uncovered sample-grid units across{' '}
              {m.boundary.uncoveredIntervals.length} intervals.
            </p>
            {Object.entries(m.coverage).map(([name, c]) => (
              <p key={name}>
                {name}: expected / missing / excess / overlap area estimates ={' '}
                {number(c.expectedArea)} / {number(c.missingArea)} / {number(c.excessArea)} /{' '}
                {number(c.overlapArea)} sample cells.
              </p>
            ))}
          </div>
        )}
      </figure>
    </section>
  );
}
