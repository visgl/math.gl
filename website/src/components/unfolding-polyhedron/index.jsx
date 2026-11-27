// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('./example'));
export default function UnfoldingPolyhedron(props) {
  return <LiveExample {...props} interactive Globe={Example} exampleProps={{...props.exampleProps, compact: Boolean(props.inline)}} label="Unfolding Earth" />;
}
