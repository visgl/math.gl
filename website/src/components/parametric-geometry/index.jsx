// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/parametric-geometry/app'));
export default function ParametricGeometryExample(props) {
  return <LiveExample {...props} Globe={Example} label="Parametric geometry lab" />;
}
