// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountBathymetry} from 'website-examples/geospatial/bathymetry/src/app.js';
import 'website-examples/geospatial/bathymetry/src/styles.css';
export default function Globe() {
  const root = useRef(null);
  useEffect(() => mountBathymetry(root.current), []);
  return <div className="bathymetry" ref={root} style={{height: '100%'}} />;
}
