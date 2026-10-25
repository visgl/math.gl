// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export type AngleAxis = 'angle' | 'latitude' | 'longitude';
function validate(value: number, axis: AngleAxis) {
  if (
    !['angle', 'latitude', 'longitude'].includes(axis) ||
    !Number.isFinite(value) ||
    Math.abs(value) > (axis === 'latitude' ? 90 : axis === 'longitude' ? 180 : 1e6)
  )
    throw new RangeError('Angle is outside the requested axis domain');
}
/** Strict decimal degrees or DMS, with one optional hemisphere. No expressions. */
export function parseAngle(text: string, axis: AngleAxis = 'angle'): number {
  if (typeof text !== 'string' || text.length > 256) throw new RangeError('Invalid angle text');
  let value = text.trim().replace(/−/g, '-').toUpperCase(),
    hemisphere = '';
  if (/^[NSEW]/.test(value)) {
    hemisphere = value[0];
    value = value.slice(1).trim();
  }
  if (/[NSEW]$/.test(value)) {
    if (hemisphere) throw new RangeError('Use one hemisphere');
    hemisphere = value.slice(-1);
    value = value.slice(0, -1).trim();
  }
  if (hemisphere && /^[+-]/.test(value)) throw new RangeError('Use a sign or hemisphere, not both');
  if (
    (axis === 'latitude' && /[EW]/.test(hemisphere)) ||
    (axis === 'longitude' && /[NS]/.test(hemisphere))
  )
    throw new RangeError('Hemisphere does not match axis');
  value = value.replace(/\s*([:D°'′"″])\s*/g, '$1');
  const number = '(\\d+(?:\\.\\d*)?|\\.\\d+)';
  const decimal = new RegExp('^([+-]?)' + number + '[D°]?$').exec(value);
  const colon = new RegExp('^([+-]?)' + number + ':' + number + '(?::' + number + ')?$').exec(
    value
  );
  const marked = new RegExp(
    '^([+-]?)' + number + '[D°]' + number + "['′](?:" + number + '["″])?$'
  ).exec(value);
  const parts = decimal ?? colon ?? marked;
  if (!parts) throw new RangeError('Expected decimal degrees, colon DMS or marked DMS');
  const degrees = Number(parts[2]),
    minutes = Number(parts[3] ?? 0),
    seconds = Number(parts[4] ?? 0);
  if (
    minutes >= 60 ||
    seconds >= 60 ||
    (parts[3] !== undefined && !Number.isInteger(degrees)) ||
    (parts[4] !== undefined && !Number.isInteger(minutes))
  )
    throw new RangeError('Invalid DMS components');
  const sign = parts[1] === '-' || /[SW]/.test(hemisphere) ? -1 : 1;
  const result = sign * (degrees + minutes / 60 + seconds / 3600);
  validate(result, axis);
  return result;
}
export function formatAngle(
  value: number,
  options: {axis?: AngleAxis; format?: 'degrees' | 'dms'; precision?: number} = {}
): string {
  const axis = options.axis ?? 'angle',
    format = options.format ?? 'dms',
    precision = options.precision ?? 3;
  validate(value, axis);
  if (
    !Number.isInteger(precision) ||
    precision < 0 ||
    precision > 6 ||
    !['degrees', 'dms'].includes(format)
  )
    throw new RangeError('Invalid angle format or precision');
  const negative = value < 0 || Object.is(value, -0),
    suffix =
      axis === 'latitude'
        ? negative
          ? 'S'
          : 'N'
        : axis === 'longitude'
          ? negative
            ? 'W'
            : 'E'
          : '';
  const prefix = axis === 'angle' && negative ? '-' : '';
  if (format === 'degrees') return prefix + Math.abs(value).toFixed(precision) + '°' + suffix;
  const factor = 10 ** precision,
    ticks = Math.round(Math.abs(value) * 3600 * factor);
  if (!Number.isSafeInteger(ticks))
    throw new RangeError('DMS precision exceeds exact integer range');
  const degrees = Math.floor(ticks / (3600 * factor)),
    minutes = Math.floor(ticks / (60 * factor)) % 60,
    seconds = (ticks % (60 * factor)) / factor;
  return (
    prefix +
    degrees +
    '°' +
    String(minutes).padStart(2, '0') +
    '′' +
    seconds.toFixed(precision).padStart(precision ? 3 + precision : 2, '0') +
    '″' +
    suffix
  );
}
export function parseGeographicCoordinates(text: string): {latitude: number; longitude: number} {
  if (typeof text !== 'string' || text.length > 512)
    throw new RangeError('Invalid coordinate text');
  const pair = text.split(',');
  if (pair.length !== 2) throw new RangeError('Use latitude, longitude');
  return {latitude: parseAngle(pair[0], 'latitude'), longitude: parseAngle(pair[1], 'longitude')};
}
export function formatGeographicCoordinates(
  latitude: number,
  longitude: number,
  options: {format?: 'degrees' | 'dms'; precision?: number} = {}
): string {
  return (
    formatAngle(latitude, {...options, axis: 'latitude'}) +
    ', ' +
    formatAngle(longitude, {...options, axis: 'longitude'})
  );
}
