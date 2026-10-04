# Optional EGM96 grids

These 16-bit big-endian PGM grids work directly with `parsePGM`. They are optional
package subpath exports; importing `@math.gl/geoid` does not load any grid.

| Export | Grid | Purpose |
| --- | --- | --- |
| `@math.gl/geoid/geoid-egm96-low.pgm` | 360 × 181, 1° | Small visualization preview |
| `@math.gl/geoid/geoid-egm96-hi.pgm` | 1440 × 721, 15′ | Original GeographicLib EGM96 grid |

The low grid takes every fourth row and column from the original grid. It retains
exact node values but does not retain the original interpolation error bounds.
Use the high grid for height conversion. Neither grid represents terrain elevation.
Heights N are meters above the WGS84 ellipsoid: h = H + N.

Grid nodes start at 90°N, 0°E, proceed east, and end at 90°S. Samples decode as
−108 + 0.003 × unsigned sample. Longitude wraps; both poles are included.

## Provenance and license

The NGA EGM96 model data are public domain, distributed in PGM format by
[GeographicLib](https://geographiclib.sourceforge.io/C++/doc/geoid.html).
[PROJ's NGA data attribution](https://github.com/OSGeo/PROJ-data/blob/master/us_nga/us_nga_README.txt)
documents the public-domain license. The package's MIT license covers its code.
`geoid-manifest.json` records the source archive and SHA-256 checksums.

Regenerate with `python3 modules/geoid/scripts/generate-data.py /path/to/egm96-15.tar.bz2`.
The generator checks the pinned archive checksum before reading it.
