// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import land from '../unfolding-polyhedron/data/land.json';

/** Rasterize the repository's public-domain Natural Earth polygons, not demo imagery. */
export function createLandTexture(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#507fa5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#efc65b';
  for (const polygon of land) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * canvas.width;
        const y = ((90 - lat) / 180) * canvas.height;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
    }
    context.fill('evenodd');
  }
  return canvas;
}
