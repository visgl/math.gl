// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountSurfaceMesh} from 'website-examples/geospatial/projection-domains/surface-mesh/main.mjs';
export default function SurfaceMeshExample() {
  const root = useRef(null);
  useEffect(() => {const dispose = mountSurfaceMesh(root.current);return () => {void dispose().catch(console.error);};}, []);
  return <div ref={root} />;
}
