// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mountMyriahedral} from './app';
import './style.css';
const dispose = mountMyriahedral(document.querySelector<HTMLElement>('#app')!);
window.addEventListener('pagehide', dispose, {once: true});
