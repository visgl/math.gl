// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {createInterruptedSinusoidalMap, getMapLayout} from '@math.gl/geospatial/discontinuous';
import {grid, rectangle} from './prepare.mjs';
const engine = new FullProjectionEngine();
const worldDomain = {polygons: [{outer: rectangle(-180, -90, 180, 90)}], periodic: {axis: 0, minimum: -180, period: 360}};
function disk(radius) {
  const ring = Array.from({length: 65}, (_, i) => [radius * Math.cos((i % 64) * Math.PI / 32), radius * Math.sin((i % 64) * Math.PI / 32)]);
  return {polygons: [{outer: ring}]};
}
export function fixtures() {
  const polar = engine.createProjection({
    from: '+proj=stere +lat_0=90 +lat_ts=70 +datum=WGS84 +units=m',
    to: '+proj=ortho +lat_0=90 +lon_0=0 +datum=WGS84 +units=m'
  });
  const utm = engine.createProjection({from: '+proj=utm +zone=60 +datum=WGS84 +units=m', to: 'WGS84'});
  const polarBounds = [-2500000, -2500000, 2500000, 2500000];
  const polarPatch = angle => ({...grid(polarBounds, polarBounds, angle), row: 10,
    transform: p => polar.project(p).slice(0, 2), domain: disk(6378137)});
  const map = createInterruptedSinusoidalMap();
  const layout = getMapLayout(map, {maxAngularStep: 10, tolerance: 0.003});
  const interrupted = map.regions.map((region, row) => {
    const lons = region.boundary.map(p => {
      let lon = p[0];
      while (lon - region.interior[0] > 180) lon -= 360;
      while (lon - region.interior[0] < -180) lon += 360;
      return lon;
    });
    const north = region.interior[1] > 0;
    // These native sinusoidal charts have meridian cuts. Split the geographic
    // raster at those known cuts before refinement, with duplicate seam vertices.
    const bounds = [Math.min(...lons), north ? 0 : -80, Math.max(...lons), north ? 80 : 0];
    const outlines = layout.regions.find(r => r.id === region.id).outlines;
    const ring = [...outlines[0].map(p => [...p])];
    if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) ring.push([...ring[0]]);
    return {...grid(bounds, [-180, -90, 180, 90]), row, chart: region.id,
      transform: p => map.projectPoint(p, region.id)?.position ?? null,
      domain: {polygons: [{outer: ring}]}};
  });
  return [
    {id: 'polar', label: 'Pole-containing stereographic raster', pixelsPerUnit: 0.00008, patches: [polarPatch(0)]},
    {id: 'rotated', label: 'Rotated polar raster grid', pixelsPerUnit: 0.00008, patches: [polarPatch(Math.PI / 5)]},
    {id: 'utm60', label: 'UTM 60 across the antimeridian', pixelsPerUnit: 20, patches: [{
      ...grid([400000, 0, 900000, 1000000]), row: 20, domain: worldDomain,
      transform: p => {const q = utm.project(p); return [q[0] < 0 ? q[0] + 360 : q[0], q[1]];}
    }]},
    {id: 'world', label: 'Full-world geographic raster', pixelsPerUnit: 1.5,
      patches: [-180, -90, 0, 90].map((west, row) => ({...grid([west, -90, west + 90, 90], [-180, -90, 180, 90]),
        row, domain: worldDomain, transform: p => p}))},
    {id: 'interrupted', label: 'Native interrupted sinusoidal charts', pixelsPerUnit: 80, patches: interrupted},
    {id: 'hole', label: 'Explicit domain with a hole', pixelsPerUnit: 70, patches: [{...grid([-2, -2, 2, 2]), row: 30,
      transform: p => p, domain: {polygons: [{outer: rectangle(-2, -2, 2, 2), holes: [rectangle(-0.5, -0.5, 0.5, 0.5)]}]}}]}
  ];
}
