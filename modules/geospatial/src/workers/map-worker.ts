// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/worker-utils';
import {setupMap} from './operations';

createWorker((description, _options, context) => setupMap(description, context!).toPrepared());
