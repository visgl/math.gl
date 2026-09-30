// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {getLocalDateTime, getTimezoneLabel, isTimezoneSupported} from '../src';
import {getStartOfDay, getTimezoneTransitions, localDateTimeToInstant} from '../src/temporal';

const timestamp = (date: string): number => Date.parse(date);

test('local fields retain milliseconds and cross calendar boundaries', () => {
  expect(getLocalDateTime('Asia/Kathmandu', timestamp('2024-12-31T20:00:01.123Z'))).toEqual({
    year: 2025,
    month: 1,
    day: 1,
    hour: 1,
    minute: 45,
    second: 1,
    millisecond: 123
  });
  expect(getLocalDateTime('UTC', timestamp('2024-01-01T00:00:00Z')).hour).toBe(0);
  expect(getLocalDateTime('America/New_York', timestamp('2024-01-01T00:00:00Z')).day).toBe(31);
  expect(getLocalDateTime('UTC', timestamp('0000-01-01T00:00:00Z')).year).toBe(0);
  expect(getLocalDateTime('UTC', timestamp('-000001-01-01T00:00:00Z')).year).toBe(-1);
});

test('local day boundaries handle DST gaps, repeats, and skipped dates', () => {
  const spring = getStartOfDay('America/New_York', timestamp('2024-03-10T12:00:00Z'));
  const springNext = getStartOfDay('America/New_York', timestamp('2024-03-11T12:00:00Z'));
  expect(spring).toBe(timestamp('2024-03-10T05:00:00Z'));
  expect((springNext - spring) / 3600000).toBe(23);
  const fall = getStartOfDay('America/New_York', timestamp('2024-11-03T12:00:00Z'));
  const fallNext = getStartOfDay('America/New_York', timestamp('2024-11-04T12:00:00Z'));
  expect((fallNext - fall) / 3600000).toBe(25);
  expect(getStartOfDay('America/Sao_Paulo', timestamp('2015-10-18T12:00:00Z'))).toBe(
    timestamp('2015-10-18T03:00:00Z')
  );
  expect(
    getLocalDateTime(
      'America/Sao_Paulo',
      getStartOfDay('America/Sao_Paulo', timestamp('2015-10-18T12:00:00Z'))
    ).hour
  ).toBe(1);
  expect(getStartOfDay('America/St_Johns', timestamp('2010-11-07T12:00:00Z'))).toBe(
    timestamp('2010-11-07T02:30:00Z')
  );
  expect(getStartOfDay('Pacific/Apia', timestamp('2011-12-30T12:00:00Z'))).toBe(
    timestamp('2011-12-30T10:00:00Z')
  );
});

test('local time conversion explicitly resolves repeated and missing clock times', () => {
  const repeated = {year: 2024, month: 11, day: 3, hour: 1, minute: 30};
  expect(() => localDateTimeToInstant('America/New_York', repeated)).toThrow(RangeError);
  expect(localDateTimeToInstant('America/New_York', repeated, {disambiguation: 'earlier'})).toBe(
    timestamp('2024-11-03T05:30:00Z')
  );
  expect(localDateTimeToInstant('America/New_York', repeated, {disambiguation: 'later'})).toBe(
    timestamp('2024-11-03T06:30:00Z')
  );
  expect(localDateTimeToInstant('America/New_York', repeated, {disambiguation: 'compatible'})).toBe(
    timestamp('2024-11-03T05:30:00Z')
  );
  const missing = {year: 2024, month: 3, day: 10, hour: 2, minute: 30};
  expect(() => localDateTimeToInstant('America/New_York', missing)).toThrow(RangeError);
  expect(localDateTimeToInstant('America/New_York', missing, {disambiguation: 'earlier'})).toBe(
    timestamp('2024-03-10T06:30:00Z')
  );
  expect(localDateTimeToInstant('America/New_York', missing, {disambiguation: 'later'})).toBe(
    timestamp('2024-03-10T07:30:00Z')
  );
  expect(localDateTimeToInstant('America/New_York', missing, {disambiguation: 'compatible'})).toBe(
    timestamp('2024-03-10T07:30:00Z')
  );
  expect(() => localDateTimeToInstant('Pacific/Apia', {year: 2011, month: 12, day: 30})).toThrow(
    RangeError
  );
  expect(localDateTimeToInstant('UTC', {year: 2024, month: 1, day: 1})).toBe(
    timestamp('2024-01-01T00:00:00Z')
  );
  const fields = {year: 2025, month: 1, day: 1, hour: 1, minute: 45, second: 1, millisecond: 123};
  const instant = localDateTimeToInstant('Asia/Kathmandu', fields);
  expect(getLocalDateTime('Asia/Kathmandu', instant)).toEqual(fields);
});

