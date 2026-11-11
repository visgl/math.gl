// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountUnfolding} from 'website-examples/common/unfolding-polyhedron/app.ts';
import 'website-examples/common/unfolding-polyhedron/style.css';

export default function Example({compact = false}) {
  const root = useRef(null);
  useEffect(() => mountUnfolding(root.current), []);
  return <div ref={root} className="unfolding-polyhedron" data-embedded="true" data-compact={compact || undefined} />;
}
