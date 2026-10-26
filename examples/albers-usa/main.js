// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createAlbersMap} from './map.js';
import {createAlbersScene} from './scene.js';
import {createView} from './view.js';
import {bindControls} from './controls.js';
import './style.css';

/** Wire geographic data, drawing, and UI; every mounted example owns its resources. */
export function mountAlbers(root, options) {
  const view = createView(root, options);
  const scene = createAlbersScene(view.svg, createAlbersMap());
  const unbind = bindControls(view, scene);
  return () => {
    unbind();
    scene.dispose();
    root.replaceChildren();
  };
}
