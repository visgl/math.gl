// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/core-transforms/app'));
export default function Component(props) {
  return <LiveExample {...props} Globe={Example} label="Core transforms" />;
}
