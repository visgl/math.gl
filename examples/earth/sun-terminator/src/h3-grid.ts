// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getRes0Cells, cellToBoundary} from 'h3-js';
import {getMap} from './view-adapter.ts';
/** Let the shared chart clipper split H3 outlines at every face cut. */
export function getH3GridPaths() {
  const map = getMap('h3');
  return getRes0Cells()
    .flatMap(cell => map.projectLine(cellToBoundary(cell, true)))
    .map(part =>
      part.coordinates.map(p =>
        Object.assign([...p, 0], {part: map.regions.findIndex(r => r.id === part.regionId)})
      )
    );
}
