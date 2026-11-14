// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Int32, Table, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {createArrowQueryWorker} from '../src/arrow/worker';

test.skipIf(typeof window !== 'undefined')(
  'query workers retain the source across projections and transfer it back',
  async () => {
    const input = new Table({id: vectorFromArray([1, 2, 3], new Int32())});
    const child = input.slice(0, 1);
    const session = await createArrowQueryWorker(input, {
      worker: {url: new URL('../dist/arrow/query-worker-entry.js', import.meta.url)}
    });
    try {
      const projected = await session.query({select: [{column: 'id', as: 'value'}], limit: 2});
      expect(Array.from(projected.getChild('value')!)).toEqual([1, 2]);
      const emptyProjection = await session.query({select: [], limit: 2});
      expect(emptyProjection.numRows).toBe(2);
      const combined = await session.query({union: [child], orderBy: [{column: 'id'}]});
      expect(Array.from(combined.getChild('id')!)).toEqual([1, 1, 2, 3]);
      expect(Array.from((await session.getTable()).getChild('id')!)).toEqual([1, 2, 3]);
      expect(Array.from((await session.takeTable()).getChild('id')!)).toEqual([1, 2, 3]);
      await expect(session.query()).rejects.toThrow('closed');
      expect(Array.from(input.getChild('id')!)).toEqual([1, 2, 3]);
    } finally {
      await session.close();
    }
  }
);
