// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountProjectionLab} from './main.mjs';
const lab=mountProjectionLab(document.querySelector('#lab'));
window.projectionLab=lab;
window.addEventListener('pagehide',event=>{if(!event.persisted)void lab.dispose();});
