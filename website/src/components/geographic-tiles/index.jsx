// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/geographic-tiles/app'));
export default function GeographicTiles(props) {
  return <LiveExample {...props} Globe={Example} label="Geographic tile explorer" />;
}
