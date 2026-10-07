// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {lowUrl, hiUrl} from '../../../../examples/geoid-globe/sources';
import React, {useEffect, useRef} from 'react';
import {mountGeoidGlobe} from 'website-examples/geoid-globe/app';
import 'website-examples/geoid-globe/styles.css';

export default function Globe() {
  const root = useRef(null);
  useEffect(() => mountGeoidGlobe(root.current, {lowUrl, hiUrl}), [lowUrl, hiUrl]);
  return <div className="geoid-globe" ref={root} style={{height: '100%'}} />;
}
