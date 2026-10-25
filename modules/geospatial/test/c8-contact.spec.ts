// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {qualifyContacts} from './c8-contact-qualification';
for (const row of qualifyContacts())
  test(`C8 silhouette ${row.id}`, () => {
    expect(row.passed, JSON.stringify(row)).toBe(true);
  });
