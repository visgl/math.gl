# Overview

`@math.gl/web-mercator` provides a map camera and coordinate utilities for spherical Web Mercator. Use `WebMercatorViewport` to convert longitude/latitude positions to screen pixels and back with zoom, pitch, and bearing.

Geographic inputs use `[longitude, latitude]` in degrees, with optional altitude in metres. For CRS conversions beyond Web Mercator, use [projection](https://visgl.github.io/math.gl/next/docs/modules/projection.md).

## Example Usage[​](#example-usage "Direct link to Example Usage")

```
npm install @math.gl/web-mercator
```

```
import {WebMercatorViewport} from '@math.gl/web-mercator';



// A viewport looking at San Francisco city area

const viewport = new WebMercatorViewport({

  width: 800,

  height: 600,

  longitude: -122.45,

  latitude: 37.78,

  zoom: 12,

  pitch: 60,

  bearing: 30

});



viewport.project([-122.45, 37.78]);

// returns pixel coordinates [400, 300]

viewport.unproject([400, 300]);

// returns map coordinates [-122.45, 37.78]
```

## Coordinate utilities[​](#coordinate-utilities "Direct link to Coordinate utilities")

The [utility reference](https://visgl.github.io/math.gl/next/docs/modules/web-mercator/api-reference/web-mercator-utils.md) covers world coordinates, distance scales, zoom conversions, and EPSG:3857 coordinates in metres. World coordinates and EPSG:3857 metres use different scales; select the matching forward and inverse helpers.

The module continues the API from the archived `viewport-mercator-project` package.
