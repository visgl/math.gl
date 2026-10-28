// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/tasks';
await createWorker(mesh=>({triangles:mesh.indices.length/3,chart:mesh.chart,
  checksum:mesh.positions.reduce((s,x)=>s+x,0)+mesh.uv.reduce((s,x)=>s+x,0),
  rowIdentity:mesh.sourceRows.every(row=>row===0)}));
