// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React,{useEffect,useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {mountProjectionLab} from 'website-examples/geospatial/projection-domains/lab/main.mjs';
export default function RasterProjectionLab() {
  const root=useRef(null),wasmAssetBase=useBaseUrl('/projection-lab/');
  useEffect(()=>{const lab=mountProjectionLab(root.current,{wasmAssetBase});return()=>{void lab.dispose().catch(error=>console.error('Projection lab cleanup failed',error));};},[wasmAssetBase]);
  return <div ref={root} aria-label="Antarctica and Fiji raster projection lab" />;
}
