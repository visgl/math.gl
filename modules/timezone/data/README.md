# Approximate timezone geometry

These optional datasets are derived from [Timezone Boundary Builder 2026d](https://github.com/evansiroky/timezone-boundary-builder/releases/tag/2026d),
using the **comprehensive with-oceans** product. All 444 upstream identifiers are
retained, including ocean `Etc/GMT` regions. This preserves individual IANA join
keys rather than merging zones with identical present-day timekeeping.

© OpenStreetMap contributors and Timezone Boundary Builder contributors.
The geometry database, including these simplified derivatives, is licensed under
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) (see LICENSE-ODbL.txt).
The package's MIT code license does not replace the data license. Preserve attribution
and comply with ODbL when redistributing or adapting this database.

| Level | Spherical simplification interval | GeoJSON | GeoJSON gzip | GeoParquet |
| --- | --- | --- | --- | --- |
| low | 20 km | 427 KB | 142 KB | 196 KB |
| hi | 1 km | 3.56 MB | 1.33 MB | 2.41 MB |

Intervals are mapshaper spherical Douglas–Peucker thresholds, not guaranteed
maximum geodesic error bounds. Shared arcs are simplified jointly; `keep-shapes`
retains small zones. Coordinates are rounded to five decimal degrees. Invalid
rings are repaired with Shapely; affected identifiers are listed in manifest.json.
Existing upstream disputed overlaps remain possible. No independent per-feature
simplification is performed. These are visualization assets, not authoritative
boundaries or an exact geographic lookup table.

Each JSON is a GeoJSON FeatureCollection with MultiPolygon geometries in
longitude/latitude degrees and exactly one property, `tzid`. GeoParquet 1.1 uses
`tzid: STRING`, `geometry: BINARY` (little-endian WKB MultiPolygon), Zstandard
compression, and standard `geo` metadata. Omitted CRS means OGC:CRS84.
No offset or DST fields are stored; join `tzid` with date-specific timezone APIs.

## Regeneration

Use Python 3.10+ and Node.js, installing build tools outside the package:

```sh
python3 -m venv /tmp/timezone-tools
/tmp/timezone-tools/bin/pip install -r modules/timezone/scripts/geometry-requirements.txt
npm install --prefix /tmp/timezone-node mapshaper@0.6.113
/tmp/timezone-tools/bin/python modules/timezone/scripts/generate-geometry.py \
  --mapshaper /tmp/timezone-node/node_modules/.bin/mapshaper
/tmp/timezone-tools/bin/python modules/timezone/scripts/check-geometry.py
```

The generator checks the pinned upstream ZIP checksum before extracting data.
Use `--archive /path/to/timezones-with-oceans.geojson.zip` for offline generation.
The manifest records provenance, simplification settings, sizes, repairs, and asset
checksums. Build tools are not runtime dependencies. Update the pinned release and
checksum deliberately when refreshing the data; review the regenerated geometry.
