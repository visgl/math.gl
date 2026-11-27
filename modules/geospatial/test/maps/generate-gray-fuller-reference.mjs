// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Install d3-geo-polygon@2.0.1 in a temporary directory. Pass the absolute path
// to its src/index.js as the first argument. No production dependency is added.
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {geoAirocean} = await import(pathToFileURL(process.argv[2]).href);
const projection = geoAirocean().scale(1).translate([0, 0]).center([0, 0]);
const samples = [];
for (const lon of [-167, -120, -73, -20, 25, 64, 101, 154])
  for (const lat of [-81, -52, -21, 14, 43, 77])
    samples.push({source: [lon, lat], expected: projection([lon, lat])});
writeFileSync(new URL('./gray-fuller-reference.json', import.meta.url), JSON.stringify({
  source: 'd3-geo-polygon 2.0.1 geoAirocean, scale(1).translate([0,0]).center([0,0]); y down', samples
}, null, 2) + '\n');
