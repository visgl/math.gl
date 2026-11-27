// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/geospatial/geographic-tiles/src/app.jsx'));
export default function GeographicTiles(props) {
  return <LiveExample {...props} Globe={Example} label="Geographic tile explorer" />;
}
