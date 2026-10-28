// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runTask, WorkerFarm} from '@math.gl/core/tasks';
import {geometryTask} from './task.mjs';
import {fixture} from './fixture.mjs';
const select = document.querySelector('select'), status = document.querySelector('output');
const context = document.querySelector('canvas').getContext('2d');
let generation = 0;
async function render() {
  const revision = ++generation;
  status.textContent = 'Streaming in worker…';
  try {
    // Transfer fresh buffers; the original input is detached and must not be reused.
    const mesh = await runTask(geometryTask, {column: fixture(), projection: select.value}, {execution:'worker',inputOwnership:'transfer'});
    if (revision !== generation) return;
    context.clearRect(0,0,700,400);
    for(let i=0;i<mesh.indices.length;i+=3) {
      context.beginPath();
      for(let j=0;j<3;j++) {const n=mesh.indices[i+j]; context[j ? 'lineTo' : 'moveTo'](mesh.positions[2*n],mesh.positions[2*n+1]);}
      context.fillStyle=mesh.sourceRowIndices[mesh.indices[i]]===1 ? '#ee9933' : '#4477bb';
      context.fill();
    }
    status.textContent=`${mesh.polygonSourceRows.length} polygon pieces, ${mesh.indices.length/3} triangles; source rows ${Array.from(mesh.polygonSourceRows)}.`;
  } catch(error) {if(revision===generation) status.textContent=String(error);}
}
select.addEventListener('change',render);
window.addEventListener('pagehide',event=>{if(!event.persisted) void WorkerFarm.getWorkerFarm().destroy();});
void render();
