// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original shared C8 Node/browser qualification runner; no native builds/downloads.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {chromium,firefox,webkit} from 'playwright';
import {bundleRuntime} from '../projection/scripts/benchmark-runtime.mjs';
const {values}=parseArgs({options:{output:{type:'string'},browser:{type:'string'},'baseline-ref':{type:'string'},profile:{type:'string',default:'complete'}}});
const browsers={chromium,firefox,webkit};
assert(['complete','ordinary'].includes(values.profile),'Unknown C8 profile');
assert(!values.browser || Object.hasOwn(browsers,values.browser),'Unknown browser');
const root=fileURLToPath(new URL('../../../',import.meta.url)),directory=mkdtempSync(join(tmpdir(),'mathgl-c8-'));
let server,browser;
try {
  const outfile=join(directory,'qualification.mjs');
  const bundle=await bundleRuntime(root,'modules/geospatial/test/c8-g7-qualification.ts',outfile,values['baseline-ref']);
  const runtime=await import(pathToFileURL(outfile).href);
  let rows,environment;
  if(values.browser) {
    server=createServer((request,response)=>{
      response.setHeader('Cache-Control','no-store');
      if(request.url==='/qualification.js') {response.setHeader('Content-Type','text/javascript');response.end(readFileSync(outfile));}
      else {response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>C8 qualification</title>');}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await browsers[values.browser].launch({headless:true,timeout:30000});
    const watchdog=setTimeout(()=>void browser.close(),30000);
    try {
      const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
      rows=await page.evaluate(async complete=>{const module=await import('/qualification.js');return module.qualifyC8(complete);},values.profile==='complete');
      environment={browser:values.browser,version:browser.version()};
    } finally {clearTimeout(watchdog);}
  } else {rows=runtime.qualifyC8(values.profile==='complete');environment={node:process.version};}
  const hash=createHash('sha256');
  hash.update(readFileSync(outfile));
  const summary={};
  for(const row of rows) {
    const group=summary[row.family]??={rows:0,failed:0,maxBudgetUsage:0};
    group.rows++;if(!row.passed) group.failed++;group.maxBudgetUsage=Math.max(group.maxBudgetUsage,row.budgetUsage);
  }
  const report={profile:values.profile,baselineRef:values['baseline-ref'],provenance:runtime.provenance,environment:{...environment,platform:process.platform,architecture:process.arch},sourceSHA256:hash.digest('hex'),summary,rows};
  if(values.output) writeFileSync(values.output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(summary,null,2));
  assert(rows.every(row=>row.passed),'C8 qualification failed; inspect the report');
} finally {
  await browser?.close();
  if(server) {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  rmSync(directory,{recursive:true,force:true});
}
