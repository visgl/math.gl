import {test, expect} from 'vitest';
import {Geoid} from '@math.gl/geoid';
import {openFile} from './utils/file-utils';

const PGM_FILE_PATH = 'modules/geoid/test/data/egm84-30.pgm';

test('geoid - exports', () => {
  expect(Geoid, 'Geoid is defined').toBeTruthy();
});

test('geoid - get height model info', async () => {
  const data = await openFile(PGM_FILE_PATH);

  // If data is null - now ways to open the file
  if (data === null) {
    throw new Error(`Can't open file: ${PGM_FILE_PATH}`);
  }

  const geoid = new Geoid({
    cubic: false,
    _width: 720,
    _height: 361,
    _rlonres: 2,
    _rlatres: 2,
    _offset: -108,
    _scale: 0.003,
    _swidth: 720,
    _datastart: 416,
    _maxerror: 1.546,
    _rmserror: 0.07,
    _description: 'WGS84 EGM84, 30-minute grid',
    _datetime: '2009-08-29 18:45:02',
    data
  });

  const center = [8.67694237417622, 50.109450651843204, 172.017822265625];
  expect(geoid.getHeight(center[1], center[0])).toBe(48.093804428091886);
});

test('geoid - cubic approximation', async () => {
  const data = await openFile(PGM_FILE_PATH);

  // If data is null - now ways to open the file
  if (data === null) {
    throw new Error(`Can't open file: ${PGM_FILE_PATH}`);
  }

  const geoid = new Geoid({
    cubic: true,
    _width: 720,
    _height: 361,
    _rlonres: 2,
    _rlatres: 2,
    _offset: -108,
    _scale: 0.003,
    _swidth: 720,
    _datastart: 416,
    _maxerror: 1.546,
    _rmserror: 0.07,
    _description: 'WGS84 EGM84, 30-minute grid',
    _datetime: '2009-08-29 18:45:02',
    data
  });

  const center = [8.67694237417622, 50.109450651843204, 172.017822265625];
  expect(geoid.getHeight(center[1], center[0])).toBe(48.09178497292629);
});

test('geoid handles invalid coordinates, longitude wrapping, and grid edges', async () => {
  const data = await openFile(PGM_FILE_PATH);
  if (data === null) throw new Error(`Can't open file: ${PGM_FILE_PATH}`);
  const geoid = new Geoid({
    cubic: false,
    _width: 720,
    _height: 361,
    _rlonres: 2,
    _rlatres: 2,
    _offset: -108,
    _scale: 0.003,
    _swidth: 720,
    _datastart: 416,
    _maxerror: 1.546,
    _rmserror: 0.07,
    _description: 'WGS84 EGM84, 30-minute grid',
    _datetime: '2009-08-29 18:45:02',
    data
  });
  expect(geoid.getHeight(91, 0)).toBeNaN();
  expect(geoid.getHeight(0, Number.NaN)).toBeNaN();
  expect(geoid.getHeight(0, 0)).toBe(geoid.getHeight(0, 360));
  expect(geoid.getHeight(0, -180)).toBe(geoid.getHeight(0, 180));
  expect(geoid.getHeight(-90, 0)).toBeDefined();
  expect(geoid.getHeight(90, 0)).toBeDefined();

  const cubic = new Geoid({...geoid.options, cubic: true});
  expect(cubic.getHeight(89.5, 0)).toBeDefined();
  expect(cubic.getHeight(89.5, 0)).toBeDefined();
  expect(cubic.getHeight(-89.5, 0)).toBeDefined();
  expect(cubic.getHeight(-89.5, 0)).toBeDefined();

  const fastLongitude = new Geoid({...geoid.options, _rlonres: 10});
  expect(fastLongitude.getHeight(0, 100)).toBeDefined();
});
