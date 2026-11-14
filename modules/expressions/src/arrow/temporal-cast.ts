// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DateDay, TimestampMicrosecond, type DataType} from 'apache-arrow';
import {ExpressionEvaluationError} from '../expressions/index';
import {typeKey} from './buffers';
import type {ArrowExpressionValue} from './types';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})?$/;

/** Binds ISO text or an already matching Arrow temporal value to a temporal output. */
export function bindTemporalCast(source: DataType, target: 'date' | 'timestamp' | 'timestamp_utc') {
  const dateOnly = target === 'date';
  const zoned = target === 'timestamp_utc';
  const type = dateOnly ? new DateDay() : new TimestampMicrosecond(zoned ? 'UTC' : undefined);
  const sourceKey = typeKey(source);
  if (sourceKey !== 'utf8' && sourceKey !== 'null' && sourceKey !== typeKey(type))
    throw new Error('Temporal CAST requires UTF8 or an input of the requested Arrow type');
  return {
    type,
    textInput: false,
    evaluate(value: ArrowExpressionValue): ArrowExpressionValue {
      return typeof value === 'string' ? parseTemporalValue(value, dateOnly, zoned) : value;
    }
  };
}

/** Converts a validated calendar value to Arrow epoch days or exact epoch microseconds. */
function parseTemporalValue(text: string, dateOnly: boolean, zoned: boolean): number | bigint {
  const match = (dateOnly ? DATE : TIMESTAMP).exec(text.trim());
  const invalid = () =>
    new ExpressionEvaluationError('conversion', 'Invalid text for temporal CAST');
  if (!match) throw invalid();
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const calendar = new Date(0);
  // setUTCFullYear also handles four-digit years below 0100 without a 1900 offset.
  calendar.setUTCFullYear(year, month - 1, day);
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  )
    throw invalid();
  if (dateOnly) return calendar.getTime() / 86_400_000;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (hour > 23 || minute > 59 || second > 59 || zoned !== Boolean(zone)) throw invalid();
  let offsetMinutes = 0;
  if (zone && zone !== 'Z') {
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4));
    if (offsetHour > 23 || offsetMinute > 59) throw invalid();
    offsetMinutes = (zone.startsWith('-') ? -1 : 1) * (offsetHour * 60 + offsetMinute);
  }
  const seconds = hour * 3600 + minute * 60 + second - offsetMinutes * 60;
  return (
    BigInt(calendar.getTime() + seconds * 1000) * 1000n + BigInt((fraction ?? '').padEnd(6, '0'))
  );
}
