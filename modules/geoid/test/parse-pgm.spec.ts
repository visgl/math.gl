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
