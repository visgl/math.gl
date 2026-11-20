# parsePGM

![From-v3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)

Parse a GeographicLib geoid PGM file into a `Geoid`. The parser requires one complete 16-bit raster matching the declared dimensions and finite offset and scale metadata. The scale must be positive.

## Functions[​](#functions "Direct link to Functions")

#### `parsePGM(data, options)`[​](#parsepgmdata-options "Direct link to parsepgmdata-options")

Parse "Earth Gravity Model" loaded from a \*.pgm file, e.g. <https://geographiclib.sourceforge.io/html/geoid.html>

```
parsePGM(data: Uint8Array, options: object}): GeoidHeightModel
```

* `data` - binary buffer of pgm file
* `options` - loader options
* `GeoidHeightModel` - instance of `GeoidHeightModel` class
