// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createCRSResolver} from '@math.gl/geospatial/crs';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {runBatchExample} from './batch-example.mjs';
import {createProjWasmProvider} from './provider.mjs';

/** Runs the same real database/coordinate workflow in Node and a browser. */
export async function runExample() {
  const proj = await import('proj-wasm');
  await proj.init({workers: 1});
  let backend;
  let transformer;
  let normalized;
  let context;
  try {
    backend = await createProjWasmProvider(proj);
    const resolver = createCRSResolver({providers: [backend.provider]});
    const engine = new FullProjectionEngine({resolver});
    const resolution = await resolver.resolve('EPSG:8857'); // WGS84 / Equal Earth
    const native = await engine.createProjectionAsync({to: 'EPSG:8857'});
    const input = [12, 55, 123]; // Explicit longitude, latitude, ellipsoidal height.
    const mathgl = native.project(input); // Synchronous; database lookup has finished.

    // A separate example of asynchronous proj-wasm execution. Normalize authority
    // axes for visualization instead of assuming EPSG:4326 is longitude-first.
    context = await proj.contextCreate();
    await proj.projContextSetEnableNetwork({context, enabled: 0});
    transformer = await proj.projCreateCrsToCrs({
      context,
      source_crs: 'EPSG:4326',
      target_crs: 'EPSG:8857'
    });
    normalized = await proj.projNormalizeForVisualization({
      context,
      obj: transformer
    });
    const coordinates = await proj.coordArray(1);
    await proj.setCoords(coordinates, [[...input, 0]]);
    await proj.projTransArray({
      p: normalized,
      direction: proj.PJ_FWD,
      n: 1,
      coord: coordinates
    });
    const wasm = (await proj.getCoords(coordinates, 0)).slice(0, 3);

    // Resolution does not imply native execution support for a compound CRS.
    const compound = await resolver.resolve('EPSG:7405');
    let unsupported;
    try {
      await engine.createProjectionAsync({to: 'EPSG:7405'});
    } catch (error) {
      unsupported = error.message;
    }
    return {
      batch: await runBatchExample(proj),
      input,
      mathgl,
      wasm,
      inverse: native.unproject(mathgl),
      lookup: resolution.lookups[0],
      compoundType: compound.input.type,
      unsupported
    };
  } finally {
    try {
      if (normalized) await proj.projDestroy({pj: normalized});
      if (transformer) await proj.projDestroy({pj: transformer});
      if (context) await proj.projContextDestroy({context});
      if (backend) await backend.dispose();
    } finally {
      // This standalone example owns the pool. Embedded applications own their pool lifecycle.
      await proj.shutdown();
    }
  }
}
