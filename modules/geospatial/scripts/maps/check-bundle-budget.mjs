// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
const fixtures = {
  engine: "export {MapEngine} from '@math.gl/geospatial/maps';",
  albersPoints:
    "import {MapEngine} from '@math.gl/geospatial/maps'; import {albersUsaMapPreset} from '@math.gl/geospatial/maps/presets'; export const map = new MapEngine({version:1,id:'usa',definition:{type:'albers-usa'}},{presets:[albersUsaMapPreset]});",
  albersGeometry:
    "import {MapEngine} from '@math.gl/geospatial/maps'; import {albersUsaMapPreset} from '@math.gl/geospatial/maps/presets'; import {mapGeometry} from '@math.gl/geospatial/maps/geometry'; export const map = new MapEngine({version:1,id:'usa',definition:{type:'albers-usa'}},{presets:[albersUsaMapPreset],geometry:mapGeometry});",
  rasterSurface:
    "export {prepareMapSurface,prepareProjectionSurface} from '@math.gl/geospatial/maps/surfaces';",
  surfaceTransition:
    "export {prepareMapTransitionMeshAsync} from '@math.gl/geospatial/maps/transitions';",
  featureTransition: "export {mapTransitions} from '@math.gl/geospatial/maps/transitions';",
  fullCatalogue: "export {mapPresets} from '@math.gl/geospatial/maps/presets';"
};
const limits = process.argv.includes('--measure')
  ? null
  : JSON.parse(
      readFileSync(new URL('../../test/maps/bundle-budgets.json', import.meta.url), 'utf8')
    );
const measurements = {};
for (const [name, contents] of Object.entries(fixtures)) {
  const result = await build({
    stdin: {contents, resolveDir: fileURLToPath(new URL('../../', import.meta.url))},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false,
    metafile: true
  });
  const retained = Object.entries(Object.values(result.metafile.outputs)[0].inputs)
    .filter(([, v]) => v.bytesInOutput > 0)
    .map(([p]) => p);
  if (['engine', 'albersPoints', 'rasterSurface', 'surfaceTransition'].includes(name)) {
    assert(
      !retained.some(p =>
        /polygon-clipping|maps\/elastic|maps\/myriahedral|world-kernels|classes\/matrix4/.test(p)
      ),
      name + ' retained optional geometry or unrelated presets'
    );
  }
  if (['albersPoints', 'albersGeometry'].includes(name))
    assert(
      !retained.some(p =>
        /maps\/(?:elastic|h3-face-map|myriahedral|world-kernels|regional-map|quincuncial-star)/.test(
          p
        )
      ),
      name + ' retained unrelated presets'
    );
  if (name === 'albersGeometry' || name === 'featureTransition')
    assert(
      retained.some(p => p.includes('polygon-clipping')),
      name + ' must exercise polygon support'
    );
  const bytes = result.outputFiles[0].contents;
  measurements[name] = {minified: bytes.length, gzip: gzipSync(bytes, {level: 9}).length};
  if (limits)
    for (const metric of ['minified', 'gzip'])
      assert(
        measurements[name][metric] <= limits[name][metric],
        `${name} ${metric}: ${measurements[name][metric]} exceeds ${limits[name][metric]}`
      );
}
console.log(JSON.stringify(measurements, null, 2));
