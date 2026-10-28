// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Experimental, view-centered spherical globe to Web Mercator projection. */
const RADIUS = 6378137;
const RAD = Math.PI / 180;
const MAX_LATITUDE = 85.0511287798066;

export function getGlobeToMercatorTransition(
  zoom: number,
  { startZoom, endZoom }: { startZoom: number; endZoom: number },
): number {
  if (
    ![zoom, startZoom, endZoom].every(Number.isFinite) ||
    startZoom >= endZoom
  ) {
    throw new RangeError("Expected finite zooms with startZoom < endZoom");
  }
  const t = Math.max(
    0,
    Math.min(1, (zoom - startZoom) / (endZoom - startZoom)),
  );
  return t * t * (3 - 2 * t);
}

export type GlobeMercatorProjectionOptions = {
  longitude: number;
  latitude: number;
  progress: number;
};

/** Positions are in meters in a center-relative east, north, up frame. */
export class GlobeMercatorProjection {
  readonly longitude: number;
  readonly latitude: number;
  readonly progress: number;

  constructor({
    longitude,
    latitude,
    progress,
  }: GlobeMercatorProjectionOptions) {
    if (
      ![longitude, latitude, progress].every(Number.isFinite) ||
      Math.abs(latitude) > 90 ||
      progress < 0 ||
      progress > 1 ||
      (progress > 0 && Math.abs(latitude) > MAX_LATITUDE)
    ) {
      throw new RangeError("Invalid globe Mercator projection parameters");
    }
    this.longitude = longitude;
    this.latitude = latitude;
    this.progress = progress;
    Object.freeze(this);
  }

  project(position: readonly number[], out: number[] = []): number[] {
    const [longitude, latitude, height = 0] = position;
    if (
      ![longitude, latitude, height].every(Number.isFinite) ||
      Math.abs(latitude) > 90 ||
      (this.progress > 0 && Math.abs(latitude) > MAX_LATITUDE)
    ) {
      throw new RangeError("Position outside projection domain");
    }
    const delta =
      (((((longitude - this.longitude) % 360) + 540) % 360) - 180) * RAD;
    const phi = latitude * RAD;
    const center = this.latitude * RAD;
    const cos = Math.cos(phi),
      sin = Math.sin(phi);
    const radius = RADIUS + height;
    const east = radius * cos * Math.sin(delta);
    const north =
      radius *
      (sin * Math.cos(center) - cos * Math.cos(delta) * Math.sin(center));
    const up =
      radius *
        (sin * Math.sin(center) + cos * Math.cos(delta) * Math.cos(center)) -
      RADIUS;
    if (this.progress === 0) {
      out[0] = east;
      out[1] = north;
      out[2] = up;
      return out;
    }
    const scale = Math.cos(center);
    const mercator = (p: number) => Math.log(Math.tan(Math.PI / 4 + p / 2));
    const t = this.progress;
    out[0] = east * (1 - t) + RADIUS * scale * delta * t;
    out[1] =
      north * (1 - t) + RADIUS * scale * (mercator(phi) - mercator(center)) * t;
    out[2] = up * (1 - t) + height * t;
    return out;
  }

  getShaderParameters(): GlobeMercatorProjectionOptions {
    return {
      longitude: this.longitude,
      latitude: this.latitude,
      progress: this.progress,
    };
  }
}
