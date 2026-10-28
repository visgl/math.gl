// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFile,writeFile} from 'node:fs/promises';
import {copyProjVendor} from '../proj-wasm-crs/vendor.mjs';
const output=new URL('./dist/',import.meta.url);
const imports=await copyProjVendor(output);
const file=new URL('lab.html',output),html=await readFile(file,'utf8');
await writeFile(file,html.replace('<head>',`<head><script id="math-gl-proj-imports" type="importmap">${JSON.stringify({imports})}</script>`));
