// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {lazy} from 'react';
import LiveExample from '../live-globe';
const Example = lazy(() => import('website-examples/tectonic-time-machine/app'));
export default function TectonicTimeMachine(props) {
  return <LiveExample {...props} interactive Globe={Example} label="Tectonic time machine" />;
}
