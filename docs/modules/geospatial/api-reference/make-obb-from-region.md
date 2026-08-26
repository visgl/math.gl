# makeOBBFromRegion

Builds a conservative [`OrientedBoundingBox`](../../culling/api-reference/oriented-bounding-box) for a longitude–latitude–height region on an ellipsoid. This is useful for 3D Tiles regions, globe rendering, spatial indexing, and frustum culling.

The returned box is expressed in ellipsoid-fixed Cartesian coordinates. Its orientation is an implementation detail and may change between releases.

## Usage

```js
import {toRadians} from '@math.gl/core';
import {makeOBBFromRegion} from '@math.gl/geospatial';

const region = [
  toRadians(-30), // west
  toRadians(35),  // south
  toRadians(20),  // east
  toRadians(55),  // north
  0,              // minimumHeight
  1000            // maximumHeight
];

const box = makeOBBFromRegion(region);
```

## Function

### `makeOBBFromRegion(region, ellipsoid?, options?) : OrientedBoundingBox`

`region` is `[west, south, east, north, minimumHeight, maximumHeight]`. Longitudes and latitudes are in radians by default, matching the OGC 3D Tiles region definition. Heights use the ellipsoid's linear unit, normally meters. Use `options.units: 'degrees'` for degree input.

Latitudes must be in `[-π/2, π/2]` (or `[-90, 90]` in degree mode), `south` must not exceed `north`, and minimum height must not exceed maximum height.

### Longitude wrapping

Longitude values are normalized internally, so values outside the conventional range are accepted. If `east < west`, the region crosses the antimeridian and uses the shorter wrapped interval:

```js
const datelineRegion = [170, -10, -170, 10, 0, 250];
const box = makeOBBFromRegion(datelineRegion, undefined, {units: 'degrees'});
```

This describes a 20° region centered on ±180°, not a 340° region centered on 0°. Equal west and east longitudes describe zero width, not a full globe.

### Ellipsoid

The optional ellipsoid defaults to `Ellipsoid.WGS84`:

```js
import {Ellipsoid, makeOBBFromRegion} from '@math.gl/geospatial';

const moon = new Ellipsoid(1737400, 1737400, 1737400);
const box = makeOBBFromRegion(region, moon);
```

### Options

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `units` | `'radians' \| 'degrees'` | `'radians'` | Units for longitude and latitude. Heights are never converted. |
| `transform` | `Matrix4` | — | Affine transform from ellipsoid-fixed coordinates into world coordinates. |

The transform is applied exactly once and may include translation, rotation, non-uniform scale, or shear. Translation affects the center; the linear part affects the half-axes. Inputs and caller-owned values are never mutated.

## Errors and edge cases

The function throws for malformed regions, non-finite values, reversed heights, or invalid latitudes. A tiny tolerance is allowed at the latitude boundaries and values are clamped to the exact pole before conversion.

Zero-width longitude, zero-height latitude, zero-height altitude, and point-like regions are valid. Regions touching either pole are valid and produce finite results even though longitude lines converge there. The box encloses the curved region conservatively; it is not an exact minimum-volume box.
