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
    self.postMessage({
      mesh,
      metrics,
      segments: fixture.segments,
      domainSegments: fixture.domainSegments
    });
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
