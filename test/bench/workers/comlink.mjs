// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {parentPort} from 'node:worker_threads';
import {expose, transfer} from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
expose({echo: input => ArrayBuffer.isView(input) ? transfer(input, [input.buffer]) : input}, nodeEndpoint(parentPort));
