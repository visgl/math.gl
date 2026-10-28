// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
export async function serveLab() {
  const root=fileURLToPath(new URL('../dist/',import.meta.url));
  const server=createServer(async(req,res)=>{
    try {
      const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(path!==resolve(root)&&!path.startsWith(resolve(root)+sep)){res.writeHead(403).end();return;}
      const file=path===resolve(root)?resolve(root,'lab.html'):path;
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm'})[extname(file)]||'application/octet-stream');
      res.end(await readFile(file));
    }catch{res.writeHead(404).end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  return {server,url:`http://127.0.0.1:${server.address().port}`};
}
