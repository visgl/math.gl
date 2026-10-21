// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mountUnfolding} from './app';
import './style.css';
const dispose = mountUnfolding(document.querySelector<HTMLElement>('#app')!);
window.addEventListener('pagehide', dispose, {once: true});
