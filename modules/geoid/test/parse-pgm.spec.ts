import {test, expect} from 'vitest';
import {parsePGM, Geoid} from '@math.gl/geoid';
import {openFile} from './utils/file-utils';

const PGM_FILE_PATH = 'modules/geoid/test/data/egm84-30.pgm';

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
  expect(
    parsePGM(
      new TextEncoder().encode(
        'P5\n# Offset 1\n# Scale 1\n# MaxCubicError 0.2\n# RMSCubicError 0.1\n2 3\n65535\n'
      ),
      {cubic: true}
    )
  ).toBeInstanceOf(Geoid);
});
