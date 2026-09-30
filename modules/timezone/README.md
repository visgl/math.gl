# Overview

`@math.gl/timezone` is an intentional complement to JavaScript's `Intl`: it supplies geographic timezone lookup and numeric local-calendar computations for maps, charts, daily aggregation, and scheduling. `Intl` remains the interface for localized presentation and supplies the runtime's timezone rules. math.gl turns those rules into application-facing coordinates, fields, offsets, day boundaries, and transition records.

## Design

The API centers on computational results: IANA identifiers, numeric fields, and epoch milliseconds. Use `Intl.DateTimeFormat` directly for general date and time formatting; the module's date-aware timezone label helper is a small convenience for timezone selectors and legends.

Capabilities have separate dependency boundaries:

- `@math.gl/timezone`: offsets, local calendar fields, timezone labels, runtime identifier support, and lazy geographic lookup. These utilities use native `Intl`.
- `@math.gl/timezone/lookup`: synchronous approximate geographic lookup with the compact boundary table.
- `@math.gl/timezone/temporal`: local-day boundaries, local-time conversion, and offset transitions. This entry point uses `@js-temporal/polyfill` for Temporal algorithms across supported browsers and Node versions. It does not modify globals. Its compatibility dependency is isolated from root and lookup consumers; it still uses runtime timezone rules.

The package does not ship an `Intl` polyfill or a separate date-specific timezone-rule database.

## Installation

```bash
npm install @math.gl/timezone
```

## Usage

```typescript
import {getTimezoneOffset, getLocalDateTime, lookupTimezoneAsync} from '@math.gl/timezone';

const timezone = await lookupTimezoneAsync([-74.006, 40.7128]);
const instant = new Date('2024-07-15T12:00:00Z');
const offset = getTimezoneOffset(timezone, instant); // -240
const local = getLocalDateTime(timezone, instant); // year/month/day and clock fields
const label = new Intl.DateTimeFormat('en', {timeZone: timezone, dateStyle: 'full'}).format(instant);
```

The root offset utility uses native `Intl.DateTimeFormat`, without importing the geographic table. The asynchronous lookup loads that table on first use and reuses the loaded module. Bundlers with dynamic-import code splitting can put lookup data in a separate chunk; downloading it is deferred, not eliminated. Importing only the offset utility allows tree shaking to remove lookup entirely.

For synchronous lookup, import the dedicated entry point:

```typescript
import {lookupTimezone} from '@math.gl/timezone/lookup';

const timezone = lookupTimezone([-74.006, 40.7128]); // America/New_York
```

Coordinates are `[longitude, latitude]` in degrees. Geographic lookup uses the compact [@photostructure/tz-lookup](https://github.com/photostructure/tz-lookup) dependency. Its compressed boundaries are approximate and can produce incorrect results, including near borders. It returns one identifier and does not resolve ambiguous political timezone usage. Upstream package updates refresh geographic data; date-specific offsets depend separately on the runtime's timezone database.

## Local calendar computations

```typescript
import {
  getStartOfDay,
  getTimezoneTransitions,
  localDateTimeToInstant
} from '@math.gl/timezone/temporal';

const dayStart = getStartOfDay('America/New_York', new Date('2024-03-10T12:00:00Z'));
// Epoch milliseconds for 2024-03-10T05:00:00Z. This local day has 23 hours.

const instant = localDateTimeToInstant(
  'America/New_York',
  {year: 2024, month: 11, day: 3, hour: 1, minute: 30},
  {disambiguation: 'later'}
); // Epoch milliseconds for 2024-11-03T06:30:00Z.

const changes = getTimezoneTransitions(
  'America/New_York',
  Date.parse('2024-01-01T00:00:00Z'),
  Date.parse('2025-01-01T00:00:00Z')
); // Two records containing instant, offsetBefore, and offsetAfter.
```

Local clock fields alone do not uniquely identify an instant. Offset changes can repeat clock times or skip them entirely. Conversion rejects ambiguous or nonexistent times by default; callers can choose `earlier`, `later`, or Temporal's `compatible` behavior. Day boundaries use the first valid instant of the local calendar date, which can be later than midnight. Transition records describe any offset change, including political changes; they do not classify changes as daylight saving.
