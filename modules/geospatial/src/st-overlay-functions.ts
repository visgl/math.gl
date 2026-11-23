// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {lineIntersectionResult} from './spatial-line-intersection-result';
import {intersectLinePolygon} from './spatial-line-polygon-intersection';
import type {AggregateFunction, ScalarFunction} from '@math.gl/sql/arrow';
import polygonClipping from 'polygon-clipping';
import {polygonSet} from './spatial-polygon-overlay';
import {
  EXTENSION_METADATA,
  EXTENSION_NAME,
  lineKinds,
  nativeGeometryResult,
  planarGeometry,
  pointCoordinates,
  pointKinds,
  polygonKinds,
  readGeometryValue,
  spatialFunction
} from './spatial-sql';

/** Eight unit directions per quadrant with exact cardinal axes. */
const unitCircle = /* @__PURE__ */ Array.from({length: 32}, (_, index) => {
  const angle = ((index % 8) * Math.PI) / 16;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  switch (index >>> 3) {
    case 0:
      return [x, y];
    case 1:
      return [-y, x];
    case 2:
      return [-x, -y];
    default:
      return [y, -x];
  }
});

/** Bounds the number of pieces passed to one polygon union. */
const polygonUnionFanout = 64;

/** Checks the radius for point and line buffers. */
function checkBufferRadius(radius: number): void {
  if (!Number.isFinite(radius)) throw new Error('ST_Buffer requires a finite radius');
}

/** Checks a generated ring before passing it to the polygon kernel. */
function checkedRing(ring: polygonClipping.Ring): polygonClipping.Ring {
  if (ring.some(point => !point.every(Number.isFinite))) {
    throw new Error('ST_Buffer produced a nonfinite coordinate');
  }
  return ring;
}

/** Returns a circle approximation with eight segments per quadrant. */
function circleRing(x: number, y: number, radius: number): polygonClipping.Ring {
  const ring: polygonClipping.Ring = unitCircle.map(([dx, dy]) => [
    x + radius * dx!,
    y + radius * dy!
  ]);
  ring.push(ring[0]!);
  return checkedRing(ring);
}

/** Buffers a point without changing its established output schema. */
function bufferPoint(point: WellKnownGeometry, radius: number): WellKnownGeometry {
  checkBufferRadius(radius);
  const location = pointCoordinates(point);
  if (!location || radius <= 0) return {type: 'Polygon', coordinates: []};
  return {type: 'Polygon', coordinates: [circleRing(location[0]!, location[1]!, radius)]};
}

/** Unions a bounded group of pieces at a time, then combines groups at each level. */
function unionPolygonPieces(pieces: polygonClipping.MultiPolygon[]): polygonClipping.MultiPolygon {
  if (!pieces.length) return [];
  while (pieces.length > 1) {
    const groups: polygonClipping.MultiPolygon[] = [];
    for (let first = 0; first < pieces.length; first += polygonUnionFanout) {
      groups.push(
        polygonClipping.union(
          pieces[first]!,
          ...pieces.slice(first + 1, first + polygonUnionFanout)
        )
      );
    }
    pieces = groups;
  }
  return pieces[0]!;
}

