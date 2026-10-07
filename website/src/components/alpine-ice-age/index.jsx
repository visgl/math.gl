// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/alpine-ice-age/app'));
export default function AlpineIceAge(props) {
  return <LiveExample {...props} interactive Globe={Example} label="Alpine Ice Age" />;
}
