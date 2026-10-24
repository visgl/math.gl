// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {mountQuincuncialStar} from 'website-examples/quincuncial-star/main';
export default function QuincuncialStarExample() {
  const root = useRef(null);
  useEffect(() => mountQuincuncialStar(root.current), []);
  return <div ref={root} />;
}
