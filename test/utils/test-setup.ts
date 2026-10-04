// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {configure} from '@math.gl/core';

// The aggregate Tape harness inherited this tolerance from its first loaded math.gl package.
// Set it explicitly now that Vitest isolates test files.
configure({debug: true, EPSILON: 1e-6});
