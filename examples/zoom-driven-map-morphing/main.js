// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { Deck, OrthographicView, COORDINATE_SYSTEM } from "@deck.gl/core";
import { BitmapLayer, ScatterplotLayer } from "@deck.gl/layers";
import {
  BoxPanelContainer,
  CustomPanel,
  PanelManager,
  applyPanelTheme,
  PANEL_THEME_SLEEK_DARK,
} from "@deck.gl-community/panels";
import {
  GlobeMercatorProjection,
  getGlobeToMercatorTransition,
} from "../../modules/web-mercator/src/globe-mercator-projection";
import image from "../sun-terminator/assets/day.jpg";
import "./style.css";

const root = document.querySelector("#app");
root.innerHTML = `<canvas aria-label="Zoom driven globe to map"></canvas><aside class="morph-panel"></aside><div class="morph-controls"><h1>Zoom Driven Map Morphing</h1><p>Scroll to zoom · drag to pan · hover a marker</p><label>Transition midpoint <output id="mid-value">5</output><input id="mid" type="range" min="2" max="7" step="0.1" value="5"></label><label>Transition width <output id="width-value">2</output><input id="width" type="range" min="0.5" max="4" step="0.1" value="2"></label><p id="state"></p><p id="pick">Hover a marker to identify it.</p><small>NASA Blue Marble imagery. This prototype uses an overview image; zooming does not load detail tiles.</small></div>`;
const canvas = root.querySelector("canvas");
const panelHost = root.querySelector(".morph-panel");
const controls = root.querySelector(".morph-controls");
applyPanelTheme(panelHost, PANEL_THEME_SLEEK_DARK);
const manager = new PanelManager({ parentElement: panelHost });
manager.setProps({
  components: [
    new BoxPanelContainer({
      id: "morph-infobox",
      _container: panelHost,
      title: "Zoom Driven Map Morphing",
      widthPx: 300,
      resizable: false,
      collapsible: true,
      panel: new CustomPanel({
        id: "morph-controls",
        title: "Zoom Driven Map Morphing",
        theme: "sleek-dark",
        onRenderHTML: (element) => element.append(controls),
      }),
    }),
  ],
});
const mid = root.querySelector("#mid");
const width = root.querySelector("#width");
const cities = [
  { name: "San Francisco", coordinates: [-122.42, 37.77] },
  { name: "New York", coordinates: [-74.01, 40.71] },
  { name: "London", coordinates: [-0.13, 51.51] },
  { name: "Tokyo", coordinates: [139.69, 35.69] },
  { name: "Sydney", coordinates: [151.21, -33.87] },
];
let longitude = -30,
  latitude = 25,
  zoom = 2;
const radius = 6378137;
class SurfaceLayer extends BitmapLayer {
  static layerName = "ZoomMorphSurface";
  _createMesh() {
    return this.props.mesh;
  }
}
const deck = new Deck({
  canvas,
  parent: root,
  views: new OrthographicView({ id: "morph", flipY: false }),
  initialViewState: { target: [0, 0, 0], zoom: 0 },
  onHover: (info) => {
    root.querySelector("#pick").textContent =
      info.object?.name || "Hover a marker to identify it.";
  },
});
function render() {
  const midpoint = Number(mid.value),
    span = Number(width.value);
  const progress = getGlobeToMercatorTransition(zoom, {
    startZoom: midpoint - span / 2,
    endZoom: midpoint + span / 2,
  });
  const projection = new GlobeMercatorProjection({
    longitude,
    latitude,
    progress,
  });
  const scale =
    (512 * 2 ** zoom) /
    (2 * Math.PI * radius * Math.cos((latitude * Math.PI) / 180));
  const point = (coordinates) =>
    projection.project(coordinates).map((v) => v * scale);
  // Rebuild the center-relative grid as the camera changes. Each longitude bank
  // is separate so triangles never cross the opposite-meridian seam.
  const columns = 180,
    rows = 86,
    positions = [],
    texCoords = [],
    indices = [];
  for (let y = 0; y <= rows; y++) {
    const lat = -85 + (170 * y) / rows;
    for (let x = 0; x <= columns; x++) {
      const lon = longitude - 179.999 + (359.998 * x) / columns;
      positions.push(...point([lon, lat]));
      texCoords.push(((((lon + 180) / 360) % 1) + 1) % 1, (90 - lat) / 180);
    }
  }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x,
        b = a + 1,
        c = a + columns + 1,
        d = c + 1;
      // Skip texture seams; adjacent vertices otherwise sample opposite ends of the image.
      if (Math.abs(texCoords[2 * a] - texCoords[2 * b]) > 0.5) continue;
      indices.push(a, b, c, b, d, c);
    }
  const mesh = {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    indices: new Uint32Array(indices),
    vertexCount: indices.length,
  };
  const visibleCities = cities.filter((city) => {
    const p = projection.project(city.coordinates);
    return progress > 0.99 || p[2] > -radius * 0.8;
  });
  deck.setProps({
    layers: [
      new SurfaceLayer({
        id: "surface",
        mesh,
        image,
        bounds: [-180, -90, 180, 90],
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        parameters: {
          cullMode: "back",
          depthCompare: "less-equal",
          depthWriteEnabled: true,
        },
      }),
      new ScatterplotLayer({
        id: "cities",
        data: visibleCities,
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        getPosition: (d) => point(d.coordinates),
        getRadius: 6,
        radiusUnits: "pixels",
        getFillColor: [255, 184, 76],
        stroked: true,
        getLineColor: [255, 255, 255],
        lineWidthMinPixels: 1,
        pickable: true,
        parameters: { depthCompare: "less-equal" },
      }),
    ],
  });
  root.querySelector("#mid-value").value = midpoint.toFixed(1);
  root.querySelector("#width-value").value = span.toFixed(1);
  root.querySelector("#state").textContent =
    `Zoom ${zoom.toFixed(2)} · Mercator ${(progress * 100).toFixed(0)}%`;
}
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    zoom = Math.max(0, Math.min(8, zoom - event.deltaY * 0.002));
    render();
  },
  { passive: false },
);
let drag;
canvas.addEventListener("pointerdown", (event) => {
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const degreesPerPixel = 360 / (512 * 2 ** zoom);
  longitude -= (event.clientX - drag.x) * degreesPerPixel;
  latitude = Math.max(
    -80,
    Math.min(80, latitude + (event.clientY - drag.y) * degreesPerPixel),
  );
  drag = { x: event.clientX, y: event.clientY };
  render();
});
canvas.addEventListener("pointerup", () => {
  drag = null;
});
canvas.addEventListener("pointercancel", () => {
  drag = null;
});
mid.addEventListener("input", render);
width.addEventListener("input", render);
render();
