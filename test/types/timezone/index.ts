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
