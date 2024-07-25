// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.

import javascriptBench from './lib/javascript.bench';
import commonBench from './lib/common.bench';

// import classesBench from './classes/classes.bench';
import vector2Bench from './classes/vector2.bench';
import vector3Bench from './classes/vector3.bench';
import vector4Bench from './classes/vector4.bench';
import matrix4Bench from './classes/matrix4.bench';

export function coreBench(suite, addReferenceBenchmarks) {
  // classesBench(suite, addReferenceBenchmarks);
  commonBench(suite, addReferenceBenchmarks);
  javascriptBench(suite, addReferenceBenchmarks);

  matrix4Bench(suite, addReferenceBenchmarks);

  vector2Bench(suite, addReferenceBenchmarks);
  vector3Bench(suite, addReferenceBenchmarks);
  vector4Bench(suite, addReferenceBenchmarks);

  return suite;
}
