# Overview

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`@math.gl/earth/timezone` supplies geographic timezone lookup and numeric local-calendar computations. Use it for map labels, daily aggregation, and scheduling. It uses the runtime's timezone rules; use `Intl.DateTimeFormat` for localized presentation.

## Feature support[​](#feature-support "Direct link to Feature support")

Geographic timezone identification and DST-aware calendar computation capabilities.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                             | math.gl support    | Notes                                                                                                                                                                                                    |
| --------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numeric offsets and local calendar fields           | ✅ Implemented     | [Timezone utilities](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone/api-reference/timezone.md) use runtime Intl rules and return numeric values suitable for computation. |
| Synchronous and lazy geographic lookup              | ✅ Implemented     | Approximate compact boundary lookup supplies IANA identifiers; async lookup defers loading that data.                                                                                                    |
| Ambiguous/nonexistent local-time handling           | ✅ Implemented     | Local-time conversion rejects by default and offers explicit earlier/later/compatible policies.                                                                                                          |
| Local-day boundaries and offset transitions         | ✅ Implemented     | DST and political offset changes are handled using the runtime timezone database.                                                                                                                        |
| Optional GeoJSON/GeoParquet boundary assets         | ✅ Implemented     | Separately licensed, approximate geometry is independent of date-specific timezone rules.                                                                                                                |
| Authoritative border/political ambiguity resolution | ❌ Not implemented | Lookup returns one approximate identifier and does not adjudicate disputed, historical or date-dependent geographic usage.                                                                               |
| Bundled independent timezone-rule database          | ❌ Not implemented | Native Intl/runtime rules remain required; the vendored Temporal compatibility code does not ship a separate tzdb.                                                                                       |
| Recurrence and general scheduling engine            | ❌ Not implemented | RRULE calendars, business calendars and job scheduling are application responsibilities; this module supplies calendar primitives.                                                                       |

## Timezone globe[​](#timezone-globe "Direct link to Timezone globe")

<!-- -->

Loading <!-- -->Timezone globe<!-- -->…

⛶⛶ Explore fullscreen

