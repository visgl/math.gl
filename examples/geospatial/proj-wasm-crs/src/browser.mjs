// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runExample} from './crs-resolution/index.mjs';
import {runRasterExample} from './raster-preparation/index.mjs';

const output = document.querySelector('#result');
const result = runExample().then(async crs => ({...crs, raster: await runRasterExample()}));
result
  .then(
    value => {
      output.textContent = JSON.stringify(value, null, 2);
    },
    error => {
      output.textContent = error.stack;
    }
  )
  .finally(() => {
    output.setAttribute('aria-busy', 'false');
  });
