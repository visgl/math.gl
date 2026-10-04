// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {mountGeoidGlobe} from 'website-examples/geoid-globe/app';
import 'website-examples/geoid-globe/styles.css';

export default function Globe() {
  const root = useRef(null);
  const lowUrl = useBaseUrl('/geoid-egm96-low.pgm');
  const hiUrl = useBaseUrl('/geoid-egm96-hi.pgm');
  useEffect(() => mountGeoidGlobe(root.current, {lowUrl, hiUrl}), [lowUrl, hiUrl]);
  return <div className="geoid-globe" ref={root} style={{height: '100%'}} />;
}
