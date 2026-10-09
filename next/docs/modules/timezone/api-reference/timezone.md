# Timezone utilities

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

## getTimezoneOffset(timezone, date?)[​](#gettimezoneoffsettimezone-date "Direct link to getTimezoneOffset(timezone, date?)")

Returns the UTC offset in **minutes east of UTC**, including daylight saving at the supplied instant. New York returns `-300` in winter and `-240` in summer. This sign is opposite to `Date.getTimezoneOffset()`.

* `timezone`: IANA timezone identifier accepted by the runtime, such as `America/New_York` or `UTC`.
* `date`: a `Date` or epoch milliseconds; defaults to `Date.now()`.

Invalid dates and unsupported timezone identifiers throw `RangeError`. Results use native `Intl.DateTimeFormat` and depend on the runtime's timezone data and `longOffset` support. Historical offsets with seconds can return fractional minutes. Supplying an instant avoids ambiguous local times during daylight saving transitions.

## lookupTimezoneAsync(coordinates)[​](#lookuptimezoneasynccoordinates "Direct link to lookupTimezoneAsync(coordinates)")

Root export returning `Promise<string>`. Lazily imports `@math.gl/timezone/lookup`; concurrent and later calls share the import. If loading fails, the promise rejects and a later call retries.

## lookupTimezone(coordinates)[​](#lookuptimezonecoordinates "Direct link to lookupTimezone(coordinates)")

Synchronous export from `@math.gl/timezone/lookup`, returning one approximate IANA timezone identifier. Importing this entry point brings in the geographic table.

Both lookup APIs accept a readonly `[longitude, latitude]` tuple in degrees. Longitude must be finite and within `[-180, 180]`; latitude must be finite and within `[-90, 90]`. Invalid values throw `RangeError` (or reject asynchronously). Coordinates are not wrapped or clamped. Ocean and boundary behavior follow the upstream lookup data.

## getLocalDateTime(timezone, date?)[​](#getlocaldatetimetimezone-date "Direct link to getLocalDateTime(timezone, date?)")

Root export returning a `LocalDateTime` object with numeric `year`, `month`, `day`, `hour`, `minute`, `second`, and `millisecond`. Fields use the proleptic Gregorian calendar, 1-based months, and hours 0–23. Year zero represents 1 BCE. The result describes a local clock reading, not an instant, and does not contain a timezone identifier.

`date` is a `Date` or epoch milliseconds and defaults to now. Results are independent of the host timezone and display locale. Invalid dates or unsupported timezone identifiers throw `RangeError`.

## getTimezoneLabel(timezone, date?, locale?)[​](#gettimezonelabeltimezone-date-locale "Direct link to getTimezoneLabel(timezone, date?, locale?)")

Root export returning a localized long timezone label for the instant, such as “Eastern Standard Time” or “Eastern Daylight Time”. The date defaults to now; locale is a string or string array and defaults to `en`. Labels can fall back to an offset or other localized text according to `Intl` and can vary with runtime locale data. Use labels for display, and identifiers for calculations.

Invalid dates, timezone identifiers, and malformed locale identifiers follow native `Intl` errors. This helper complements direct use of `Intl.DateTimeFormat` for general localized date/time formatting.

## isTimezoneSupported(timezone)[​](#istimezonesupportedtimezone "Direct link to isTimezoneSupported(timezone)")

Root export returning whether the current runtime's `Intl.DateTimeFormat` accepts an identifier. Supported aliases are accepted. Empty, invalid, and non-string values return `false`. Support is runtime-specific and does not establish geographic accuracy or canonicalize identifiers.

## getStartOfDay(timezone, date?)[​](#getstartofdaytimezone-date "Direct link to getStartOfDay(timezone, date?)")

Export from `@math.gl/timezone/temporal`, returning epoch milliseconds for the first valid instant of the date's local calendar day. The date is a `Date` or epoch milliseconds and defaults to now.

If midnight is skipped, returns the first valid time later in that day. If the day starts twice, chooses the earlier start. Consecutive local days need not be 24 hours apart. The supplied instant always identifies an existing local day; use `localDateTimeToInstant` to resolve an explicitly supplied local date.

## localDateTimeToInstant(timezone, fields, options?)[​](#localdatetimetoinstanttimezone-fields-options "Direct link to localDateTimeToInstant(timezone, fields, options?)")

Export from `@math.gl/timezone/temporal`, returning epoch milliseconds. `fields` is a `LocalDateTimeInput`: required integer `year`, `month`, and `day`, plus optional integer `hour`, `minute`, `second`, and `millisecond` that default to zero. Uses the proleptic Gregorian calendar. Invalid dates and out-of-range fields throw `RangeError` rather than being normalized. Leap-second input is not supported.

`options.disambiguation` controls repeated or nonexistent local clock times:

| Value              | Repeated time             | Nonexistent time          |
| ------------------ | ------------------------- | ------------------------- |
| `reject` (default) | Throw `RangeError`        | Throw `RangeError`        |
| `earlier`          | Choose earlier occurrence | Shift backward by the gap |
| `later`            | Choose later occurrence   | Shift forward by the gap  |
| `compatible`       | Choose earlier occurrence | Shift forward by the gap  |

The return value is an instant; format it with `Intl` or inspect it with `getLocalDateTime`. Invalid timezone identifiers and disambiguation values throw `RangeError`.

## getTimezoneTransitions(timezone, start, end)[​](#gettimezonetransitionstimezone-start-end "Direct link to getTimezoneTransitions(timezone, start, end)")

Export from `@math.gl/timezone/temporal`, returning a chronologically ordered `TimezoneTransition[]`. Each record contains `instant` (epoch milliseconds), `offsetBefore`, and `offsetAfter` (minutes east of UTC).

`start` and `end` are Dates or epoch milliseconds. The interval is `[start, end)`: a transition at start is included and one at end is excluded. Equal endpoints and intervals without changes return `[]`. Invalid instants, unsupported identifiers, or an end before start throw `RangeError`.

Transitions include daylight saving and political offset changes. Historical offsets can include seconds, so offset minutes may be fractional. Results depend on the runtime timezone database, and future political changes cannot be predicted beyond its rules. Runtime-supported Temporal fixed-offset identifiers are accepted by the `/temporal` APIs and have no transitions.

## Dependency boundaries[​](#dependency-boundaries "Direct link to Dependency boundaries")

Root helpers use native `Intl` and do not import the Temporal compatibility dependency. The `/temporal` entry point uses `@js-temporal/polyfill` without changing globals, exposing plain numeric results rather than polyfill objects. It imports neither the geographic table nor an `Intl` polyfill. The root and lookup entry points accept the identifiers supported by the runtime's `Intl`; `/temporal` uses Temporal's identifier rules.
