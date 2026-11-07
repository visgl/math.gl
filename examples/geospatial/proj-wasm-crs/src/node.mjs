// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore-all lint/suspicious/noConsole: The command-line entry point prints the CRS workflow result as JSON.
import {runExample} from './crs-resolution/index.mjs';
console.log(JSON.stringify(await runExample(), null, 2));
