// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React, {useEffect, useRef} from 'react';
import {mountMyriahedral} from 'website-examples/myriahedral-maps/app';
import 'website-examples/myriahedral-maps/style.css';
export default function Example() {
  const root = useRef(null);
  useEffect(() => mountMyriahedral(root.current), []);
  return <div ref={root} className="unfolding-polyhedron" data-embedded="true" />;
}
