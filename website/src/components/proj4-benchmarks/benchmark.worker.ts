// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {runLiveBenchmark} from '../../../../modules/proj4/test/live-bench';
import type {BenchmarkOptions} from '../../../../modules/proj4/test/live-bench-types';

self.onmessage = ({data}: MessageEvent<BenchmarkOptions>) => {
  try {
    const summary = runLiveBenchmark(data, row => self.postMessage({type: 'row', row}));
    self.postMessage({type: 'complete', summary});
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
