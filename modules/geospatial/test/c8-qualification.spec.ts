// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {qualifyC8} from './c8-qualification';
for (const row of qualifyC8())
  test(`C8 ${row.family}: ${row.id}`, () => expect(row, row.error).toMatchObject({passed: true}));
