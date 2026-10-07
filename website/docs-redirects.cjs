// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {mkdir, writeFile} = require('node:fs/promises');
const {dirname, join} = require('node:path');

// Preserve bookmarks when guides move into their owning modules.
const movedGuides = {
  "developer-guide/external-frameworks": "modules/core#interoperability",
  "developer-guide/math/transformations": "modules/core/developer-guide/transformations",
  "developer-guide/math/view-and-projection": "modules/core/developer-guide/view-and-projection",
  "developer-guide/math/homogeneous-coordinates": "modules/core/developer-guide/homogeneous-coordinates",
  "developer-guide/math/coordinate-systems": "modules/core/developer-guide/coordinate-systems",
  "developer-guide/math/rotations": "modules/core/developer-guide/rotations",
  "developer-guide/math/floating-point": "modules/core/developer-guide/floating-point",
  "developer-guide/geospatial/dggs": "modules/dggs/developer-guide/dggs",
  "developer-guide/geospatial/coordinate-reference-systems": "modules/crs/developer-guide/coordinate-reference-systems",
  "developer-guide/geospatial/geospatial-models": "modules/geoid/developer-guide/geospatial-models",
  "developer-guide/geospatial/web-mercator-coordinates": "modules/web-mercator/developer-guide/web-mercator-coordinates",
  "developer-guide/geospatial/web-mercator-offset-accuracy": "modules/web-mercator/developer-guide/web-mercator-offset-accuracy"
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
