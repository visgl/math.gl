// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mountUnfolding} from '../../../common/unfolding-polyhedron/app';
import '../../../common/unfolding-polyhedron/style.css';
const dispose = mountUnfolding(document.querySelector<HTMLElement>('#app')!);
window.addEventListener('pagehide', event => {
  if (!event.persisted) dispose();
});
