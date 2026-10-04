// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original worker evaluation workload; engine keeps its existing equation attribution.
import {ProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {universalTransverseMercator} from '@math.gl/projection/projections/utm';
export function createWorkerEngine(to: string) {
  return new ProjectionEngine({to, projections: [mercator, universalTransverseMercator]});
}
