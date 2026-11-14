// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import * as terrain from '@math.gl/geospatial/terrain';
import {buildCandidate, qualify} from './qualify.mjs';
self.onmessage = async ({data: {url, algorithm}}) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Reference download failed: ${response.status}`);
    // Vite serves .gz with Content-Encoding, which fetch has already decoded.
    // Static hosts can serve the same file as raw gzip bytes instead.
    const fixture = response.headers.get('content-encoding')?.includes('gzip')
      ? await response.json()
      : JSON.parse(
          await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text()
        );
    if (fixture.name === 'sierra' && ['martini', 'delatin'].includes(algorithm)) {
      self.postMessage({
        unsupported: 'Incomplete data: adaptive meshing requires a complete grid.'
      });
      return;
    }
    const mesh = buildCandidate(terrain, fixture, algorithm);
    const metrics = qualify(fixture, mesh);
    const field = new terrain.HeightField({
      width: fixture.width,
      height: fixture.height,
      heights: Float64Array.from(fixture.heights, h => h ?? NaN)
    });
    const xy = ({positions, indices}) => ({
      indices,
      gridCoordinates: Float64Array.from(
        {length: (positions.length / 3) * 2},
        (_, i) => positions[Math.floor(i / 2) * 3 + (i % 2)]
      )
    });
    const study = fixture.name === 'pacific' && algorithm !== 'constrained';
    const candidate = xy(mesh);
    const coverage = terrain.certifyTerrainMeshCoverage(field, candidate);
    const studyCoverage = study
      ? terrain.certifyTerrainMeshCoverage(field, candidate, {reference: xy(fixture)})
      : null;
    self.postMessage({
      mesh,
      metrics,
      coverage,
      studyCoverage,
      segments: fixture.segments,
      domainSegments: fixture.domainSegments
    });
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
