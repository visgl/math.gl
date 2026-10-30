// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountCenteredObliqueMercator} from 'website-examples/geospatial/projection-domains/centered-omerc/main.mjs';
export default function CenteredObliqueMercator() {
  const root = useRef(null);
  useEffect(() => {
    const dispose = mountCenteredObliqueMercator(root.current);
    return () => {void dispose().catch(error => console.error('Oblique Mercator cleanup failed', error));};
  }, []);
  return <div ref={root} />;
}
