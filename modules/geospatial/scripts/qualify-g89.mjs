// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
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
const {values}=parseArgs({options:{output:{type:'string'},browser:{type:'string'}}});
const browsers={chromium,firefox,webkit};assert(!values.browser||Object.hasOwn(browsers,values.browser));
const root=fileURLToPath(new URL('../../../',import.meta.url)),directory=mkdtempSync(join(tmpdir(),'mathgl-g89-'));
let browser,server;
try{
 const outfile=join(directory,'qualification.mjs');await bundleRuntime(root,'modules/geospatial/test/g89-qualification.ts',outfile);
 let rows,environment,provenance;
 if(values.browser){
  server=createServer((request,response)=>{response.setHeader('Cache-Control','no-store');if(request.url==='/qualification.js'){response.setHeader('Content-Type','text/javascript');response.end(readFileSync(outfile));}else{response.setHeader('Content-Type','text/html');response.end('<!doctype html><title>G8/G9 qualification</title>');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await browsers[values.browser].launch({headless:true,timeout:30000});const watchdog=setTimeout(()=>void browser.close(),60000);
  try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
   ({rows,provenance}=await page.evaluate(async()=>{const module=await import('/qualification.js');return {rows:module.qualifyG89(),provenance:module.provenance};}));
   environment={browser:values.browser,version:browser.version()};
  }finally{clearTimeout(watchdog);}
 }else{const module=await import(pathToFileURL(outfile).href);rows=module.qualifyG89();provenance=module.provenance;environment={node:process.version};}
 const summary={};for(const row of rows){const group=summary[row.mode]??={rows:0,failed:0,maxBudgetUsage:0};group.rows++;if(!row.passed)group.failed++;group.maxBudgetUsage=Math.max(group.maxBudgetUsage,row.budgetUsage);}
 const report={provenance,environment:{...environment,platform:process.platform,architecture:process.arch},sourceSHA256:createHash('sha256').update(readFileSync(outfile)).digest('hex'),summary,rows};
 if(values.output)writeFileSync(values.output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary,null,2));assert(rows.every(r=>r.passed),'G8/G9 qualification failed; inspect report');
}finally{await browser?.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}rmSync(directory,{recursive:true,force:true});}
