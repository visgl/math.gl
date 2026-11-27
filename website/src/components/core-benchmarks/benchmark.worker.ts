// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Bench} from 'probe.gl/bench';
import {coreBench} from '../../../../modules/core/test/bench';

self.onmessage = async ({data}: MessageEvent<{suite: 'core' | 'all'}>) => {
  try {
    const suite = new Bench({
      iterations: undefined,
      minIterations: 5,
      time: 80,
      maxTimeMs: 1000,
      log: entry => self.postMessage({type: 'entry', entry})
    });
    if (data.suite === 'core') coreBench(suite, false);
    else {
      const {default: addBenchmarks} = await import('../../../../test/bench/modules.bench');
      addBenchmarks(suite, false);
    }
    await suite.calibrate().run();
    self.postMessage({type: 'complete'});
  } catch (error) {
    self.postMessage({type: 'error', message: error instanceof Error ? error.message : String(error)});
  }
};
