// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountElasticMaps} from 'website-examples/elastic-maps/main';
export default function ElasticMapsExample() {
  const root=useRef(null);
  useEffect(()=>mountElasticMaps(root.current),[]);
  return <div ref={root}/>;
}
