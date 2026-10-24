// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original Node/browser composition of independent C8 and pinned G7 accuracy controls.
import {qualifyC8 as local, provenance as c8} from './c8-qualification';
import {prepareJobs, nativeProvenance} from './g7-benchmark-entry';
export const provenance = {c8, g7: nativeProvenance};
export function qualifyC8(includeRegressions = true) {
  const rows = local(includeRegressions);
  for (const job of prepareJobs().filter(j => j.nativeOp))
    job.errors.forEach((usage, index) =>
      rows.push({
        id: `${job.nativeOp}/${index}`,
        family: 'C++ G7 baseline controls',
        passed: Number.isFinite(usage) && usage <= 1,
        budgetUsage: usage,
        checks: [{name: 'native output budget ratio', error: usage, budget: 1}]
      })
    );
  return rows;
}
