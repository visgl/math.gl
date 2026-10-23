# @math.gl/earth/celestial

Dependency-free time coordinates and rotation/state algebra for astronomical applications.
This optional subpath shares the existing mean-frame starfield equations with `earth/sun`.
It does not bundle a star catalog, ephemeris, Earth-orientation tables or satellite propagator.

```ts
import {JulianDate, getMeanEquatorialToLocalRotation} from '@math.gl/earth/celestial';

// Offsets are supplied for the represented instant by the application's data/model.
const ticks = 1792713600000000000n;
const ut1 = JulianDate.fromUnixTicks(ticks, 'ns', ut1MinusUtc, 'UT1');
const tt = JulianDate.fromUnixTicks(ticks, 'ns', ttMinusUtc, 'TT');
const rotation = getMeanEquatorialToLocalRotation(ut1, tt, 37.8, -122.4);
```

## JulianDate

An immutable, normalized pair of `dayNumber` (safe integer) and `secondsOfDay`
(binary64 in [0, 86400)), with a declared `timeScale`: `'TAI'`, `'TT'` or `'UT1'`.
Julian days start at noon. J2000 noon is day 2451545 with seconds zero in the selected
scale. This numbering is unrelated to using the Julian calendar.

- `new JulianDate(dayNumber, secondsOfDay = 0, timeScale = 'TAI')` normalizes seconds
  across day boundaries. Coordinates must remain in the safe-integer day domain.
- `JulianDate.fromUnixTicks(ticks, unit, scaleMinusUtc, timeScale = 'TAI')` accepts
  bigint ticks in `'s'`, `'ms'`, `'us'` or `'ns'`. It splits days before converting
  the remainder to number. `scaleMinusUtc` is the selected scale minus UTC in seconds
  **at this instant**. It is required even when zero.
- `JulianDate.fromUnixMilliseconds(numberOrDate, scaleMinusUtc, timeScale = 'TAI')`
  adapts existing millisecond inputs; it cannot recover precision already lost there.
- `addSeconds(seconds)` returns a new coordinate. `secondsDifference(other)` rejects
  different scales. TAI and TT support continuous SI elapsed time; UT1 differences are
  time-coordinate differences and are not guaranteed physical elapsed SI seconds.
- `toTimeScale(target, offsetSeconds)` requires target-minus-source seconds at this
  instant. It supplies no offset model. Same-scale conversion requires zero offset.
- `toUnixTicks(unit, scaleMinusUtc, rounding = 'reject')` exports bigint ticks. The
  default rejects fractional output ticks, including residual floating-point roundoff;
  `'nearest'` explicitly rounds, with half ties toward positive infinity.

The seconds field is floating point, not an exact decimal fraction. Preserve original
bigint ticks for authoritative interchange; use an explicit export rounding policy.
The class has no UTC-label parser or leap-second table. Mapping a time inside a leap
second back to Unix time requires application policy. Validating a historically or
physically correct offset remains the caller's responsibility, particularly before
1972. The class supports a wider numeric domain than any included physical model.

For a complete mapping of dates, clock times, timestamps, durations and calendar
intervals, see [Arrow JS temporal mapping](./arrow-time-mapping.md).

## CelestialFrameTransform

A rotation-only snapshot about a common origin. The constructor accepts a column-major
3×3 proper rotation and `{from, to, epoch, rotationRate?}`. Frame names are required
strings; `epoch` is an immutable `JulianDate`. Names do not infer a physical model.

`transformPosition(position)` applies the rotation. `transformState({position, velocity})`
uses `vTarget = R * vSource + rotationRate * positionSource`, with rate per second.
Position and velocity must share a distance unit, with velocity per second. State
conversion requires an explicit rotation derivative; for a static frame supply nine
zeros. Omitting the rate permits position conversion only.

`inverse()` returns the inverse snapshot. `then(next)` applies this snapshot followed
by the next, including the derivative product rule when both rates are known. Frame
names, epoch coordinates and time scales must match. Compose after explicit time-scale
conversion if necessary. Inputs are copied and getters return copies.

This class does not translate origins, transform covariance or evaluate an orbit.
A TEME state cannot be relabeled as J2000/ICRF; a qualified model must construct the
appropriate rotation and derivative.

## Approximate mean-frame helpers

- `getMeanSiderealAngle(ut1)` returns Greenwich mean sidereal angle, radians, using the
  existing USNO-style polynomial. It requires a UT1 coordinate.
- `getIAU1976Precession(tt)` returns the column-major mean equator/equinox J2000 to
  mean equator/equinox of date rotation. It requires TT.
- `getMeanEquatorialToLocalRotation(ut1, tt, latitude, longitude, epoch = 'J2000')`
  composes that approximation into outward local east/north/up axes. Observer angles
  are degrees; longitude is east-positive. `'date'` skips precession. Both input
  coordinates must describe the same instant; the caller supplies their scale relation.

These are existing visualization approximations factored into explicit-scale APIs.
They omit nutation, polar motion, aberration and modern frame bias. They are not a
qualified ICRF/GCRF-to-ITRF transform and have no newly established accuracy interval.
Keep modern observer orientation separate from million-year stellar simulations.
The existing `getStarfieldRotation` accepts optional `ut1MinusUtc` and `ttMinusUtc`
seconds; zero defaults preserve its previous UTC-as-UT1/TT approximation.
