// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {parsePGM, Geoid} from '@math.gl/earth/geoid';
import {openFile} from './utils/file-utils';

const PGM_FILE_PATH = 'modules/earth/test/geoid/data/egm84-30.pgm';

test('parsePGM - returns correct instance of Geoid class', async () => {
  const data = await openFile(PGM_FILE_PATH);

  // If data is null - now ways to open the file
  if (data === null) {
    throw new Error(`Can't open file: ${PGM_FILE_PATH}`);
  }

  const geoid = parsePGM(data, {});
  expect(geoid instanceof Geoid).toBeTruthy();

  const center = [8.67694237417622, 50.109450651843204, 172.017822265625];
  expect(geoid.getHeight(center[1], center[0])).toBe(48.093804428091886);
});

test('parsePGM rejects malformed headers and raster metadata', () => {
  const parse = (header: string, cubic = false): void => {
    expect(() => parsePGM(new TextEncoder().encode(header), {cubic})).toThrow();
  };
  parse('P6\n2 3\n65535\n');
  parse('P5\n2 3\n255\n');
  parse('P5\n2 3\n65535\n');
  parse('P5\n# Scale 1\n2 3\n65535\n');
  parse('P5\n# Offset 1\n2 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale -1\n2 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale 1\n3 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale 1\n2 2\n65535\n');
  parse('P5\n# Offset 1\n# Scale 1\n');
  parse('P5\n# Offset 1\n# Scale 1\n2 3\n');
  parse('P5\n# Offset 1x\n# Scale 1\n2 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale Infinity\n2 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale 1\n2x 3\n65535\n');
  parse('P5\n# Offset 1\n# Scale 1\n2 3\n65535x\n');
});

test.each([false, true])('parsePGM requires one complete 16-bit raster (cubic=%s)', cubic => {
  const header = new TextEncoder().encode(
    'P5\n# Offset 1.5\n# Scale 0.5\n# MaxCubicError 0.2\n# RMSCubicError 0.1\n2 3\n65535\n'
  );
  const data = new Uint8Array(header.length + 12);
  data.set(header);
  const view = new DataView(data.buffer);
  for (let offset = header.length; offset < data.length; offset += 2)
    view.setUint16(offset, 10, false);

  expect(parsePGM(data, {cubic}).getHeight(0, 0)).toBeCloseTo(6.5);
  const extraByte = new Uint8Array(data.length + 1);
  extraByte.set(data);
  for (const invalid of [data.subarray(0, header.length), data.subarray(0, -1), extraByte])
    expect(() => parsePGM(invalid, {cubic})).toThrow('Raster byte length');
});
