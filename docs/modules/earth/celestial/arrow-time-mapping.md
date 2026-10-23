# Arrow JS temporal mapping

This is a semantic mapping, not a claim that every JavaScript object supports every
Arrow int64 value. Check range, precision and conversion policy separately. Getter behavior
was checked against installed Arrow JS 21.2.0 and the current Arrow JS source on October 23, 2026.
Arrow remains an optional interoperability boundary; celestial has no Arrow dependency.

## Five distinct concepts

| Concept | Meaning | Existing JavaScript / Cesium representation | Possible math.gl representation |
| --- | --- | --- | --- |
| Civil date | A calendar date without time or zone | `Temporal.PlainDate`; `Date` needs an explicit midnight convention | Proposed `EpochDay` or civil-date record |
| Time of day | Clock reading without a date or zone | `Temporal.PlainTime` | Proposed `TimeOfDay` tick count |
| Instant | A physical point on a declared time scale | `Temporal.Instant` / `ZonedDateTime` for Unix time; Cesium `JulianDate` for astronomical TAI arithmetic | Implemented celestial `JulianDate`; proposed exact `TickInstant` for integer-preserving interchange |
| Fixed duration | An elapsed quantity, without an epoch | Time-only `Temporal.Duration`; numeric seconds for approximate calculations | Proposed `FixedDuration {ticks: bigint, unit}` or split `JulianDuration` |
| Calendar interval | Months/days/time applied relative to a calendar context | `Temporal.Duration`, subject to sign/range rules and `relativeTo` context | Proposed `CalendarInterval {months, days, nanoseconds}` preserving independent fields |

`JulianDate` is an instant/time-coordinate representation. A duration is not a Julian date,
and a civil date or clock reading cannot become an instant without an interpretation.
The new math.gl class accepts explicit TAI, TT and UT1 coordinates; Cesium's class stores
TAI internally. Julian day numbering is an astronomical coordinate, not the Julian calendar.

## Dates and times of day

| Arrow JS type | Physical storage / semantics | JS scalar getter | Natural existing mapping | Proposed exact representation / Julian mapping |
| --- | --- | --- | --- | --- |
| `DateDay` | int32 days since 1970-01-01 | `number`, epoch milliseconds | `Temporal.PlainDate` within range; `Date` at UTC midnight by convention | `EpochDay {days: number}`. For a Julian instant, choose a time of day, zone and scale conversion. |
| `DateMillisecond` | int64 epoch milliseconds, constrained to whole-day multiples | `number`, epoch milliseconds | Same civil-date meaning as `DateDay` | Bigint day count after exact division by 86400000. It is not a general timestamp type. |
| `TimeSecond` | int32 seconds since midnight | `number` in seconds | `Temporal.PlainTime` | `TimeOfDay {ticks, unit:'s'}`; date and zone needed for an instant. |
| `TimeMillisecond` | int32 milliseconds since midnight | `number` in milliseconds | `Temporal.PlainTime` | Same, unit `'ms'`. |
| `TimeMicrosecond` | int64 microseconds since midnight | `bigint` in microseconds | `Temporal.PlainTime` after exact field decomposition | Same, unit `'us'`; conversion to nanoseconds uses bigint multiplication. |
| `TimeNanosecond` | int64 nanoseconds since midnight | `bigint` in nanoseconds | `Temporal.PlainTime` after exact field decomposition | Same, unit `'ns'`. |

