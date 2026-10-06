// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/culling-queries/app'));
export default function CullingQueries(props) {
  return <LiveExample {...props} Globe={Example} label="Ray & closest-point lab" />;
}
