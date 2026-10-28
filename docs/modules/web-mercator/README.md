# Overview

`@math.gl/web-mercator` provides a map camera and coordinate utilities for spherical Web Mercator. Use `WebMercatorViewport` to convert longitude/latitude positions to screen pixels and back with zoom, pitch, and bearing.

Geographic inputs use `[longitude, latitude]` in degrees, with optional altitude in metres. For CRS conversions beyond Web Mercator, use [projection](../geospatial/projection/README.md).

## Feature support

Map-camera and coordinate capabilities for spherical Web Mercator.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Longitude/latitude and world-coordinate conversion | ✅ Implemented | [Coordinate utilities](./api-reference/web-mercator-utils.md) define spherical Mercator, zoom scales and projection/view matrices. |
| EPSG:3857 metre-coordinate conversion | ✅ Implemented | Explicit forward/inverse helpers distinguish metre coordinates from pixel-scaled world coordinates. |
| Zoom, pitch and bearing camera projection | ✅ Implemented | [WebMercatorViewport](./api-reference/web-mercator-viewport.md) projects/unprojects geographic and screen positions. |
| Bounds fitting and viewport normalization | ✅ Implemented | fitBounds, getBounds and normalized camera properties support explicit viewport/padding contracts. |
| Distance scales and metre offsets | ✅ Implemented | Latitude-dependent scale helpers and addMetersToLngLat support local approximations within documented limits. |
| Fly-to interpolation | ✅ Implemented | flyToViewport and getFlyToDuration provide camera-path interpolation helpers. |
| Ellipsoidal Mercator and arbitrary CRS cameras | ❌ Not implemented | This camera model is spherical Web Mercator; use the [projection module](../geospatial/projection/README.md) for other CRS transforms. |
| Terrain-depth and mesh intersection picking | ❌ Not implemented | Screen/plane unprojection is not a terrain/depth-buffer intersection engine. |
| General globe/flat rendering and GPU ownership | ❌ Not implemented | The public viewport API does not supply a complete globe renderer, shared render-state transition, or GPU resource lifecycle. |

## Example Usage

```bash
npm install @math.gl/web-mercator
```

```js
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

## Coordinate utilities

The [utility reference](./api-reference/web-mercator-utils.md) covers world coordinates, distance scales, zoom conversions, and EPSG:3857 coordinates in metres. World coordinates and EPSG:3857 metres use different scales; select the matching forward and inverse helpers.

The module continues the API from the archived `viewport-mercator-project` package.