/** Buffers line segments with rectangles and adds disks for round joins and caps. */
function bufferLine(geometry: WellKnownGeometry, radius: number): WellKnownGeometry {
  checkBufferRadius(radius);
  if (radius <= 0) return {type: 'MultiPolygon', coordinates: []};
  const lines =
    geometry.type === 'MultiLineString'
      ? geometry.coordinates
      : geometry.type === 'LineString'
        ? [geometry.coordinates]
        : [];
  const pieces: polygonClipping.MultiPolygon[] = [];
  for (const line of lines) {
    let previous: readonly number[] | undefined;
    for (const coordinate of line) {
      const [x, y] = coordinate as polygonClipping.Pair;
      if (previous && x === previous[0] && y === previous[1]) continue;
      pieces.push([[circleRing(x, y, radius)]]);
      if (previous) {
        const x0 = previous[0]!;
        const y0 = previous[1]!;
        const dx = x - x0;
        const dy = y - y0;
        const length = Math.hypot(dx, dy);
        if (!Number.isFinite(length))
          throw new Error('ST_Buffer produced a nonfinite segment length');
        const nx = (-dy / length) * radius;
        const ny = (dx / length) * radius;
        pieces.push([
          [
            checkedRing([
              [x0 + nx, y0 + ny],
              [x + nx, y + ny],
              [x - nx, y - ny],
              [x0 - nx, y0 - ny],
              [x0 + nx, y0 + ny]
            ])
          ]
        ]);
      }
      previous = coordinate;
    }
  }
  return {type: 'MultiPolygon', coordinates: unionPolygonPieces(pieces)};
}

/** Implements the existing planar point overload. */
const pointBuffer = /* @__PURE__ */ spatialFunction(
  'ST_Buffer',
  [pointKinds],
  /* @__PURE__ */ nativeGeometryResult('geoarrow.polygon'),
  ([geometry], radius) => bufferPoint(geometry!, radius!),
  1
);

/** Implements native planar line and multiline buffers with multipart output. */
const lineBuffer = /* @__PURE__ */ spatialFunction(
  'ST_Buffer',
  [lineKinds],
  /* @__PURE__ */ nativeGeometryResult('geoarrow.multipolygon'),
  ([geometry], radius) => bufferLine(geometry!, radius!),
  1
);

/** Buffers planar points and native lines with round caps and joins. */
export const ST_BUFFER: ScalarFunction = {
  ...pointBuffer,
  /** Selects the result schema from the input column's GeoArrow encoding. */
  resolvePrototype(fields) {
    const encoding = fields[0]?.metadata.get(EXTENSION_NAME);
    const buffer =
      encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multilinestring'
        ? lineBuffer
        : pointBuffer;
    return buffer.resolvePrototype!(fields);
  }
};

/** Creates a row-preserving areal overlay with the first geometry's metadata. */
function polygonOverlay(name: string, operation: typeof polygonClipping.intersection) {
  const spatial = spatialFunction(
    name,
    [polygonKinds, polygonKinds],
    nativeGeometryResult('geoarrow.multipolygon'),
    ([left, right]): WellKnownGeometry => {
      const a = polygonSet(left!);
      const b = polygonSet(right!);
      return {type: 'MultiPolygon', coordinates: operation(a, b)};
    }
  );
  return withFirstInputMetadata(spatial);
}

/** Keeps overlay metadata tied to the first argument in either operand order. */
function withFirstInputMetadata(spatial: ScalarFunction): ScalarFunction {
  return {
    ...spatial,
    /** Preserves the first input's metadata. Overlay does not assign a missing CRS. */
    resolvePrototype(fields: Parameters<NonNullable<typeof spatial.resolvePrototype>>[0]) {
      const result = spatial.resolvePrototype!(fields);
      if (!fields[0]?.metadata.has(EXTENSION_METADATA)) {
        result?.result.metadata.delete(EXTENSION_METADATA);
      }
      return result;
    }
  };
}

/** Binds polygon overlays or mixed-dimensional line clipping from the Arrow schema. */
function intersection(): ScalarFunction {
  const polygons = polygonOverlay('ST_Intersection', polygonClipping.intersection);
  const output = lineIntersectionResult();
  const linearFirst = spatialFunction(
    'ST_Intersection',
    [lineKinds, polygonKinds],
    output,
    ([line, area]) => intersectLinePolygon(line!, area!)
  );
  const linearSecond = spatialFunction(
    'ST_Intersection',
    [polygonKinds, lineKinds],
    output,
    ([area, line]) => intersectLinePolygon(line!, area!)
  );
  return withFirstInputMetadata({
    ...polygons,
    /** A specialized line argument selects a mixed native GeoArrow result before evaluation. */
    resolvePrototype(fields) {
      const a = fields[0]?.metadata.get(EXTENSION_NAME);
      const b = fields[1]?.metadata.get(EXTENSION_NAME);
      if (a === 'geoarrow.linestring' || a === 'geoarrow.multilinestring')
        return linearFirst.resolvePrototype!(fields);
      if (b === 'geoarrow.linestring' || b === 'geoarrow.multilinestring')
        return linearSecond.resolvePrototype!(fields);
      return polygons.resolvePrototype!(fields);
    }
  });
}

