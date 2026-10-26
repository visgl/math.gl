# Coordinate utilities

`@math.gl/geospatial/coordinates` supplies strict angle text, standard/forced WGS84
UTM/UPS grid selection and MGRS cells. It reuses math.gl's existing transverse
Mercator and polar stereographic kernels; it does not select a datum, epoch or
vertical transformation. Angles are degrees, latitude precedes longitude, and
projected distances are metres.

```ts
import {
  projectGrid, unprojectGrid, transferGrid, formatMGRS, parseMGRS,
  parseGeographicCoordinates, formatGeographicCoordinates
} from '@math.gl/geospatial/coordinates';

const point = parseGeographicCoordinates('48°51′29.52″N, 2°17′40.20″E');
const grid = projectGrid(point.latitude, point.longitude);
// {zone: 31, north: true, easting: ..., northing: ...}
const cell = parseMGRS(formatMGRS(point.latitude, point.longitude, 5));
const text = formatGeographicCoordinates(cell.latitude, cell.longitude);
```

## Angles

`parseAngle(text, axis = 'angle')` accepts decimal degrees, colon-separated
DMS/decimal minutes, or marked DMS using `d`/`°`, `'`/`′` and `"`/`″`.
Standalone minute/second components such as `30′` and `30″` are also accepted,
with the component still below 60. One N/S/E/W prefix or suffix is allowed. Use an explicit sign **or** a hemisphere;
double sign/hemisphere interpretations are rejected. Minutes/seconds must be below
60; only the last supplied component may be fractional. Scientific notation,
arithmetic expressions, nonfinite values and space-only DMS separators are not
accepted. Whitespace around markers is allowed. Input length is bounded.

The optional axis is `latitude` (±90), `longitude` (±180), or `angle` (±1e6).
Hemisphere letters must match an explicit axis. Negative zero retains S/W meaning.
`formatAngle(value, {axis?, format?, precision?})` defaults to marked DMS with
three fractional second digits. `format: 'degrees'` emits decimal degrees; `format: 'dm'` emits degrees and
decimal minutes (e.g. `12°30.000′`).
Precision is 0–6 decimal places in the final component; rounded carries propagate
through seconds/minutes. `parseGeographicCoordinates` requires an explicit comma
between latitude and longitude; `{longitudeFirst: true}` explicitly reverses the
order for both parse and format. The parser never guesses order from magnitudes.

## Grid coordinates

`standardGridZone(latitude, longitude)` returns UTM zone 1–60 or UPS zone 0.
UTM covers `-80 ≤ latitude < 84`; polar latitudes use UPS. Norway and Svalbard
exceptions follow GeographicLib's standard-zone convention. Both dateline labels
±180 select zone 1. `projectGrid` returns `{zone, north, easting, northing}`;
negative-zero latitude retains the southern-hemisphere convention.

`unprojectGrid(grid)` defaults to the MGRS-compatible envelopes: UTM easting
100–900 km, northing 0–9500 km north or 1000–10000 km south; UPS easting/northing
1300–2700 km north or 800–3200 km south. Envelope membership is not proof of
standard-zone membership. Decoded cells may overlap a standard-zone/band boundary.
Exact poles have exact UPS origin `(2000000, 2000000)`; inverse pole longitude is
canonical zero (native UTMUPS uses 180° at the north UPS origin; this is an
intentional undefined-longitude convention). Cardinal UPS meridians retain exact grid-axis coordinates.

The private prepared-kernel cache is bounded by the 122 zone/hemisphere pairs.
`projectGrid(latitude, longitude, {zone?, north?, extended?})` can force zone
0 (UPS) or 1–60 (UTM), and a boolean target hemisphere. Natural zone and hemisphere
remain the defaults. UPS requires a matching polar hemisphere and latitude at
least 70° in magnitude; the grid envelope further limits legal output. UTM points
more than 60° from the central meridian are rejected before kernel evaluation.
Finite geographic inputs remain within ±90° latitude and ±180° longitude.

