// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {prepareJob} from './job.mjs';
const rows=[];
for(const engine of ['native','proj4','d3'])for(const longitude of [-30,-15,0,15,30]) {
  const spec={source:'antarctica',target:'orthographic',engine,mode:'inverse',tolerance:2,center:[longitude,-75]},begin=performance.now();
  const {diagnostics}=await prepareJob(spec);rows.push({...spec,...diagnostics,endToEndMs:performance.now()-begin});
}
console.log(JSON.stringify({schemaVersion:1,runtime:process.version,recipe:'projection-lab-v1',policy:'sequential CPU preparation; no worker transport; not an FPS benchmark',rows},null,2));
