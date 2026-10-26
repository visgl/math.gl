// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mountUnfolding} from '../unfolding-polyhedron/app';
import {markup} from './view';
import {createMyriahedralLayout} from './layout';
import {createLandTexture} from './land-texture';

/** Reuse independently implemented hinges, spherical textures and picking. */
export function mountMyriahedral(root: HTMLElement) {
  return mountUnfolding(root, markup, {
    buildLayout: createMyriahedralLayout,
    landTexture: createLandTexture(),
    northUp: true
  });
}
