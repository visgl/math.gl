// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cesiumDerived = new Set([
  'modules/geometry/src/culling/lib/algorithms/bounding-box-from-points.ts',
  'modules/geometry/src/culling/lib/algorithms/bounding-sphere-from-points.ts',
  'modules/geometry/src/culling/lib/algorithms/compute-eigen-decomposition.ts',
  'modules/geometry/src/culling/lib/bounding-volumes/axis-aligned-bounding-box.ts',
  'modules/geometry/src/culling/lib/bounding-volumes/bounding-sphere.ts',
  'modules/geometry/src/culling/lib/bounding-volumes/bounding-volume.ts',
  'modules/geometry/src/culling/lib/bounding-volumes/oriented-bounding-box.ts',
  'modules/geometry/src/culling/lib/culling-volume.ts',
  'modules/geometry/src/culling/lib/perspective-frustum.ts',
  'modules/geometry/src/culling/lib/perspective-off-center-frustum.ts',
  'modules/geometry/src/culling/lib/plane.ts',
  'modules/geometry/src/culling/lib/ray.ts',
  'modules/geometry/culling/test/bench.ts',
  'modules/geometry/culling/test/lib/algorithms/bounding-sphere-from-points.spec.ts',
  'modules/geometry/culling/test/lib/bounding-volumes/bounding-sphere.spec.ts',
  'modules/geometry/culling/test/lib/bounding-volumes/oriented-bounding-box.spec.ts',
  'modules/geometry/culling/test/lib/culling-volume.spec.ts',
  'modules/geometry/culling/test/lib/perspective-frustum.spec.ts',
  'modules/geometry/culling/test/lib/perspective-off-center-frustum.spec.ts',
  'modules/geometry/culling/test/lib/plane.spec.ts',
  'modules/geometry/culling/test/lib/ray.spec.ts',
  'modules/dggs/src/s2-geometry/s2-token.ts',
  'modules/geometry/src/utils/attribute-compression.ts',
  'modules/geospatial/src/constants.ts',
  'modules/geospatial/src/ellipsoid-helpers/ellipsoid-transform.ts',
  'modules/geospatial/src/ellipsoid-helpers/scale-to-geodetic-surface.ts',
  'modules/geospatial/src/ellipsoid-tangent-plane.ts',
  'modules/geospatial/src/ellipsoid.ts',
  'modules/geospatial/src/lng-lat-rectangle.ts',
  'modules/geospatial/src/make-obb-from-region.ts',
  'modules/geospatial/src/type-utils.ts',
  'modules/geospatial/test/bench.ts',
  'modules/geospatial/test/ellipsoid-tangent-plane.spec.ts',
  'modules/geospatial/test/ellipsoid/ellipsoid-transform.spec.ts',
  'modules/geospatial/test/ellipsoid/ellipsoid.bench.ts',
  'modules/geospatial/test/ellipsoid/ellipsoid.spec.ts',
  'modules/geospatial/test/make-obb-from-region.spec.ts',
  'modules/geospatial/test/type-utils.spec.ts',
  'modules/geometry/polygon/test/bench.ts'
]);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.css', '.html']);
const files = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'})
  .split('\0')
  .filter((file) => extensions.has(extname(file)));
assert(files.length > 0, 'Source header check must inspect tracked source files');
for (const file of files) {
  const header = readFileSync(resolve(root, file), 'utf8')
    .split('\n')
    .slice(0, 16)
    .map((line) => line.replace(/^\s*(?:\/\/|#|\*|<!--)?\s*/, ''))
    .join('\n');
  assert(
    /^SPDX-License-Identifier: \S.+$/m.test(header),
    file + ' must declare its license with SPDX'
  );
  assert(
    /^SPDX-FileCopyrightText: \S.+$/m.test(header),
    file + ' must declare its copyright holders with SPDX'
  );
  if (file === 'modules/core/src/spheroid.ts') {
    assert(
      header.includes('proj4js') &&
        header.includes('Mike Adair') &&
        header.includes('Calvin Metcalf'),
      'Shared spheroid arithmetic must retain proj4js attribution'
    );
    assert(header.includes('PROJ4-LICENSE.md'), 'Shared arithmetic must link its packaged license');
  }
  if (cesiumDerived.has(file)) {
    assert(
      /^SPDX-FileCopyrightText: Copyright 2011-2018 CesiumJS Contributors$/m.test(header),
      file + ' must retain the CesiumJS copyright notice'
    );
    assert(
      /^SPDX-License-Identifier: .*Apache-2\.0/m.test(header),
      file + ' must retain its Apache-2.0 terms'
    );
    assert(
      /^SPDX-FileComment: .*Cesium/m.test(header),
      file + ' must identify Cesium provenance with SPDX'
    );
  }
}
console.log(
  'SPDX license and copyright headers passed for ' + files.length + ' tracked source files.'
);
