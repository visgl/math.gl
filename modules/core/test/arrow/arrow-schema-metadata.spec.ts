// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {mergeArrowSchemas, snapshotArrowSchema} from '@math.gl/core/arrow';
import {expect, test} from 'vitest';

/** Constructs a schema with two fields that share a dictionary value type. */
function dictionarySchema(version: string, extraKey: string) {
  const values = new arrow.Struct([
    new arrow.Field(
      'value',
      new arrow.Int32(),
      false,
      new Map([
        ['version', version],
        [extraKey, 'nested']
      ])
    )
  ]);
  const dictionary = new arrow.Dictionary(values, new arrow.Int8(), 42);
  return new arrow.Schema(
    [
      new arrow.Field('first', dictionary, true, new Map([[extraKey, 'field']])),
      new arrow.Field('second', dictionary, false)
    ],
    new Map([
      ['version', version],
      [extraKey, 'schema']
    ])
  );
}

test('merges nested dictionary metadata and owns the resulting maps', () => {
  const earlier = dictionarySchema('old', 'first');
  const later = dictionarySchema('new', 'second');
  const merged = mergeArrowSchemas(earlier, later);
  const first = merged.fields[0]!.type;
  const second = merged.fields[1]!.type;
  expect(arrow.DataType.isDictionary(first)).toBe(true);
  expect(first.dictionary).toBe(second.dictionary);
  expect(merged.dictionaries.get(42)).toBe(first.dictionary);
  expect(merged.metadata).toEqual(
    new Map([
      ['version', 'new'],
      ['first', 'schema'],
      ['second', 'schema']
    ])
  );
  expect(merged.fields[0]!.metadata).toEqual(
    new Map([
      ['first', 'field'],
      ['second', 'field']
    ])
  );
  expect(first.children[0]!.metadata).toEqual(
    new Map([
      ['version', 'new'],
      ['first', 'nested'],
      ['second', 'nested']
    ])
  );
  first.children[0]!.metadata.set('version', 'changed');
  expect(later.fields[0]!.type.children[0]!.metadata.get('version')).toBe('new');
  expect(earlier.fields[0]!.type.children[0]!.metadata.get('version')).toBe('old');
});

test('snapshots metadata and rejects incompatible schemas', () => {
  const source = dictionarySchema('old', 'first');
  const snapshot = snapshotArrowSchema(source);
  expect(snapshot.metadata).toEqual(source.metadata);
  expect(snapshot.metadata).not.toBe(source.metadata);
  expect(snapshot.fields[0]!.metadata).not.toBe(source.fields[0]!.metadata);
  expect(() =>
    mergeArrowSchemas(source, new arrow.Schema([new arrow.Field('first', new arrow.Int32())]))
  ).toThrow(/expected 2 fields/);
});
