// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/geometry-viewer/app'));
export default function GeometryViewer({geometry, geometryType, geometryProps, ...props}) {
  return (
    <LiveExample
      {...props}
      Globe={Example}
      label={geometryType || 'Geometry viewer'}
      exampleProps={{geometry, geometryType, geometryProps}}
    />
  );
}
