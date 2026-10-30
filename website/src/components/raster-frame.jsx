// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountRasterFrame} from 'website-examples/geospatial/projection-domains/raster-frame/main.mjs';
export default function RasterFrameExample() {
  const root = useRef(null);
  useEffect(() => {
    const dispose = mountRasterFrame(root.current);
    return () => {void dispose().catch(error => console.error('Raster frame cleanup failed', error));};
  }, []);
  return <div ref={root} />;
}
