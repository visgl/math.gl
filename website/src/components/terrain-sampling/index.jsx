// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/geospatial/terrain-sampling/src/app.jsx'));
export default function Component(props) {
  // The analysis sections grow with the document instead of scrolling inside the embed.
  return (
    <LiveExample
      {...props}
      Globe={Example}
      label="Terrain sampling"
      height="auto"
      exampleProps={{style: {height: 'auto', overflow: 'visible'}}}
    />
  );
}
