// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {EllipsoidOccluder, getGlobeHorizonBounds, splitGlobeBounds} from '@math.gl/geospatial';
import {subdivideGlobeMesh} from '@math.gl/polygon';

import {BLUE_MARBLE_WORLD_URL} from '../common/blue-marble.js';

let earthPixels;
const earthImage = new Image();
earthImage.crossOrigin = 'anonymous';
earthImage.onload = () => {
  const texture = document.createElement('canvas');
  texture.width = 1024;
  texture.height = 512;
  const textureContext = texture.getContext('2d');
  textureContext.drawImage(earthImage, 0, 0, 1024, 512);
  earthPixels = textureContext.getImageData(0, 0, 1024, 512).data;
  render();
};
earthImage.src = BLUE_MARBLE_WORLD_URL;

const canvas = document.querySelector('#globe');
const context = canvas.getContext('2d');
const globe = new EllipsoidOccluder([1, 1, 1]);
const controls = ['longitude', 'latitude', 'distance', 'height', 'tolerance'];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const normalize = a => a.map(value => value / Math.hypot(...a));
const spherical = (longitude, latitude, radius = 1) => {
  const lon = (longitude * Math.PI) / 180,
    lat = (latitude * Math.PI) / 180;
  return [
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat)
  ];
};
let camera, forward, right, up, mesh, lastTolerance;
const planeScale = 0.5;

function ray(x, y) {
  return forward.map(
    (value, i) => value + right[i] * (x / 320 - 1) * planeScale - up[i] * (y / 320 - 1) * planeScale
  );
}
function project(point) {
  const relative = point.map((value, i) => value - camera[i]);
  const depth = dot(relative, forward);
  return [
    320 + (dot(relative, right) / depth / planeScale) * 320,
    320 - (dot(relative, up) / depth / planeScale) * 320
  ];
}
function line(points, color) {
  context.beginPath();
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (globe.isPointOccluded(camera, point)) continue;
    const [x, y] = project(point);
    if (i === 0 || globe.isPointOccluded(camera, points[i - 1])) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = color;
  context.stroke();
}
function render() {
  const values = Object.fromEntries(
    controls.map(id => [id, Number(document.querySelector(`#${id}`).value)])
  );
  for (const id of controls) document.querySelector(`#${id}-value`).value = values[id];
  camera = spherical(values.longitude, values.latitude, values.distance);
  forward = normalize(camera.map(value => -value));
  right = normalize(cross(forward, Math.abs(forward[2]) < 0.99 ? [0, 0, 1] : [0, 1, 0]));
  up = cross(right, forward);
  if (lastTolerance !== values.tolerance) {
    const positions = [],
      indices = [];
    // Each face spans 30 degrees; independent source seams are preserved.
    for (let lat = -90; lat < 90; lat += 30)
      for (let lon = -180; lon < 180; lon += 30) {
        const start = positions.length / 2;
        positions.push(lon, lat, lon + 30, lat, lon + 30, lat + 30, lon, lat + 30);
        indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
      }
    mesh = subdivideGlobeMesh(
      {positions, indices},
      {semiMajorAxis: 1, tolerance: values.tolerance, maxTriangles: 20000}
    );
    lastTolerance = values.tolerance;
  }
  context.clearRect(0, 0, 640, 640);
  const light = normalize([2, -1, 2]);
  for (let y = 0; y < 640; y += 5)
    for (let x = 0; x < 640; x += 5) {
      const direction = ray(x + 2.5, y + 2.5);
      const hit = globe.intersectRay(camera, direction);
      if (!hit) continue;
      const point = camera.map((value, i) => value + direction[i] * hit[0]);
      const brightness = 0.2 + 0.8 * Math.max(0, dot(point, light));
      const longitude = Math.atan2(point[1], point[0]);
      const latitude = Math.asin(Math.max(-1, Math.min(1, point[2])));
      const tx = Math.min(1023, Math.floor(((longitude + Math.PI) / (2 * Math.PI)) * 1024));
      const ty = Math.min(511, Math.floor((0.5 - latitude / Math.PI) * 512));
      const offset = (ty * 1024 + tx) * 4;
      const rgb = earthPixels ? earthPixels.slice(offset, offset + 3) : [12, 84, 140];
      context.fillStyle = `rgb(${rgb[0] * brightness},${rgb[1] * brightness},${rgb[2] * brightness})`;
      context.fillRect(x, y, 5, 5);
    }
  context.lineWidth = 0.5;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const points = [0, 1, 2, 0].map(j =>
      Array.from(mesh.positions.slice(mesh.indices[i + j] * 3, mesh.indices[i + j] * 3 + 3))
    );
    line(points, '#3d9ba67a');
  }
  const horizon = globe.getHorizon(camera);
  const limb = Array.from({length: 181}, (_, j) => {
    const angle = (j * Math.PI) / 90;
    return horizon.center.map(
      (value, i) => value + horizon.axis1[i] * Math.cos(angle) + horizon.axis2[i] * Math.sin(angle)
    );
  });
  context.lineWidth = 2;
  line(limb, '#ffbd69');
  const marker = spherical(90, 0, 1 + values.height);
  const hidden = globe.isPointOccluded(camera, marker);
  const inFront =
    dot(
      marker.map((value, i) => value - camera[i]),
      forward
    ) > 0;
  if (!hidden && inFront) {
    const [x, y] = project(marker);
    context.beginPath();
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fillStyle = '#ffe38d';
    context.fill();
    context.fillText('Elevated marker', x + 12, y);
  }
  const bounds = getGlobeHorizonBounds(camera, 1);
  const rectangles = splitGlobeBounds(bounds);
  document.querySelector('#metrics').textContent =
    `Marker: ${hidden ? 'occluded' : inFront ? 'visible' : 'behind camera'}\nTriangles: ${mesh.indices.length / 3}\nConservative WMS rectangles:\n${rectangles.map(b => b.map(n => n.toFixed(1)).join(', ')).join('\n')}\nFull horizon cap; may overfetch.`;
}
for (const id of controls) document.querySelector(`#${id}`).addEventListener('input', render);
for (const [id, lon, lat] of [
  ['dateline', 175, 0],
  ['pole', 0, 85]
])
  document.querySelector(`#${id}`).addEventListener('click', () => {
    document.querySelector('#longitude').value = lon;
    document.querySelector('#latitude').value = lat;
    render();
  });
canvas.addEventListener('pointermove', event => {
  const bounds = canvas.getBoundingClientRect();
  const direction = ray(
    ((event.clientX - bounds.left) * 640) / bounds.width,
    ((event.clientY - bounds.top) * 640) / bounds.height
  );
  const hit = globe.intersectRay(camera, direction);
  document.querySelector('#picking').textContent = hit
    ? `Surface hit at ray parameter ${hit[0].toFixed(3)}.`
    : 'Sky: ray misses the globe. No limb-clamped hit.';
});
render();
