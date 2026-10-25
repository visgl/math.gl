# Coordinate utilities

`@math.gl/geospatial/coordinates` supplies strict angle text, standard WGS84 UTM/UPS grid selection and MGRS cells. It reuses math.gl's existing transverse Mercator and polar stereographic kernels; it does not select a datum, epoch or vertical transformation. Angles are degrees, latitude precedes longitude, and projected distances are metres.

```
import {

  projectGrid, unprojectGrid, formatMGRS, parseMGRS,

  parseGeographicCoordinates, formatGeographicCoordinates

} from '@math.gl/geospatial/coordinates';



const point = parseGeographicCoordinates('48°51′29.52″N, 2°17′40.20″E');

const grid = projectGrid(point.latitude, point.longitude);

// {zone: 31, north: true, easting: ..., northing: ...}

const cell = parseMGRS(formatMGRS(point.latitude, point.longitude, 5));

const text = formatGeographicCoordinates(cell.latitude, cell.longitude);
```

## Angles[​](#angles "Direct link to Angles")

`parseAngle(text, axis = 'angle')` accepts decimal degrees, colon-separated DMS/decimal minutes, or marked DMS using `d`/`°`, `'`/`′` and `"`/`″`. One N/S/E/W prefix or suffix is allowed. Use an explicit sign **or** a hemisphere; double sign/hemisphere interpretations are rejected. Minutes/seconds must be below 60; only the last supplied component may be fractional. Scientific notation, arithmetic expressions, nonfinite values and space-only DMS separators are not accepted. Whitespace around markers is allowed. Input length is bounded.

The optional axis is `latitude` (±90), `longitude` (±180), or `angle` (±1e6). Hemisphere letters must match an explicit axis. Negative zero retains S/W meaning. `formatAngle(value, {axis?, format?, precision?})` defaults to marked DMS with three fractional second digits. `format: 'degrees'` emits decimal degrees. Precision is 0–6 decimal places in the final component; rounded carries propagate through seconds/minutes. `parseGeographicCoordinates` requires an explicit comma between latitude and longitude; it does not infer coordinate order.

## Grid coordinates[​](#grid-coordinates "Direct link to Grid coordinates")

`standardGridZone(latitude, longitude)` returns UTM zone 1–60 or UPS zone 0. UTM covers `-80 ≤ latitude < 84`; polar latitudes use UPS. Norway and Svalbard exceptions follow GeographicLib's standard-zone convention. Both dateline labels ±180 select zone 1. `projectGrid` returns `{zone, north, easting, northing}`; negative-zero latitude retains the southern-hemisphere convention.

`unprojectGrid(grid)` accepts the MGRS-compatible envelopes: UTM easting 100–900 km, northing 0–9500 km north or 1000–10000 km south; UPS easting/northing 1300–2700 km north or 800–3200 km south. Envelope membership is not proof of standard-zone membership. Decoded cells may overlap a standard-zone/band boundary. Exact poles have exact UPS origin `(2000000, 2000000)`; inverse pole longitude is canonical zero. Cardinal UPS meridians retain exact grid-axis coordinates.

The private prepared-kernel cache is bounded by the 122 zone/hemisphere pairs. Forced-zone forward transforms, alternate datums and convergence/scale factors remain available through the existing projection APIs rather than this facade.

## MGRS[​](#mgrs "Direct link to MGRS")

`formatMGRS(latitude, longitude, precision = 5)` selects the standard grid zone and truncates to a cell. Precision 0–5 means 100 km through 1 m cells. `parseMGRS(text, {center = true})` returns the zone, hemisphere, grid coordinates, latitude/longitude, precision and cell resolution. Whitespace and case are normalized. The default is the cell centre; `{center: false}` returns its southwest grid corner. These are grid cells, not geodesic uncertainty circles.

This bounded profile rejects zone-only descriptors, `INVALID` sentinels and sub-metre MGRS strings. Those are intentional differences from full GeographicLib, not missing projection accuracy. Re-encoding a floating latitude/longitude at an exact cell corner can select an adjacent cell within projection roundoff; preserve the decoded grid/cell identifier when exact textual identity matters. No epsilon snapping is applied to arbitrary grid lines.

## Coverage and evidence[​](#coverage-and-evidence "Direct link to Coverage and evidence")

Existing math.gl APIs already cover general CRS operations, UTM and polar stereographic equations. This entry adds zone policy, grid/text composition and a bounded MGRS codec; it does not replace those kernels. There are 715 pinned native GeographicLib 2.7 binary64 controls, with original inputs and source/driver hashes. Forward grid error is gated at 0.5 µm, inverse angles at `2e-10` degree, and cell labels/decoded grid positions are checked separately. Stored native controls run in Node and three browsers without downloading or compiling native code in CI.

MGRS alphabets/row-band rules and zone exceptions retain GeographicLib MIT/SPDX credits and packaged license terms. Angle parsing is original math.gl code.
