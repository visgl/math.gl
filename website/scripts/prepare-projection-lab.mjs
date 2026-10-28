// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mkdir,rm} from 'node:fs/promises';
import {copyProjVendor} from '../../examples/geospatial/proj-wasm-crs/vendor.mjs';
// Only optional WASM assets are copied. The lab itself is a normal embedded example.
const output=new URL('../static/projection-lab/',import.meta.url);
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
await copyProjVendor(output);
