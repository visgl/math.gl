// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/tasks';
import {prepareJob} from './job.mjs';
// Native, proj4js and D3 preparation run off the rendering thread. proj-wasm owns
// its own WASM workers and is orchestrated by the page using the same async job.
await createWorker(spec=>prepareJob(spec));
