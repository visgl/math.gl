// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {getTimezoneOffset, lookupTimezoneAsync} from '../src';
import {lookupTimezone} from '../src/lookup';

test('timezone offsets at explicit instants', () => {
  const winter = Date.parse('2024-01-15T12:00:00Z');
  const summer = new Date('2024-07-15T12:00:00Z');
  expect(getTimezoneOffset('America/New_York', winter)).toBe(-300);
  expect(getTimezoneOffset('America/New_York', summer)).toBe(-240);
  expect(getTimezoneOffset('UTC', summer)).toBe(0);
  expect(getTimezoneOffset('Asia/Kolkata', summer)).toBe(330);
  expect(getTimezoneOffset('Asia/Kathmandu', summer)).toBe(345);
  expect(getTimezoneOffset('Pacific/Chatham', summer)).toBe(765);
  expect(getTimezoneOffset('Australia/Adelaide', winter)).toBe(630);
  expect(getTimezoneOffset('America/New_York', new Date('2024-03-10T06:59:59.999Z'))).toBe(-300);
  expect(getTimezoneOffset('America/New_York', new Date('2024-03-10T07:00:00Z'))).toBe(-240);
  expect(getTimezoneOffset('America/New_York', new Date('2024-11-03T05:59:59Z'))).toBe(-240);
  expect(getTimezoneOffset('America/New_York', new Date('2024-11-03T06:00:00Z'))).toBe(-300);
});

test('offset defaults to now and validates arguments', () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2024-01-15T12:00:00Z'));
  try {
    expect(getTimezoneOffset('America/New_York')).toBe(-300);
  } finally {
    vi.restoreAllMocks();
  }
  for (const date of [NaN, Infinity, new Date(NaN)]) {
    expect(() => getTimezoneOffset('UTC', date)).toThrow(RangeError);
  }
  for (const zone of ['', 'not/a/timezone']) {
    expect(() => getTimezoneOffset(zone, 0)).toThrow(RangeError);
  }
});

test('coordinate lookup uses longitude before latitude', async () => {
  const cities: [readonly [number, number], string][] = [
    [[-74.006, 40.7128], 'America/New_York'],
    [[-122.4194, 37.7749], 'America/Los_Angeles'],
    [[139.6917, 35.6895], 'Asia/Tokyo'],
    [[151.2093, -33.8688], 'Australia/Sydney']
  ];
  for (const [coordinates, zone] of cities) {
    expect(lookupTimezone(coordinates)).toBe(zone);
    expect(await lookupTimezoneAsync(coordinates)).toBe(zone);
  }
  expect(
    await Promise.all(cities.map(([coordinates]) => lookupTimezoneAsync(coordinates)))
  ).toEqual(cities.map(([, zone]) => zone));
  for (const coordinates of [
    [NaN, 0],
    [0, Infinity],
    [181, 0],
    [-181, 0],
    [0, 91],
    [0, -91]
  ]) {
    expect(() => lookupTimezone(coordinates as [number, number])).toThrow(RangeError);
    await expect(lookupTimezoneAsync(coordinates as [number, number])).rejects.toThrow(RangeError);
  }
  for (const coordinates of [
    [180, 90],
    [-180, -90],
    [0, 0]
  ]) {
    expect(typeof lookupTimezone(coordinates as [number, number])).toBe('string');
  }
});
