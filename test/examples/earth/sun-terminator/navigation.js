// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {projectCutMap, getCutViewports} from '../../../../examples/earth/sun-terminator/src/cut-maps.js';
import {geographicCenter} from '../../../../examples/earth/sun-terminator/src/camera.js';
import {Deck} from '@deck.gl/core';
import {mountSunTerminator} from '../../../../examples/earth/sun-terminator/src/app.js';
import '../../../../examples/earth/sun-terminator/src/styles.css';

// Observe the actual renderer in this fixture, without adding debug state to the app.
const setProps = Deck.prototype.setProps;
Deck.prototype.setProps = function (props) {
  window.navigationDeck = this;
  return setProps.call(this, props);
};
window.disposeExample = mountSunTerminator(document.querySelector('.sun-terminator'));

window.geographicCenter = id => geographicCenter(id, window.navigationDeck.getViewports()[0]);

window.projectCutMap = projectCutMap;
window.getCutViewports = id => getCutViewports(id, window.navigationDeck.getViewports()[0]);