`extended: true` opts into GeographicLib UTMUPS envelopes: UTM easting 0–1000 km,
northing −9100–9600 km north or 900–19600 km south; UPS coordinates 1200–2800 km
north or 700–3300 km south. UTM northings may continue across the equator in the
selected hemisphere. Pass the same option to `unprojectGrid` for these coordinates.
The default envelope remains unchanged. Extended grid membership does not imply a
valid standard-zone or MGRS cell.

`transferGrid(grid, {zone?, north?, extended?})` re-expresses an existing grid point.
The input zone/hemisphere are retained unless explicitly changed. Same-zone
transfers copy easting exactly and shift northing by exactly 10,000,000 metres
when changing UTM hemisphere; same-hemisphere copies avoid a geographic round trip.
UPS hemisphere changes fail. Cross-zone transfers compose inverse and forward,
so their error includes both operations. Inputs remain unchanged; results are owned.

```ts
const standard = projectGrid(60, 6); // Norway: zone 32
const zone31 = projectGrid(60, 6, {zone: 31});
const samePoint = transferGrid(standard, {zone: 31});
const continued = projectGrid(-1, 3, {zone: 31, north: true, extended: true});
const geographic = unprojectGrid(continued, {extended: true});
```

Alternate datums and convergence/scale factors remain in the existing projection
APIs. A grid-zone transfer is not a datum or height transformation.

## MGRS

`formatMGRS(latitude, longitude, precision = 5)` selects the standard grid zone
and truncates to a cell. Precision 0–11 means 100 km through 1 µm cells:
5 is one metre, 8 is one millimetre, and 11 is one micrometre. The default remains 5.
An optional fourth argument `{zone}` forces the grid zone; the point must remain
in the MGRS envelope. Extra textual digits describe projected binary64 coordinates;
they do not establish micrometre physical accuracy. Projection roundoff can change
a trailing sub-metre digit near a cell boundary.
`parseMGRS(text, {center = true})` returns the zone, hemisphere, grid coordinates,
latitude/longitude, precision and cell resolution. Whitespace and case are
normalized. The default is the cell centre; `{center: false}` returns its southwest
grid corner. These are grid cells, not geodesic uncertainty circles.

`formatMGRSZone(latitude, longitude, {zone?})` emits a grid-zone designation
such as `31U` or `Z`. `parseMGRSZone(text)` returns `{zone, north, band}`. These
are regions, not cells: the parser deliberately does not fabricate a representative
point or an uncertainty radius. `parseMGRS` still requires a complete cell, so its
existing result type never acquires missing/NaN positions. Forced-zone descriptors
do not establish standard-zone membership.

The strict profile rejects `INVALID` sentinels and angle expressions. These are
intentional text-contract differences from full GeographicLib. Re-encoding a floating latitude/longitude at an
exact cell corner can select an adjacent cell within projection roundoff; preserve
the decoded grid/cell identifier when exact textual identity matters. No epsilon
snapping is applied to arbitrary grid lines.

## Coverage and evidence

Existing math.gl APIs already cover general CRS operations, UTM and polar
stereographic equations. This entry adds zone policy, grid/text composition and a
bounded MGRS codec; it does not replace those kernels. There are 1,000 pinned native
GeographicLib 2.7 binary64 controls, with original inputs and source/driver hashes.
Forward grid error is gated at 0.5 µm, inverse angles at `2e-10` degree, and cell
labels/decoded grid positions are checked separately. The existing through-metre
labels remain exact gates. Sub-metre native comparisons allow the unchanged
0.5 µm forward budget plus one cell of quantization, rather than asserting identical
trailing labels across different projection kernels. Native-grid MGRS decoding
retains its 10 nm budget. Forced zones, hemispheres, transfers, failure cases and
new angle forms have pinned native controls; decimal-cell arithmetic and exact
false-northing transfer identities provide independent checks. Stored native controls run
in Node and three browsers without downloading or compiling native code in CI.

MGRS alphabets/row-band rules and zone exceptions retain GeographicLib MIT/SPDX
credits and packaged license terms. Angle parsing is original math.gl code.
