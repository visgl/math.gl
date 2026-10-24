// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';

// Run with the path to an installed d3-geo-projection@4.0.0 src/index.js.
// D3 is a reference generator only, not a runtime or test dependency.
const {geoPeirceQuincuncial, geoBerghaus} = await import(pathToFileURL(process.argv[2]).href);
const points = [
  [0, 0], [30, 20], [-40, -30], [89, 40], [91, 40],
  [140, 60], [170, 12], [-130, -50], [140, -60], [-175, 3]
];
const cases = [];
for (const type of ['peirce-quincuncial', 'berghaus']) {
  for (const lobes of type === 'berghaus' ? [3, 5, 8] : [undefined]) {
    const projection = (type === 'berghaus' ? geoBerghaus().lobes(lobes) : geoPeirceQuincuncial())
      .rotate([0, 0, 0]).center([0, 0]).scale(1).translate([0, 0]);
    cases.push({
      type,
      ...(lobes ? {lobes} : {}),
      samples: points.map(source => {
        const [x, y] = projection(source);
        return {source, expected: [x, -y]};
      })
    });
  }
}
writeFileSync(
  new URL('./quincuncial-star-reference.json', import.meta.url),
  JSON.stringify({
    reference: 'd3-geo-projection 4.0.0; rotate/center/translate zero, scale 1; negate screen Y',
    cases
  }, null, 2) + '\n'
);
