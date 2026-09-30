# Overview

`@math.gl/timezone` calculates date-aware UTC offsets and looks up approximate IANA timezones from geographic coordinates in browsers and Node.js.

## Installation

```bash
npm install @math.gl/timezone
```

## Usage

```typescript
import {getTimezoneOffset, lookupTimezoneAsync} from '@math.gl/timezone';

const timezone = await lookupTimezoneAsync([-74.006, 40.7128]);
const offset = getTimezoneOffset(timezone, new Date('2024-07-15T12:00:00Z')); // -240
```

The root offset utility uses native `Intl.DateTimeFormat`, without importing the geographic table. The asynchronous lookup loads that table on first use and reuses the loaded module. Bundlers with dynamic-import code splitting can put lookup data in a separate chunk; downloading it is deferred, not eliminated. Importing only the offset utility allows tree shaking to remove lookup entirely.

For synchronous lookup, import the dedicated entry point:

```typescript
import {lookupTimezone} from '@math.gl/timezone/lookup';

const timezone = lookupTimezone([-74.006, 40.7128]); // America/New_York
```

Coordinates are `[longitude, latitude]` in degrees. Geographic lookup uses the compact [@photostructure/tz-lookup](https://github.com/photostructure/tz-lookup) dependency. Its compressed boundaries are approximate and can produce incorrect results, including near borders. It returns one identifier and does not resolve ambiguous political timezone usage. Upstream package updates refresh geographic data; date-specific offsets depend separately on the runtime's timezone database.
