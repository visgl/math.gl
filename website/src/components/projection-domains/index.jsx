// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountProjectionDomains} from 'website-examples/geospatial/projection-domains/main';
export default function ProjectionDomainsExample() {
  const root = useRef(null);
  useEffect(() => {
    const dispose = mountProjectionDomains(root.current);
    return () => {void dispose().catch(error => console.error('Projection example cleanup failed', error));};
  }, []);
  return <div ref={root} />;
}
