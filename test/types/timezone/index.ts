// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {getTimezoneOffset, lookupTimezoneAsync} from '@math.gl/timezone';
import {lookupTimezone} from '@math.gl/timezone/lookup';

const coordinates = [-74.006, 40.7128] as const;
const zone: string = lookupTimezone(coordinates);
const offset: number = getTimezoneOffset(zone, new Date());
const current: number = getTimezoneOffset(zone);
const epoch: number = getTimezoneOffset(zone, 0);
const lazy: Promise<string> = lookupTimezoneAsync(coordinates);
void [offset, current, epoch, lazy];

// @ts-expect-error lookup requires a pair
lookupTimezone([1]);
// @ts-expect-error offsets require an instant, not a date string
getTimezoneOffset(zone, '2024-01-01');

import {getLocalDateTime, getTimezoneLabel, isTimezoneSupported} from '@math.gl/timezone';
import type {LocalDateTime} from '@math.gl/timezone';
import {
  getStartOfDay,
  getTimezoneTransitions,
  localDateTimeToInstant
} from '@math.gl/timezone/temporal';
import type {
  LocalDateTimeInput,
  LocalDateTimeOptions,
  TimezoneTransition
} from '@math.gl/timezone/temporal';

const local: LocalDateTime = getLocalDateTime(zone, 0);
const supported: boolean = isTimezoneSupported(zone);
const label: string = getTimezoneLabel(zone, 0, ['fr', 'en']);
const dayStart: number = getStartOfDay(zone, new Date());
const fields: LocalDateTimeInput = {year: 2024, month: 11, day: 3, hour: 1, minute: 30};
const options: LocalDateTimeOptions = {disambiguation: 'later'};
const converted: number = localDateTimeToInstant(zone, fields, options);
const transitions: TimezoneTransition[] = getTimezoneTransitions(zone, 0, new Date());
void [local, supported, label, dayStart, converted, transitions];
// @ts-expect-error year is required
localDateTimeToInstant(zone, {month: 1, day: 1});
// @ts-expect-error disambiguation must be a supported policy
localDateTimeToInstant(zone, fields, {disambiguation: 'guess'});
