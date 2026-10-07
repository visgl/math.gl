// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export const REGIONAL_VIEWS = {
  albersNorthAmerica: {
    title: "Albers · North America",
    bounds: [-170, 25, -45, 85],
    definition: "+proj=aea +lon_0=-100 +lat_0=50 +lat_1=45 +lat_2=65",
  },
  albersEurope: {
    title: "Albers · Europe",
    bounds: [-25, 35, 65, 85],
    definition: "+proj=aea +lon_0=20 +lat_0=55 +lat_1=45 +lat_2=65",
  },
};
export function regionalCoordinate(view, lon, lat) {
  return [lon, view === "merc" ? Math.max(-85, Math.min(85, lat)) : lat];
}
export function inRegion(view, lon, lat) {
  const region = REGIONAL_VIEWS[view];
  if (!region) return true;
  const [west, south, east, north] = region.bounds;
  return lon >= west && lon <= east && lat >= south && lat <= north;
}
