// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {mkdir, writeFile} = require('node:fs/promises');
const {dirname, join} = require('node:path');

// Preserve bookmarks when guides move into their owning modules.
const movedGuides = {
  "modules/geospatial/geoarrow/api-reference/geoarrow": "modules/arrow/geoarrow-utils/api-reference/geoarrow",
  "modules/geospatial/projection/scorecard-methodology": "modules/geospatial/projection/scorecard#reproduction",
  "modules/geospatial/guide/crs": "modules/geospatial/crs/developer-guide/coordinate-reference-systems",
  "modules/web-mercator/developer-guide/web-mercator-offset-accuracy": "modules/web-mercator/developer-guide/web-mercator-coordinates#accuracy",
  "modules/web-mercator/guide": "modules/web-mercator/developer-guide/web-mercator-coordinates",
  "modules/geometry/guide": "modules/geometry/spatial-index",
  "modules/geometry/guide/spatial-index": "modules/geometry/spatial-index",
  "modules/earth/guide": "modules/earth/geoid/developer-guide/geospatial-models",
  "modules/earth/guide/geoid": "modules/earth/geoid/developer-guide/geospatial-models",
  "modules/dggs/guide": "modules/dggs/developer-guide/dggs",
  "modules/geospatial/geoarrow/physical-layouts": "modules/arrow/developer-guide/geoarrow#understand-the-physical-layout",
  "modules/geospatial/geoarrow/geometry-streams": "modules/arrow/developer-guide/geoarrow#stream-clip-and-tessellate",
  "modules/geospatial/geoarrow/migration-guide": "modules/arrow/developer-guide/geoarrow#replace-an-existing-runtime-integration",
  "modules/geospatial/geoarrow-utils/physical-layouts": "modules/arrow/developer-guide/geoarrow#understand-the-physical-layout",
  "modules/geospatial/geoarrow-utils/geometry-streams": "modules/arrow/developer-guide/geoarrow#stream-clip-and-tessellate",
  "modules/geospatial/geoarrow-utils/migration-guide": "modules/arrow/developer-guide/geoarrow#replace-an-existing-runtime-integration",
  "modules/geospatial/guide/geoarrow": "modules/arrow/developer-guide/geoarrow",
  "modules/geometry/unfolding-earth": "modules/geometry/api-reference/hinge-tree#unfolding-earth",
  "developer-guide/security": "developer-guide#process-external-data-and-code-safely",
  "developer-guide/get-started": "developer-guide#install-and-make-a-calculation",
  "developer-guide/debugging": "developer-guide#catch-mistakes-during-development",
  "developer-guide/performance": "developer-guide#reuse-results-in-repeated-work",
  "developer-guide/bundling": "developer-guide#keep-application-bundles-small",
  "developer-guide/working-with-ai": "developer-guide#work-with-an-ai-coding-agent",
  "developer-guide/root-exports-migration": "upgrade-guide#migrating-to-root-exports",
  "bibliography": "references-and-credits",
  "developer-guide/external-frameworks": "modules/core#interoperability",
  "developer-guide/math/transformations": "modules/core/developer-guide/transformations",
  "developer-guide/math/view-and-projection": "modules/core/developer-guide/view-and-projection",
  "developer-guide/math/homogeneous-coordinates": "modules/core/developer-guide/homogeneous-coordinates",
  "developer-guide/math/coordinate-systems": "modules/core/developer-guide/coordinate-systems",
  "developer-guide/math/rotations": "modules/core/developer-guide/rotations",
  "developer-guide/math/floating-point": "modules/core/developer-guide/floating-point",
  "developer-guide/geospatial/dggs": "modules/dggs/developer-guide/dggs",
  "developer-guide/geospatial/coordinate-reference-systems": "modules/geospatial/crs/developer-guide/coordinate-reference-systems",
  "developer-guide/geospatial/geospatial-models": "modules/earth/geoid/developer-guide/geospatial-models",
  "developer-guide/geospatial/web-mercator-coordinates": "modules/web-mercator/developer-guide/web-mercator-coordinates",
  "developer-guide/geospatial/web-mercator-offset-accuracy": "modules/web-mercator/developer-guide/web-mercator-coordinates#accuracy",
  "modules/core/arrow": "modules/arrow",
  "modules/core/arrow/arrow-schema-utils": "modules/arrow/arrow-schema-utils",
  "modules/core/arrow/arrow-table-transport": "modules/arrow/arrow-table-transport",
  "modules/core/arrow/indexed-arrow-table": "modules/arrow/indexed-arrow-table",
  "modules/core/arrow/mapped-arrow-table": "modules/arrow/mapped-arrow-table",
  "modules/core/arrow/split-arrow-buffers": "modules/arrow/split-arrow-buffers",
  "modules/core/utf8": "modules/arrow/utf8",
  "modules/geospatial/developer-guide/geoarrow": "modules/arrow/developer-guide/geoarrow",
  "modules/geospatial/geoarrow-utils": "modules/arrow/geoarrow-utils",
  "modules/geospatial/geoarrow-utils/api-reference/geoarrow": "modules/arrow/geoarrow-utils/api-reference/geoarrow",
  "modules/geospatial/geoarrow": "modules/arrow/geoarrow",
  "modules/geospatial/wkb": "modules/arrow/wkb",
  "modules/geospatial/wkb/api-reference/wkb": "modules/arrow/wkb/api-reference/wkb",
  "modules/core/tasks": "modules/tasks",
  "modules/core/tasks/api-reference/runtime": "modules/tasks/api-reference/runtime",
  "modules/core/tasks/api-reference/task-runner": "modules/tasks/api-reference/task-runner",
  "modules/core/tasks/developer-guide/benchmarks": "modules/tasks/developer-guide/benchmarks",
  "modules/core/tasks/developer-guide/custom-workers": "modules/tasks/developer-guide/custom-workers",
  "modules/core/tasks/developer-guide/execution": "modules/tasks/developer-guide/execution",
  "modules/core/tasks/developer-guide/migration": "modules/tasks/developer-guide/migration",
  "modules/core/tasks/developer-guide/persistent-resources": "modules/tasks/developer-guide/persistent-resources",
  "modules/core/tasks/developer-guide/shared-memory": "modules/tasks/developer-guide/shared-memory",
  "modules/core/tasks/developer-guide/task-runner": "modules/tasks/developer-guide/task-runner",
  "modules/core/tasks/developer-guide/wasm": "modules/tasks/developer-guide/wasm",
  "modules/core/developer-guide/workers": "modules/tasks/developer-guide/workers",
  "modules/core/guide/tasks": "modules/tasks"
};

module.exports = function docsRedirects(context) {
  return {
    name: 'module-guide-redirects',
    async postBuild({outDir}) {
      for (const [from, to] of Object.entries(movedGuides)) {
        const route = `${context.baseUrl}docs/${to}`;
        const file = join(outDir, `docs/${from}.html`);
        await mkdir(dirname(file), {recursive: true});
        await writeFile(
          file,
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Guide moved</title><link rel="canonical" href="${route}"><meta http-equiv="refresh" content="0;url=${route}"><script>const destination = new URL(${JSON.stringify(route)}, location.href);destination.search = location.search;if (!destination.hash) destination.hash = location.hash;location.replace(destination.href);</script></head><body><a href="${route}">Continue to the guide</a></body></html>`
        );
      }
    }
  };
};