Change the date to explore daylight saving offsets, hover for local clock details, and choose low or high geometry resolution. Drag to rotate the globe. [Open the globe example](https://visgl.github.io/math.gl/next/examples/timezone-globe) for a larger view.

## Design[​](#design "Direct link to Design")

The API centers on computational results: IANA identifiers, numeric fields, and epoch milliseconds. Use `Intl.DateTimeFormat` directly for general date and time formatting; the module's date-aware timezone label helper is a small convenience for timezone selectors and legends.

Capabilities have separate dependency boundaries:

* `@math.gl/earth/timezone`: offsets, local calendar fields, timezone labels, runtime identifier support, and lazy geographic lookup. These utilities use native `Intl`.
* `@math.gl/earth/timezone`: synchronous approximate geographic lookup with the compact boundary table.
* `@math.gl/earth/timezone`: local-day boundaries, local-time conversion, and offset transitions. This entry point uses a vendored copy of `@js-temporal/polyfill` 0.5.1 (including JSBI) for Temporal algorithms across supported browsers and Node versions. It does not modify globals. Its vendored compatibility implementation is isolated from root and lookup consumers; it still uses runtime timezone rules.

The package does not ship an `Intl` polyfill or a separate date-specific timezone-rule database.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/earth
```

## Usage[​](#usage "Direct link to Usage")

```
import {getTimezoneOffset, getLocalDateTime, lookupTimezoneAsync} from '@math.gl/earth/timezone';



const timezone = await lookupTimezoneAsync([-74.006, 40.7128]);

const instant = new Date('2024-07-15T12:00:00Z');

const offset = getTimezoneOffset(timezone, instant); // -240

const local = getLocalDateTime(timezone, instant); // year/month/day and clock fields

const label = new Intl.DateTimeFormat('en', {timeZone: timezone, dateStyle: 'full'}).format(instant);
```

The offset utility uses native `Intl.DateTimeFormat`; a tree-shaken named import excludes the geographic table. Unbundled root imports evaluate their statically exported modules. The asynchronous lookup loads that table on first use and reuses the loaded module. Bundlers with dynamic-import code splitting can put lookup data in a separate chunk; downloading it is deferred, not eliminated. Importing only the offset utility allows tree shaking to remove lookup entirely.

For synchronous lookup, import the dedicated entry point:

```
import {lookupTimezone} from '@math.gl/earth/timezone';



const timezone = lookupTimezone([-74.006, 40.7128]); // America/New_York
```

Coordinates are `[longitude, latitude]` in degrees. Geographic lookup uses the compact [@photostructure/tz-lookup](https://github.com/photostructure/tz-lookup) implementation, vendored at version 11.7.0. Its compressed boundaries are approximate and can produce incorrect results, including near borders. It returns one identifier and does not resolve ambiguous political timezone usage. Updating the vendored upstream snapshot refreshes geographic data; date-specific offsets depend separately on the runtime's timezone database.

## Local calendar computations[​](#local-calendar-computations "Direct link to Local calendar computations")

```
import {

  getStartOfDay,

  getTimezoneTransitions,

  localDateTimeToInstant

} from '@math.gl/earth/timezone';



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

## Optional geometry datasets[​](#optional-geometry-datasets "Direct link to Optional geometry datasets")

Approximate timezone polygons, including oceans, are available as separate assets:

* `@math.gl/earth/timezone/timezone-geometry-low.json`
* `@math.gl/earth/timezone/timezone-geometry-hi.json`
* `@math.gl/earth/timezone/timezone-geometry-low.parquet`
* `@math.gl/earth/timezone/timezone-geometry-hi.parquet`

JSON assets are standard GeoJSON FeatureCollections; each feature contains a MultiPolygon and `properties.tzid`. Low uses a 20 km simplification interval (\~142 KB gzip), high uses 1 km (\~1.33 MB gzip). Both retain 444 identifiers from Timezone Boundary Builder 2026d's comprehensive with-oceans dataset.

```
import geometry from '@math.gl/earth/timezone/timezone-geometry-low.json' with {type: 'json'};

import {getTimezoneOffset} from '@math.gl/earth/timezone';



const instant = Date.parse('2026-07-15T12:00:00Z');

const offsetMinutes = getTimezoneOffset(geometry.features[0].properties.tzid, instant);
```

For Vite, load assets by URL instead of including geometry in JavaScript:

```
import geometryUrl from '@math.gl/earth/timezone/timezone-geometry-low.json?url';

import parquetUrl from '@math.gl/earth/timezone/timezone-geometry-hi.parquet?url';



const geometry = await fetch(geometryUrl).then(response => response.json());

// Pass parquetUrl to a GeoParquet-capable loader, or fetch its binary contents.
```

Parquet subpaths resolve to binary assets, not JavaScript modules; a plain import is not automatically a URL. Use your bundler's asset mechanism or, in Node.js, `import.meta.resolve('@math.gl/earth/timezone/timezone-geometry-hi.parquet')` to obtain its file URL. GeoParquet 1.1 contains `tzid` strings and WKB `geometry` with OGC<!-- -->:CRS84<!-- --> coordinates. Geometry contains no date-specific rules or offsets. These assets are never imported by the root, lookup, or temporal entry points.

See the [deck.gl 9.4 globe example](https://visgl.github.io/math.gl/next/examples/timezone-globe) for a date slider, offset colors, and local-time hover details. Boundaries are approximate; IANA does not define geographic polygons. Individual identifiers may require a newer runtime timezone database.

The geometry data is **ODbL 1.0**, separately from the package's MIT code. Attribute OpenStreetMap contributors and Timezone Boundary Builder and preserve applicable ODbL obligations. See `data/README.md`, `data/LICENSE-ODbL.txt`, and `data/manifest.json` in the package for provenance and regeneration details.
