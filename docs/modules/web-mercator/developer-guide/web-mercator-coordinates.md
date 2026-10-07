# Web Mercator Coordinates

Use matching forward and inverse helpers for each coordinate space. Geographic positions, world coordinates, EPSG:3857 metres, and viewport pixels are different representations.

| Space | Units and conventions | Helpers |
| --- | --- | --- |
| Longitude/latitude | Degrees, longitude first; optional altitude in metres | `WebMercatorViewport.project()` / `unproject()` |
| World | A 512-unit-wide Web Mercator plane at zoom 0 | `lngLatToWorld()` / `worldToLngLat()` |
| EPSG:3857 | Projected easting/northing in metres | `lngLatToEPSG3857()` / `EPSG3857ToLngLat()` |
| Pixels | Viewport screen coordinates | `WebMercatorViewport.project()` / `unproject()` |

## Geographic inputs

Arrays use `[longitude, latitude, altitude]`. Latitude approaches an infinite projected value at the poles; the square Web Mercator map domain uses approximately ±85.051129°. Altitude is passed through the viewport's local distance scale; the module does not perform geoid or vertical-datum conversion.

Viewport longitude, latitude, pitch, and bearing are degrees. Core matrix rotation methods use radians.

## World and metre coordinates

World XY coordinates use a fixed scale independent of viewport zoom. Zoom changes the camera scale, rather than the output of `lngLatToWorld()`. EPSG:3857 helpers instead return metres; do not mix their results with world-coordinate helpers.

Distance scales vary with latitude. Use the viewport's distance scales near its center, and avoid treating a local metres-per-pixel value as a global constant.

## Screen coordinates

By default, screen pixels start at the top left: positive X points right and positive Y points down. The `topLeft` option can reverse the Y convention. An optional third output component is normalized depth, not geographic altitude.

When unprojecting a two-component pixel position, the viewport uses a target altitude or the default ground plane. Supply depth when reconstructing a full projected position. See [WebMercatorViewport](../api-reference/web-mercator-viewport.md) and [coordinate utilities](../api-reference/web-mercator-utils.md) for signatures and options.
