// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {PROJ_VENDOR_IMPORTS} from '../../proj-wasm-crs/vendor-imports.mjs';
// Share only the optional WASM pool between mounted labs, never their job contexts.
// Serialize acquisition/shutdown so a remount cannot race the last release.
let queue=Promise.resolve(),runtime,references=0;
function serialize(operation){const result=queue.then(operation);queue=result.catch(()=>{});return result;}
export function acquireWasm(base) {
  return serialize(async()=>{
    const imports=Object.fromEntries(Object.entries(PROJ_VENDOR_IMPORTS).map(([key,path])=>[key,new URL(path,new URL(base,document.baseURI)).href]));
    let map=document.getElementById('math-gl-proj-imports');
    if(map){const installed=JSON.parse(map.textContent).imports;if(new URL(installed['proj-wasm'],document.baseURI).href!==imports['proj-wasm'])throw new Error('Conflicting proj-wasm asset base');}
    else{map=document.createElement('script');map.id='math-gl-proj-imports';map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);}
    if(!runtime){const proj=await import(/* webpackIgnore: true */ /* @vite-ignore */ 'proj-wasm');await proj.init({workers:1});runtime=proj;}
    references++;let released=false;
    return {proj:runtime,release(){if(released)return Promise.resolve();released=true;return serialize(async()=>{if(--references===0){try{await runtime.shutdown();}finally{runtime=undefined;}}});}};
  });
}