test('transitions include start, exclude end, and describe political changes', () => {
  const spring = timestamp('2024-03-10T07:00:00Z');
  const fall = timestamp('2024-11-03T06:00:00Z');
  expect(
    getTimezoneTransitions('America/New_York', timestamp('2024-01-01'), timestamp('2025-01-01'))
  ).toEqual([
    {instant: spring, offsetBefore: -300, offsetAfter: -240},
    {instant: fall, offsetBefore: -240, offsetAfter: -300}
  ]);
  expect(getTimezoneTransitions('America/New_York', spring, fall)).toEqual([
    {instant: spring, offsetBefore: -300, offsetAfter: -240}
  ]);
  expect(getTimezoneTransitions('America/New_York', spring, spring)).toEqual([]);
  expect(getTimezoneTransitions('UTC', 0, timestamp('2030-01-01'))).toEqual([]);
  expect(
    getTimezoneTransitions('Pacific/Apia', timestamp('2011-12-29'), timestamp('2012-01-01'))
  ).toEqual([{instant: timestamp('2011-12-30T10:00:00Z'), offsetBefore: -600, offsetAfter: 840}]);
  const lordHowe = getTimezoneTransitions(
    'Australia/Lord_Howe',
    timestamp('2024-01-01'),
    timestamp('2025-01-01')
  );
  expect(lordHowe).toHaveLength(2);
  expect(lordHowe.map(change => Math.abs(change.offsetAfter - change.offsetBefore))).toEqual([
    30, 30
  ]);
});

test('labels are date-aware and localized; identifiers are validated against the runtime', () => {
  const winter = timestamp('2024-01-15T12:00:00Z');
  const summer = timestamp('2024-07-15T12:00:00Z');
  expect(getTimezoneLabel('America/New_York', winter, 'en')).toBe('Eastern Standard Time');
  expect(getTimezoneLabel('America/New_York', summer, 'en')).toBe('Eastern Daylight Time');
  expect(getTimezoneLabel('America/New_York', summer, 'fr')).not.toBe(
    getTimezoneLabel('America/New_York', summer, 'en')
  );
  expect(isTimezoneSupported('America/New_York')).toBe(true);
  expect(isTimezoneSupported('US/Eastern')).toBe(true);
  expect(isTimezoneSupported('UTC')).toBe(true);
  expect(isTimezoneSupported('not/a/timezone')).toBe(false);
  expect(isTimezoneSupported('')).toBe(false);
});

test('calendar utilities validate input and default to now', () => {
  for (const zone of ['', 'not/a/timezone']) {
    expect(() => getLocalDateTime(zone, 0)).toThrow(RangeError);
    expect(() => getTimezoneLabel(zone, 0)).toThrow(RangeError);
    expect(() => getStartOfDay(zone, 0)).toThrow(RangeError);
    expect(() => getTimezoneTransitions(zone, 0, 0)).toThrow(RangeError);
    expect(() => localDateTimeToInstant(zone, {year: 2024, month: 1, day: 1})).toThrow(RangeError);
  }
  for (const date of [NaN, Infinity, new Date(NaN)]) {
    expect(() => getLocalDateTime('UTC', date)).toThrow(RangeError);
    expect(() => getTimezoneLabel('UTC', date)).toThrow(RangeError);
    expect(() => getStartOfDay('UTC', date)).toThrow(RangeError);
    expect(() => getTimezoneTransitions('UTC', date, 0)).toThrow(RangeError);
    expect(() => getTimezoneTransitions('UTC', 0, date)).toThrow(RangeError);
  }
  expect(() => getTimezoneTransitions('UTC', 1, 0)).toThrow(RangeError);
  for (const fields of [
    {year: 2024, month: 2, day: 30},
    {year: NaN, month: 1, day: 1},
    {year: 2024, month: 1.5, day: 1},
    {year: 2024, month: 1, day: 1, hour: 24},
    {year: 2024, month: 1, day: 1, second: 60}
  ]) {
    expect(() => localDateTimeToInstant('UTC', fields)).toThrow(RangeError);
  }
  vi.spyOn(Date, 'now').mockReturnValue(timestamp('2024-01-15T12:00:00Z'));
  try {
    expect(getLocalDateTime('UTC').hour).toBe(12);
    expect(getStartOfDay('UTC')).toBe(timestamp('2024-01-15T00:00:00Z'));
    expect(getTimezoneLabel('America/New_York')).toBe('Eastern Standard Time');
  } finally {
    vi.restoreAllMocks();
  }
});
