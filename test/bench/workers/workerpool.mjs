// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import workerpool from 'workerpool';
workerpool.worker({echo: input => ArrayBuffer.isView(input) ? new workerpool.Transfer(input, [input.buffer]) : input});