/** Intersects two areal geometries or clips a native line by a polygon. */
export const ST_INTERSECTION = /* @__PURE__ */ intersection();
/** Returns the portion of the first polygonal geometry outside the second. */
export const ST_DIFFERENCE = /* @__PURE__ */ polygonOverlay(
  'ST_Difference',
  polygonClipping.difference
);

/** Returns the combined polygon area as a native GeoArrow MultiPolygon. */
export const ST_UNION = /* @__PURE__ */ polygonOverlay('ST_Union', polygonClipping.union);

/** Returns the area covered by exactly one input as a native GeoArrow MultiPolygon. */
export const ST_SYMDIFFERENCE = /* @__PURE__ */ polygonOverlay(
  'ST_SymDifference',
  polygonClipping.xor
);

/** Dissolves the components of a polygonal geometry into native GeoArrow storage. */
export const ST_UNARYUNION = /* @__PURE__ */ spatialFunction(
  'ST_UnaryUnion',
  [polygonKinds],
  /* @__PURE__ */ nativeGeometryResult('geoarrow.multipolygon'),
  ([geometry]): WellKnownGeometry => ({
    type: 'MultiPolygon',
    coordinates: polygonClipping.union(polygonSet(geometry!))
  })
);

/** Dissolves polygonal rows per group, ignoring nulls and retaining the input CRS. */
export const ST_UNION_AGGREGATE: AggregateFunction = {
  kind: 'aggregate',
  name: 'ST_Union',
  argumentCount: 1,
  /** Binds one polygonal input and declares the native multipolygon output. */
  bind({arguments: fields}) {
    const prototype = ST_UNARYUNION.resolvePrototype!(fields);
    if (!prototype) throw new Error('Aggregate ST_Union requires one polygonal geometry column');
    const field = prototype.arguments[0]!;
    return {
      outputField: prototype.result.clone({name: 'ST_Union'}),
      /** Keeps bounded groups of partial unions at increasing input sizes. */
      createAccumulator() {
        const levels: polygonClipping.MultiPolygon[][] = [];
        let seen = false;

        /** Compacts a full level before accumulating further inputs. */
        function add(polygon: polygonClipping.MultiPolygon) {
          for (let level = 0; ; level++) {
            levels[level] ??= [];
            const pieces = levels[level]!;
            pieces.push(polygon);
            if (pieces.length < polygonUnionFanout) return;
            polygon = unionPolygonPieces(pieces);
            pieces.length = 0;
          }
        }

        return {
          /** Reduces the non-null polygonal rows of one input batch. */
          update([vector], {length, signal}) {
            const active = Uint8Array.from({length}, (_, row) => Number(vector!.isValid(row)));
            const read = readGeometryValue(vector!, field, active, planarGeometry);
            for (let row = 0; row < length; row++) {
              if ((row & 255) === 0) signal?.throwIfAborted();
              if (!active[row]) continue;
              seen = true;
              const pieces = polygonSet(read(row));
              if (pieces.length) add(pieces);
            }
          },
          /** Combines partial unions and distinguishes all-empty from all-null groups. */
          finalize() {
            if (!seen) return null;
            const pieces = levels.flat();
            return pieces.length === 1
              ? polygonClipping.union(pieces[0]!)
              : unionPolygonPieces(pieces);
          }
        };
      }
    };
  }
};
