// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountInfoBox} from '../../../common/info-box.js';
import {createAlbersMap} from './map.js';
import {createAlbersScene} from './scene.js';
import {createView} from './view.js';
import {bindControls} from './controls.js';
import './style.css';

/** Wire geographic data, drawing, and UI; every mounted example owns its resources. */
export function mountAlbers(root, options) {
  const view = createView(root, options);
  const disposeInfo = mountInfoBox(root.querySelector('.layer-controls'), {
    title: 'Albers USA',
    theme: 'sleek-light'
  });
  const disposeSlider = mountInfoBox(root.querySelector('.unfold-panel'), {
    title: 'Map unfolding',
    theme: 'sleek-light',
    variant: 'invisible'
  });
  const scene = createAlbersScene(view.svg, createAlbersMap());
  const unbind = bindControls(view, scene);
  return () => {
    disposeInfo();
    disposeSlider();
    unbind();
    scene.dispose();
    root.replaceChildren();
  };
}
