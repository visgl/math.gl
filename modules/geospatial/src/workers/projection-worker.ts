// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/worker-utils';
import {projectBulk} from './operations';

createWorker((input, _options, context) => projectBulk(input, context!));
