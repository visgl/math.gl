// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {mountTimezoneGlobe} from 'website-examples/timezone-globe/app';
import 'website-examples/timezone-globe/styles.css';

export default function Globe() {
  const root = useRef(null);
  const lowUrl = useBaseUrl('/timezone-geometry-low.json');
  const hiUrl = useBaseUrl('/timezone-geometry-hi.json');
  useEffect(() => mountTimezoneGlobe(root.current, {lowUrl, hiUrl}), [lowUrl, hiUrl]);
  return <div className="timezone-globe" ref={root} style={{height: '100%'}} />;
}
