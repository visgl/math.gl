# Overview

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

`@math.gl/geospatial` provides ellipsoid geometry, geographic/Cartesian conversions, local tangent frames, globe queries, and tile-grid geometry. Use it for WGS84 positions and 3D Tiles bounds without a renderer dependency.

Geographic arrays use `[longitude, latitude, height]`, with angles in degrees and ellipsoidal height in metres by default. Cartesian arrays use Earth-centered coordinates in metres. Geoid heights and general CRS conversion are handled by [geoid](https://visgl.github.io/math.gl/next/docs/modules/geoid.md) and [projection](https://visgl.github.io/math.gl/next/docs/modules/projection.md).

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/geospatial
```

![WGS84: The 1984 World Geodetic System Ellipsoid](data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSItNDEwIC00MTAgODIwIDgyMCI+DQogPHRpdGxlPldHUzg0IG1lYW4gRWFydGggcmFkaXVzPC90aXRsZT4NCiA8ZGVzYz5FcXVhdG9yaWFsICgnJ2EnJyksIHBvbGFyICgnJ2InJykgYW5kIG1lYW4gRWFydGggcmFkaWkgYXMgZGVmaW5lZCBpbiB0aGUgMTk4NCBXb3JsZCBHZW9kZXRpYyBTeXN0ZW0gcmV2aXNpb24sIGlsbHVzdHJhdGVkIGJ5IENNRyBMZWUuPC9kZXNjPg0KIDxkZWZzPg0KICA8cmFkaWFsR3JhZGllbnQgaWQ9ImdyYWRpZW50X3NoYWRlIiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiIGZ4PSIzMCUiIGZ5PSIyMCUiPg0KICAgPHN0b3Agb2Zmc2V0PSIxMCUiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz4NCiAgIDxzdG9wIG9mZnNldD0iOTklIiBzdG9wLWNvbG9yPSIjY2NlZWZmIi8+DQogIDwvcmFkaWFsR3JhZGllbnQ+DQogIDxwYXRoIGlkPSJhcnJvd2hlYWQiIGQ9Ik0gLTUsMjAgTCAwLDAgTCA1LDIwIiBzdHJva2UtZGFzaGFycmF5PSIxLDAiLz4NCiA8L2RlZnM+DQogPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9Ijk5OTk5IiBmaWxsPSIjZmZmZmZmIi8+DQogPGcgZm9udC1mYW1pbHk9IkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIg0KICAgIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2U9Im5vbmUiIGZpbGw9Im5vbmUiPg0KICA8Zz4NCiAgIDxnIHN0cm9rZT0iIzAwMDBmZiI+DQogICAgPGVsbGlwc2UgY3g9IjAiIGN5PSIwIiByeD0iNDAwIiByeT0iMzAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50X3NoYWRlKSIvPg0KICAgIDxwYXRoIHRyYW5zZm9ybT0ic2NhbGUoOSw3KSIgc3Ryb2tlPSJub25lIiBmaWxsPSIjNjY5OTAwIiBvcGFjaXR5PSIwLjI1Ig0KICAgICAgICAgIGQ9Ik0gMTAsLTUgQSAyMCwyMCAwIDAgMSAyMCwtMzUgQSAzMCwyMCAwIDAgMCAtMjAsLTM1IEEgMzAsMzAgMCAwIDAgMTAsLTUNCiAgICAgICAgICAgICBBIDMwLDMwIDAgMCAxIDAsNDAgQSAyNSwyMSAwIDAgMCAxMiwtNiIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwtMzAwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQwMCwgICAwKSByb3RhdGUoLTkwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwgICAwKSByb3RhdGUoIDkwKSIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoICAgMCwgICAwKSByb3RhdGUoMTgwKSIvPg0KICAgIDxwYXRoIGQ9Ik0gLTQwMCwwIEggMCBWIC0zMDAiLz4NCiAgIDwvZz4NCiAgIDxnIGZpbGw9IiMwMDAwZmYiPg0KICAgIDx0ZXh0IHg9Ii0xODAiIHk9IjQwIiBkeT0iMC42ZXgiDQogICAgID48dHNwYW4gZm9udC1zdHlsZT0iaXRhbGljIj5hPC90c3Bhbj48dHNwYW4+JiMxNjA7PSA2Mzc4LjEzNzAga208L3RzcGFuPjwvdGV4dD4NCiAgICA8dGV4dCB4PSIxMCIgeT0iLTEyMCIgZHk9IjAuNmV4IiB0ZXh0LWFuY2hvcj0ic3RhcnQiDQogICAgID48dHNwYW4gZm9udC1zdHlsZT0iaXRhbGljIj5iPC90c3Bhbj48dHNwYW4+JiMxNjA7JiM4Nzc2OyA2MzU2Ljc1MjMga208L3RzcGFuPjwvdGV4dD4NCiAgIDwvZz4NCiAgPC9nPg0KICA8Zz4NCiAgIDxnIHN0cm9rZT0iI2NjMDAwMCIgc3Ryb2tlLWRhc2hhcnJheT0iMjYsOCI+DQogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjM2NyIvPg0KICAgIDxwYXRoIGQ9Ik0gMjEwLDMwMCBMIDAsMCIvPg0KICAgIDx1c2UgeGxpbms6aHJlZj0iI2Fycm93aGVhZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjEwLDMwMCkgcm90YXRlKDE0NSkiLz4NCiAgIDwvZz4NCiAgIDxnIGZpbGw9IiNjYzAwMDAiPg0KICAgIDx0ZXh0IHg9IjAiIHk9IjEyMCIgZHk9IjAuNmV4Ig0KICAgICA+PHRzcGFuPjI8L3RzcGFuPjx0c3BhbiBmb250LXN0eWxlPSJpdGFsaWMiPmE8L3RzcGFuDQogICAgID48dHNwYW4+JiMxNjA7KyYjMTYwOzwvdHNwYW4+PHRzcGFuIGZvbnQtc3R5bGU9Iml0YWxpYyI+YjwvdHNwYW4NCiAgICAgPjx0c3BhbiB4PSIwIj5fX19fXzwvdHNwYW4+PHRzcGFuIHg9IjAiIGR5PSIxZW0iPiYjMTYwOyAzPC90c3Bhbg0KICAgICA+PHRzcGFuIHg9IjAiIGR5PSIxLjVlbSI+JiM4Nzc2OyA2MzcxLjAwODgga208L3RzcGFuPjwvdGV4dD4NCiAgIDwvZz4NCiAgPC9nPg0KIDwvZz4NCjwvc3ZnPg0K)

WGS84: The 1984 World Geodetic System Ellipsoid.

<br />

Attribution: From [wikipedia](https://en.wikipedia.org/wiki/World_Geodetic_System#/media/File:WGS84_mean_Earth_radius.svg), Creative Commons 4.0.

## Classes[​](#classes "Direct link to Classes")

| Class                   | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `Ellipsoid`             | Implements ellipsoid math and cartographic/Cartesian conversions.           |
| `Ellipsoid.WGS84`       | An `Ellipsoid` instance initialized with Earth radii per WGS84.             |
| `EllipsoidTangentPlane` | Projects WGS84 Cartesian positions into a local east-north plane.           |
| `LngLatRectangle`       | Represents a longitude-latitude rectangle, including antimeridian crossing. |

## Geographic tile queries[​](#geographic-tile-queries "Direct link to Geographic tile queries")

<!-- -->

Loading <!-- -->Geographic tile explorer<!-- -->…

⛶⛶ Explore fullscreen

[Geographic tile helpers](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/geographic-tiles.md) address degree coordinates and cover geographic regions with compact tile ranges, including antimeridian crossings. Expand the infobox to explore query regions and levels.

## Functions[​](#functions "Direct link to Functions")

| Function            | Description                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `makeOBBFromRegion` | Creates a conservative oriented bounding box for a longitude–latitude–height region, including antimeridian and polar regions. |

## Usage[​](#usage "Direct link to Usage")

Determine the Cartesian representation of a Cartographic position on a WGS84 ellipsoid.

```
import {Ellipsoid} from '@math.gl/geospatial';

const cartographicPosition = [21, 78, 5000]; // [longitude, latitude, height]

const cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(cartographicPosition);
```

Determine the Cartographic representation of a Cartesian position on a WGS84 ellipsoid.

```
import {Ellipsoid} from '@math.gl/geospatial';

const cartesianPosition = [17832.12, 83234.52, 952313.73];

const cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
```

Get the transform from a local east-north-up frame at a point on the WGS84 ellipsoid to Earth's fixed frame.

```
import {Ellipsoid} from '@math.gl/geospatial';

const cartesianOrigin = Ellipsoid.WGS84.cartographicToCartesian([21, 78, 0]);

const transformMatrix = Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin);
```

## Framework Independence[​](#framework-independence "Direct link to Framework Independence")

Input coordinates can be numeric arrays; callers do not need to construct core vectors.

* Coordinate inputs and outputs use three-component numeric arrays. Check each method's result parameter before supplying reusable storage.

## History[​](#history "Direct link to History")

This library was initially created as part of a bigger collaboration between the vis.gl and Cesium teams to provide framework-independent, portable support for the 3D Tiles specification, however it has been designed to provide generic support for WGS84 and ellipsoidal math.

## Attribution[​](#attribution "Direct link to Attribution")

Selected classes and three-radius ellipsoid kernels derive from Cesium under Apache-2.0. Shared spheroid conversion kernels also retain proj4js MIT provenance. Source headers and distributed notices identify the applicable credits and terms.

## Globe queries[​](#globe-queries "Direct link to Globe queries")

[EllipsoidOccluder and globe horizon bounds](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/globe-queries.md) provide true ray intersections, elevated-point occlusion, exact limb ellipses and wrapped conservative imagery coverage without a viewport or rendering dependency.

## Tile matrices[​](#tile-matrices "Direct link to Tile matrices")

[Tile matrix types and utilities](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/tile-matrix.md) describe supplied rectangular grids in any coordinate system. Import from `@math.gl/geospatial/tile-matrix` for a lightweight entry point with no runtime dependencies. Helpers provide bounds, coordinate lookup, compact extent-to-tile ranges, coverage checks and resolution-based level selection.

Use the geographic tile helpers above for the built-in equal-angle longitude/latitude quadtree and antimeridian-aware queries. Explicit matrix queries use half-open edges and never wrap.
