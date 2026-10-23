// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountAlbers} from 'website-examples/albers-usa/main';
import 'website-examples/albers-usa/style.css';

export default function AlbersUsaExample() {
  const root = useRef(null);
  useEffect(() => mountAlbers(root.current), []);
  return <div ref={root} />;
}
