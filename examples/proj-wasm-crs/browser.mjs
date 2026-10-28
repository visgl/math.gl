// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runExample} from './example.mjs';

globalThis.exampleResult = runExample();
globalThis.exampleResult.then(
  (result) => {
    document.querySelector('#result').textContent = JSON.stringify(result, null, 2);
    globalThis.exampleComplete = true;
  },
  (error) => {
    document.querySelector('#result').textContent = error.stack;
    globalThis.exampleComplete = true;
  }
);
