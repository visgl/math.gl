// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {lowUrl, hiUrl} from '../../../../examples/earth/geoid-globe/src/sources';
import React, {useEffect, useRef} from 'react';
import {mountGeoidGlobe} from 'website-examples/earth/geoid-globe/src/app.js';
import 'website-examples/earth/geoid-globe/src/styles.css';

export default function Globe() {
  const root = useRef(null);
  useEffect(() => mountGeoidGlobe(root.current, {lowUrl, hiUrl}), [lowUrl, hiUrl]);
  return <div className="geoid-globe" ref={root} style={{height: '100%'}} />;
}
