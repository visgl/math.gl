// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createPortal} from 'react-dom';

/** Keep each visualization's state with its controls while the accordion owns their placement. */
export default function TerrainControls({target, children}) {
  return target ? createPortal(children, target) : null;
}
