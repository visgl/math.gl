// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/curves/app'));
export default function Curves(props) {
  return <LiveExample {...props} Globe={Example} label="Curve flight lab" />;
}
