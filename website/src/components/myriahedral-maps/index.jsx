// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('./example'));
export default function MyriahedralMaps(props) {
  return <LiveExample {...props} interactive Globe={Example} label="Myriahedral maps" />;
}
