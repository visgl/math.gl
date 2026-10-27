// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {useEffect, useRef} from 'react';
import {mountSunTerminator} from 'website-examples/sun-terminator/app';
import 'website-examples/sun-terminator/styles.css';
export default function Globe() {
  const root = useRef(null);
  useEffect(() => mountSunTerminator(root.current), []);
  return <div className="sun-terminator" ref={root} style={{height: '100%'}} />;
}
