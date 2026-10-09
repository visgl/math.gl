# Geoid

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

class `Geoid` - "Gravity Height Model"

The `Geoid` class calculates the difference between mean sea level height and WGS84 ellipsoid height.

Create an instance with [parsePGM](https://visgl.github.io/math.gl/next/docs/modules/geoid/api-reference/parse-pgm.md) for GeographicLib PGM files, or [createGeoidFromGrid](https://visgl.github.io/math.gl/next/docs/modules/geoid/api-reference/create-geoid-from-grid.md) for decoded `Uint16Array` grid samples. Model grids are available from [GeographicLib](https://geographiclib.sourceforge.io/html/geoid.html).

## Methods[​](#methods "Direct link to Methods")

##### Constructor[​](#constructor "Direct link to Constructor")

Create a `Geoid` instance.

@param options - object which includes parameters parsed from \_.pgm header options.data - binary buffer of \_.pgm file

Calculates difference between mean see level height and WGS84 ellipsoid height

@param lat - latitude @param lon - longitude @returns height in meters

##### getHeight(lat: number, lon: number): number;[​](#getheightlat-number-lon-number-number "Direct link to getHeight(lat: number, lon: number): number;")
