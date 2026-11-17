# Web Mercator

Web Mercator uses several coordinate spaces. Choose a forward/inverse pair for the space you need, and keep local distance approximations close to their reference point.

## Coordinates[​](#coordinates "Direct link to Coordinates")

| Space      | Convention                                                      | Helpers                                         |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Geographic | `[longitude, latitude]` in degrees; optional altitude in metres | Inputs to `WebMercatorViewport`                 |
| World      | A 512-unit-wide Mercator plane at zoom 0                        | `lngLatToWorld()` / `worldToLngLat()`           |
| EPSG:3857  | Projected easting/northing in metres                            | `lngLatToEPSG3857()` / `EPSG3857ToLngLat()`     |
| Screen     | Viewport pixels                                                 | `WebMercatorViewport.project()` / `unproject()` |

World coordinates have a fixed scale: zoom changes the camera, not the result of `lngLatToWorld()`. EPSG:3857 helpers return metres instead. Do not pass one representation to the other's inverse helper.

Mercator grows without bound at the poles. The square map domain ends at approximately ±85.051129° latitude. Altitude uses the viewport's local distance scale; the module does not convert geoids or vertical datums.

Viewport longitude, latitude, pitch, and bearing use degrees. Core matrix rotations use radians.

## Screen[​](#screen "Direct link to Screen")

```
import {WebMercatorViewport} from '@math.gl/web-mercator';



const viewport = new WebMercatorViewport({

  width: 800, height: 600,

  longitude: -122.4, latitude: 37.8, zoom: 12

});

const pixel = viewport.project([-122.4, 37.8]);

const position = viewport.unproject(pixel);
```

Screen coordinates start at the top left: X increases rightward and Y downward. `topLeft: false` reverses the Y convention. An optional third projected component is normalized depth, not geographic altitude.

Unprojecting a two-component pixel position intersects a target altitude or the default ground plane. Supply depth to reconstruct a full projected position. See [WebMercatorViewport](https://visgl.github.io/math.gl/next/docs/modules/web-mercator/api-reference/web-mercator-viewport.md) for options.

## Offsets[​](#offsets "Direct link to Offsets")

`getDistanceScales()` provides local conversion factors around a geographic origin. This is useful for rendering nearby geometry from small offsets, rather than subtracting large world coordinates on the GPU.

* `unitsPerMeter` converts metre offsets to world offsets.
* `unitsPerDegree` converts longitude/latitude degree offsets (and altitude in metres) to world offsets.
* With `highPrecision: true`, `unitsPerMeter2` and `unitsPerDegree2` add a correction for northward offset.

The first-order conversion is componentwise multiplication:

```
vec3 worldOffset = offset * unitsPerMeter;
```

For metre offsets, apply the correction using the northward offset in metres:

```
vec3 worldOffset = meters * (unitsPerMeter + unitsPerMeter2 * meters.y);
```

For longitude/latitude offsets, use the latitude offset in degrees:

```
vec3 worldOffset = lngLatZ * (unitsPerDegree + unitsPerDegree2 * lngLatZ.y);
```

These factors produce world-coordinate offsets; the camera then maps them to pixels. Scale changes with latitude, so one origin's factors are not global constants. Use [coordinate utilities](https://visgl.github.io/math.gl/next/docs/modules/web-mercator/api-reference/web-mercator-utils.md) for the function contracts.

## Accuracy[​](#accuracy "Direct link to Accuracy")

The following measurements compare first-order (unadjusted) and corrected (adjusted) offsets at zoom 12. They illustrate latitude and range effects, rather than provide universal error bounds. Recompute scales around a nearby origin when processing distant geometry.

### Metres[​](#metres "Direct link to Metres")

X-coordinate error for metre offsets at 37°N:

| R            | X unadjusted                 | X adjusted                   |
| ------------ | ---------------------------- | ---------------------------- |
| 100 meters   | off by -0.000 pixels, 0.001% | off by 0.000 pixels, 0.001%  |
| 1000 meters  | off by -0.008 pixels, 0.012% | off by 0.000 pixels, 0.001%  |
| 5000 meters  | off by -0.200 pixels, 0.060% | off by 0.002 pixels, 0.001%  |
| 10000 meters | off by -0.804 pixels, 0.121% | off by 0.003 pixels, 0.000%  |
| 30000 meters | off by -7.277 pixels, 0.366% | off by -0.021 pixels, 0.001% |

At 75°N:

| R            | X unadjusted                   | X adjusted                   |
| ------------ | ------------------------------ | ---------------------------- |
| 100 meters   | off by -0.001 pixels, 0.006%   | off by 0.000 pixels, 0.001%  |
| 1000 meters  | off by -0.130 pixels, 0.061%   | off by 0.001 pixels, 0.001%  |
| 5000 meters  | off by -3.290 pixels, 0.309%   | off by -0.001 pixels, 0.000% |
| 10000 meters | off by -13.200 pixels, 0.620%  | off by -0.044 pixels, 0.002% |
| 30000 meters | off by -119.884 pixels, 1.877% | off by -1.473 pixels, 0.023% |

### Degrees[​](#degrees "Direct link to Degrees")

Y-coordinate error for longitude/latitude offsets at 37°N:

| R             | Y unadjusted                 | Y adjusted                   |
| ------------- | ---------------------------- | ---------------------------- |
| 0.001 degrees | off by -0.000 pixels, 0.001% | off by -0.000 pixels, 0.000% |
| 0.01 degrees  | off by -0.005 pixels, 0.007% | off by -0.000 pixels, 0.000% |
| 0.05 degrees  | off by -0.125 pixels, 0.034% | off by -0.000 pixels, 0.000% |
| 0.1 degrees   | off by -0.499 pixels, 0.068% | off by -0.001 pixels, 0.000% |
| 0.3 degrees   | off by -4.508 pixels, 0.204% | off by -0.022 pixels, 0.001% |

At 75°N:

| R             | Y unadjusted                  | Y adjusted                   |
| ------------- | ----------------------------- | ---------------------------- |
| 0.001 degrees | off by -0.001 pixels, 0.003%  | off by -0.000 pixels, 0.000% |
| 0.01 degrees  | off by -0.081 pixels, 0.034%  | off by -0.000 pixels, 0.000% |
| 0.05 degrees  | off by -2.038 pixels, 0.172%  | off by -0.005 pixels, 0.000% |
| 0.1 degrees   | off by -8.172 pixels, 0.345%  | off by -0.039 pixels, 0.002% |
| 0.3 degrees   | off by -74.258 pixels, 1.046% | off by -1.055 pixels, 0.015% |
