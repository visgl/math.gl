// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {lazy} from 'react';
import LiveGlobe from '../live-globe';
const Globe = lazy(() => import('./globe'));
export default function SunTerminator(props) {
  return <LiveGlobe {...props} Globe={Globe} label="Solar terminator" />;
}
