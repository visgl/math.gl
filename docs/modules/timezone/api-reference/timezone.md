# Timezone utilities

## getTimezoneOffset(timezone, date?)

Returns the UTC offset in **minutes east of UTC**, including daylight saving at the supplied instant. New York returns `-300` in winter and `-240` in summer. This sign is opposite to `Date.getTimezoneOffset()`.

- `timezone`: IANA timezone identifier accepted by the runtime, such as `America/New_York` or `UTC`.
- `date`: a `Date` or epoch milliseconds; defaults to `Date.now()`.

Invalid dates and unsupported timezone identifiers throw `RangeError`. Results use native `Intl.DateTimeFormat` and depend on the runtime's timezone data and `longOffset` support. Historical offsets with seconds can return fractional minutes. Supplying an instant avoids ambiguous local times during daylight saving transitions.

## lookupTimezoneAsync(coordinates)

Root export returning `Promise<string>`. Lazily imports `@math.gl/timezone/lookup`; concurrent and later calls share the import. If loading fails, the promise rejects and a later call retries.

## lookupTimezone(coordinates)

Synchronous export from `@math.gl/timezone/lookup`, returning one approximate IANA timezone identifier. Importing this entry point brings in the geographic table.

Both lookup APIs accept a readonly `[longitude, latitude]` tuple in degrees. Longitude must be finite and within `[-180, 180]`; latitude must be finite and within `[-90, 90]`. Invalid values throw `RangeError` (or reject asynchronously). Coordinates are not wrapped or clamped. Ocean and boundary behavior follow the upstream lookup data.
