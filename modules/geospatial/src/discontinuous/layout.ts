// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {
  DiscontinuousMap,
  MapBounds,
  MapPlacement,
  MapRegionLayout,
  MapSamplingOptions,
  GeographicPosition
} from './map-layout';

type XY = [number, number];
export type MapLayoutRegion = Readonly<{
  id: string;
  label: string;
  kind: NonNullable<MapRegionLayout['kind']>;
  parentId?: string;
  relativeScale?: number;
  drawOrder: number;
  placement: MapPlacement;
  bounds: MapBounds;
  frame?: MapBounds;
  /** Sampled geographic coverage boundary in placed map units. */
  outlines: readonly (readonly GeographicPosition[])[];
}>;
export type MapLayout = Readonly<{
  bounds: MapBounds;
  /** Back-to-front, stable for equal drawOrder. */
  regions: readonly MapLayoutRegion[];
}>;
export type MapViewportOptions = {
  width: number;
  height: number;
  /** Pixels, uniformly or per side. No independent inset rescaling. */
  padding?: number | {left?: number; right?: number; top?: number; bottom?: number};
  /** Default true: screen origin at top left, Y down. False: bottom left, Y up. */
  flipY?: boolean;
};
const boundsOf = (points: readonly GeographicPosition[]): MapBounds => {
  let left = Infinity,
    bottom = Infinity,
    right = -Infinity,
    top = -Infinity;
  for (const [x, y] of points) {
    left = Math.min(left, x);
    right = Math.max(right, x);
    bottom = Math.min(bottom, y);
    top = Math.max(top, y);
  }
  return Object.freeze([left, bottom, right, top]) as MapBounds;
};
const corners = ([left, bottom, right, top]: MapBounds): XY[] => [
  [left, bottom],
  [right, top]
];

/** Sample actual projected edges, not just region corners. Bounds are approximate
 * to the supplied angular/chord sampling criteria; callbacks must remain stable.
 */
export function getMapLayout(map: DiscontinuousMap, options: MapSamplingOptions = {}): MapLayout {
  const regions = map.regions
    .map((region): MapLayoutRegion => {
      const boundary = [...region.boundary, region.boundary[0]];
      const outlines = map
        .projectLine(boundary, options)
        .filter(p => p.regionId === region.id)
        .map(p =>
          Object.freeze(p.coordinates.map(point => Object.freeze([...point]) as GeographicPosition))
        );
      const points: GeographicPosition[] = outlines.flat();
      const interior = map.projectPoint(region.interior, region.id);
      if (interior) points.push(interior.position);
      if (!points.length) throw new Error(`Cannot measure region ${region.id}`);
      return Object.freeze({
        id: region.id,
        label: region.layout?.label ?? region.id,
        kind: region.layout?.kind ?? 'panel',
        parentId: region.layout?.parentId,
        relativeScale: region.layout?.relativeScale,
        drawOrder: region.layout?.drawOrder ?? 0,
        placement: region.placement!,
        bounds: boundsOf(points),
        frame: region.layout?.frame,
        outlines: Object.freeze(outlines)
      });
    })
    .sort((a, b) => a.drawOrder - b.drawOrder);
  return Object.freeze({
    bounds: boundsOf(
      regions.flatMap(r => [...corners(r.bounds), ...(r.frame ? corners(r.frame) : [])])
    ),
    regions: Object.freeze(regions)
  });
}

/** Uniformly fit canonical placement to a viewport. Preserves inset spacing and
 * scale ratios. Use project/unproject for screen picking and renderer conversion.
 */
export function fitMapLayout(layout: MapLayout, options: MapViewportOptions) {
  const {width, height, padding = 0, flipY = true} = options;
  const pad =
    typeof padding === 'number'
      ? {left: padding, right: padding, top: padding, bottom: padding}
      : padding;
  const {left = 0, right = 0, top = 0, bottom = 0} = pad;
  if (
    ![width, height].every(v => Number.isFinite(v) && v > 0) ||
    ![left, right, top, bottom].every(v => Number.isFinite(v) && v >= 0) ||
    left + right >= width ||
    top + bottom >= height
  )
    throw new Error('Invalid viewport or padding');
  const [minX, minY, maxX, maxY] = layout.bounds;
  const spanX = maxX - minX,
    spanY = maxY - minY;
  if (
    !layout.bounds.every(Number.isFinite) ||
    !Number.isFinite(spanX) ||
    !Number.isFinite(spanY) ||
    spanX <= 0 ||
    spanY <= 0
  )
    throw new Error('Layout bounds must have finite positive extents');
  const scale = Math.min((width - left - right) / spanX, (height - top - bottom) / spanY);
  const sx = scale,
    sy = flipY ? -scale : scale;
  const centerX = minX + spanX / 2,
    centerY = minY + spanY / 2;
  const targetX = left + (width - left - right) / 2;
  const targetY = (flipY ? top : bottom) + (height - top - bottom) / 2;
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('Viewport scale is not representable');
  const project = ([x, y]: GeographicPosition): XY => [
    (x - centerX) * sx + targetX,
    (y - centerY) * sy + targetY
  ];
  const unproject = ([x, y]: GeographicPosition): XY => [
    (x - targetX) / sx + centerX,
    (y - targetY) / sy + centerY
  ];
  const transformBounds = (b: MapBounds) => boundsOf(corners(b).map(project));
  return Object.freeze({
    width,
    height,
    scale,
    flipY,
    project,
    unproject,
    bounds: transformBounds(layout.bounds),
    regions: Object.freeze(
      layout.regions.map((r, index) =>
        Object.freeze({
          ...r,
          layer: index,
          bounds: transformBounds(r.bounds),
          frame: r.frame ? transformBounds(r.frame) : undefined,
          outlines: Object.freeze(
            r.outlines.map(line => Object.freeze(line.map(p => Object.freeze(project(p)))))
          )
        })
      )
    )
  });
}
