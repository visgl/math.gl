// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// math.gl, MIT license

// @ts-expect-error tsconfig configuration issue?
import type {Bench} from 'probe.gl/bench';

import {coreBench} from '../../modules/core/test/bench';
import {geospatialBench} from '../../modules/geospatial/test/bench';
import {turfBench} from '../../modules/geospatial/test/turf-bench';
import {cullingBench} from '../../modules/geometry/test/culling/bench';
import {polygonBench} from '../../modules/geometry/test/polygon/bench';
import {projectionBench} from '../../modules/geospatial/test/projection/bench';
import {geoarrowBench} from '../../modules/geospatial/test/geoarrow/bench';

export default function addBenchmarks(suite: Bench, addReferenceBenchmarks: boolean): Bench {
  coreBench(suite, addReferenceBenchmarks);
  geospatialBench(suite, addReferenceBenchmarks);
  turfBench(suite);
  cullingBench(suite, addReferenceBenchmarks);
  polygonBench(suite, addReferenceBenchmarks);
  geoarrowBench(suite);
  projectionBench(suite);

  return suite;
}
