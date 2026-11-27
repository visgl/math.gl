// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {NPM_TAG} from '../npm-tag';

declare let __VERSION__: string;

/** Return this package's injected version, independent of other loaded versions. */
function getVersion(): string {
  return typeof __VERSION__ === 'undefined' ? NPM_TAG : __VERSION__;
}

/** Version of this worker-utils build, or the branch's npm fallback tag. */
export const VERSION = getVersion();