Arrow time-of-day values are in [00:00, 24:00), with no leap-second label. Valid nanoseconds since midnight are below 2^53, so they can also be stored as exact
number-valued integers after range validation, even though Arrow JS returns bigint.
An Arrow
`TimeNanosecond` is not an epoch timestamp despite having 64-bit storage. Date64 values must
be whole-day multiples; do not treat their physical millisecond encoding as arbitrary time.
[Arrow schema](https://github.com/apache/arrow/blob/main/format/Schema.fbs)

## Timestamps: unit and timezone are separate decisions

All four types store signed int64 ticks. Arrow JS timestamp scalar getters return
**number-valued epoch milliseconds**, including fractional milliseconds for micro/nanosecond
types. Preserve raw bigint ticks to retain the full encoded precision.
[Arrow JS types](https://github.com/apache/arrow-js/blob/main/src/type.ts),
[get visitor](https://github.com/apache/arrow-js/blob/main/src/visitor/get.ts)

| Arrow JS type | Raw tick unit | Existing exact-integer mapping | Julian / proposed mapping |
| --- | --- | --- | --- |
| `TimestampSecond` | seconds | With timezone: `Temporal.Instant.fromEpochNanoseconds(ticks * 1000000000n)`, subject to range | `JulianDate.fromUnixTicks(ticks, 's', scaleMinusUtc, scale)` for known physical instants; proposed `TickInstant` preserves all ticks. |
| `TimestampMillisecond` | milliseconds | With timezone: `Temporal.Instant` from `ticks * 1000000n`; `Date` within its range | Same, unit `'ms'`. A raw int64 millisecond value is not always an exact JS number. |
| `TimestampMicrosecond` | microseconds | With timezone: `Temporal.Instant` from `ticks * 1000n`, subject to range | Same, unit `'us'`; avoid number-valued getters for a lossless conversion path. |
| `TimestampNanosecond` | nanoseconds | With timezone: `Temporal.Instant.fromEpochNanoseconds(ticks)`, subject to range | Same, unit `'ns'`. Integer storage is exact; the Julian seconds field is binary64 and export rounding must be explicit. |

| Arrow timezone annotation | Meaning | Existing mapping | Conversion condition |
| --- | --- | --- | --- |
| `'UTC'` | Unix-epoch physical instant; leap seconds omitted | `Temporal.Instant`, or `Date` with millisecond limits | To TAI/TT/UT1, provide the appropriate scale-minus-UTC offset at that instant. |
| Nonempty valid IANA/fixed-offset zone | Same physical epoch ticks plus zone metadata | `Temporal.Instant` plus zone, or `Temporal.ZonedDateTime` | Preserve the zone separately if it cannot be interpreted by the target. Changing between nonempty zones does not shift raw epoch ticks. |
| Empty / missing | Wall-clock date/time in an unspecified zone | `Temporal.PlainDateTime`, within range | A zone and DST ambiguity policy are needed before choosing a physical instant. Never silently assume UTC. |

Timezone metadata does not select TAI, TT or UT1. Standard Arrow timestamps and
`Temporal.Instant` both omit leap seconds. TAI ticks should not be labeled as ordinary UTC
Arrow timestamps. Use a custom extension/struct or int64-plus-metadata representation with
explicit epoch, scale and unit.
[Arrow timestamp semantics](https://github.com/apache/arrow/blob/main/format/Schema.fbs),
[Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html)

## Fixed durations

Every Arrow duration uses signed int64 storage and Arrow JS returns bigint ticks.

| Arrow JS type | Exact fixed-length mapping | Existing JS mapping | Julian-style mapping |
| --- | --- | --- | --- |
| `DurationSecond` | `{ticks, unit:'s'}`; nanoseconds = ticks × 1000000000n | Time-only `Temporal.Duration` after integer decomposition, within range | Proposed `JulianDuration`, or add seconds to a Julian instant when the number conversion is safe. |
| `DurationMillisecond` | `{ticks, unit:'ms'}`; nanoseconds = ticks × 1000000n | Same, within range; numeric milliseconds only when precision permits | Split whole days and fractional seconds before using floating-point arithmetic. |
| `DurationMicrosecond` | `{ticks, unit:'us'}`; nanoseconds = ticks × 1000n | Same, within range | Same split representation; decimal fractions are not generally exact binary64 values. |
| `DurationNanosecond` | `{ticks, unit:'ns'}` | Same, within range | Same; round-trip tick recovery needs an explicit rounding rule. |

Fixed duration has no epoch or timezone. Convert units with bigint before narrowing to
number. Dividing by a coarser unit can require rounding; multiplying can overflow an Arrow
int64 even though a JavaScript bigint remains exact. Arrow permits subtracting Unix
timestamps without accounting for inserted leap seconds; that result can differ from true
elapsed SI time. Continuous TAI arithmetic requires a correct mapping of both endpoints.
[Arrow duration semantics](https://github.com/apache/arrow/blob/main/format/Schema.fbs)

## Calendar intervals

| Arrow JS type | Raw fields | Existing JS mapping | Recommended hypothetical mapping |
| --- | --- | --- | --- |
| `IntervalYearMonth` | int32 total months | `Temporal.Duration({months})`, within its range | `CalendarInterval {months, days:0, nanoseconds:0n}`. |
| `IntervalDayTime` | int32 days + int32 milliseconds | `Temporal.Duration` retaining days and time separately, when signs/range permit | `CalendarInterval {months:0, days, nanoseconds:BigInt(milliseconds)*1000000n}`. |
| `IntervalMonthDayNano` | int32 months + int32 days + int64 nanoseconds | Conditional `Temporal.Duration`; not a direct mapping for mixed-sign fields | Preserve `{months, days, nanoseconds}` independently. Do not flatten months/days to fixed seconds without calendar/zone context. |

Arrow permits independent signs and unnormalized nanoseconds in month/day/nano intervals.
`Temporal.Duration` requires consistent signs. Normalizing a mixed-sign calendar interval may
need an anchor date, calendar, timezone and application policy. Preserve its raw components
when that context is absent. A calendar day can differ from 86400 elapsed seconds at a DST
transition. These types do not map directly to `JulianDate` or an unanchored fixed duration.
[Arrow intervals](https://github.com/apache/arrow/blob/main/format/Schema.fbs),
[Temporal.Duration](https://tc39.es/proposal-temporal/docs/duration.html)

Arrow JS's year/month getter exposes an Int32 pair of years/months; its day/time getter
exposes an Int32 pair of days/milliseconds. The month/day/nano getter exposes four Int32
words; decode the final signed 64-bit nanosecond field with correct word order/endianness,
view offset and chunk handling, rather than treating those words as four semantic fields.
[Getter implementation](https://github.com/apache/arrow-js/blob/main/src/visitor/get.ts)

## Precision, range and adapter rules

- Raw int64 nanosecond timestamps span approximately 1677–2262; microseconds span about
  ±292,000 years about the epoch. Coarser Arrow timestamps have wider ranges. Temporal and
  `Date` have separate limits, so test the target range even when Arrow storage is valid.
- A split day/seconds representation keeps fractional seconds small. Around 86400 seconds,
  binary64 spacing is approximately 14.6 picoseconds. This is representation spacing, not
  a model accuracy claim, and arithmetic/scale conversion still rounds.
- At October 23, 2026, number-valued epoch milliseconds have approximately 244 ns spacing.
  A local Arrow JS 21.2.0 check of raw timestamps differing by 1 ns returned equal values
  through `vector.get()`, while the bigint buffer retained the difference.
- Preserve Arrow nulls via its validity bitmap. Zero is a valid time/duration, not a null
  sentinel. Respect chunks, view offsets, units and timezone metadata.
- A future Arrow adapter belongs at the optional GeoArrow boundary, while celestial exposes
  dependency-free scalar bigint conversion. The proposed date/time/duration/interval record
  types above are design candidates, not newly shipped APIs or Arrow extension standards.
