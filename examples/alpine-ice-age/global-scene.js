// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  canCenterMap,
  centeredGraticules,
  wrapLongitude,
  mapLongitudeOffset,
  geographicSource,
  sampleLongitudeRow,
} from "./map-center.js";
import { Deck, OrthographicView, COORDINATE_SYSTEM } from "@deck.gl/core";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { PathLayer, PolygonLayer, TextLayer } from "@deck.gl/layers";
import { prepareMapGrid } from "./prepare-map-grid.js";
import { fitMapLayout } from "@math.gl/geospatial/discontinuous";
import { Geometry } from "@luma.gl/engine";
import { projectionGrid, projectCoordinate } from "./projection-grid.js";
import {
  myriahedralPose,
  prepareMyriahedralAnimation,
} from "./myriahedral-animation.js";
import { interpolateField } from "./data.js";
import { nearestOSFChapter } from "./osf-data.js";
import {
  projectionWeights,
  projectionRoute,
  prunePreparedMaps,
  segmentedPosition,
  globePosition,
} from "./projection-transition.js";
import { REGIONAL_VIEWS } from "./regional-views.js";
import {
  DISCONTINUOUS_VIEWS,
  sourceSample,
  sampleField,
} from "./discontinuous-views.js";
const RAD = Math.PI / 180;
function color(bed, ice, showIce, ghost) {
  let c =
    bed < 0
      ? [
          20 + Math.min(22, Math.max(0, (bed + 5000) / 200)),
          57 + Math.max(0, (bed + 5000) / 200),
          80 + Math.max(0, (bed + 5000) / 250),
        ]
      : bed < 700
        ? [87, 112, 93]
        : bed < 2000
          ? [134, 136, 111]
          : [177, 174, 154];
  if (showIce && ice > 1) {
    const amount = Math.min(1, ice / 120) * (ghost ? 0.82 : 1),
      thick = Math.min(1, ice / 1500),
      gray = c.reduce((a, b) => a + b, 0) / 3;
    c = c.map((v, i) => {
      const base = gray * 0.8 + v * 0.2,
        iceColor = [160 + 75 * thick, 205 + 35 * thick, 224 + 21 * thick][i];
      return base * (1 - amount) + iceColor * amount;
    });
  }
  return c;
}
export function createGlobalScene(
  canvas,
  onError,
  onLoading = () => {},
  onLongitude = () => {},
  onProgress = () => {},
) {
  let current,
    options,
    longitude = 0,
    latitude = 35,
    dragging,
    weights,
    transition,
    animationFrame,
    displayView,
    unfoldAmount = 1,
    route = [];
  const animations = new WeakMap();
  const prepared = new Map();
  let pending,
    disposed = false,
    fields;
  const surfaces = new WeakMap();
  const endpoints = new WeakMap();
  const duration = 1200;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const deck = new Deck({
    canvas,
    views: new OrthographicView({ flipY: false, near: -10000, far: 10000 }),
    viewState: { target: [0, 0, 0], zoom: 0, minZoom: -1, maxZoom: 4 },
    controller: { dragPan: true, scrollZoom: true },
    getCursor: () => (dragging ? "grabbing" : "grab"),
    onViewStateChange: ({ viewState }) => deck.setProps({ viewState }),
    onError,
  });
  function startStage(now) {
    const stage = route.shift();
    if (!stage) {
      transition = null;
      return;
    }
    if (stage.kind === "hinge" || stage.kind === "segmented") {
      displayView = stage.view;
      unfoldAmount = stage.from;
      transition = { ...stage, start: now };
      weights = { globe: 1 };
    } else if (
      REGIONAL_VIEWS[stage.view] ||
      DISCONTINUOUS_VIEWS[stage.view] ||
      Object.keys(weights).some(
        (id) => REGIONAL_VIEWS[id] || DISCONTINUOUS_VIEWS[id],
      )
    ) {
      // Other discontinuous maps do not share a hinge mesh.
      displayView = stage.view;
      weights = { [stage.view]: 1 };
      transition = null;
      startStage(now);
    } else {
      displayView = stage.view;
      transition = {
        kind: "map",
        from: { ...weights },
        target: stage.view,
        start: now,
      };
    }
  }
  function gridStep(view) {
    return view === "myriahedral:h3-0" ||
      view.startsWith("myriahedral:a5-") ||
      view === "myriahedral:s2-1"
      ? 2
      : 1;
  }
  function sampleTransition(now) {
    if (!transition) return;
    const fraction = Math.min(
      1,
      Math.max(0, (now - transition.start) / duration),
    );
    if (transition.kind === "hinge" || transition.kind === "segmented") {
      const ease = fraction * fraction * (3 - 2 * fraction);
      unfoldAmount = transition.from + (transition.to - transition.from) * ease;
      if (fraction >= 1 && transition.to === 0) displayView = "globe";
    } else
      weights = projectionWeights(transition.from, transition.target, fraction);
    if (fraction >= 1) startStage(now);
  }
  function animate(now) {
    animationFrame = null;
    sampleTransition(now);
    draw(current, options);
    if (transition) animationFrame = requestAnimationFrame(animate);
  }
  function render(model, opts) {
    if (disposed) return;
    // Options may change repeatedly while a mesh is pending; honor the latest
    // requested value even when it equals the last displayed longitude.
    if (opts.longitude !== undefined) longitude = Number(opts.longitude);
    if (pending && pending.opts.view !== opts.view) {
      pending.controller.abort();
      pending = null;
    }
    if (!prepared.has(opts.view)) {
      if (pending) {
        pending.model = model;
        pending.opts = opts;
        return;
      }
      const request = { model, opts, controller: new AbortController() };
      pending = request;
      canvas.setAttribute("aria-busy", "true");
      onLoading(true);
      onProgress({phase: 'starting', completed: 0});
      prepareMapGrid(opts.view, gridStep(opts.view), {
        signal: request.controller.signal,
        onProgress: (progress) => {
          if (!disposed && pending === request) onProgress(progress);
        },
      })
        .then((grid) => {
          if (disposed || pending !== request) return;
          prepared.set(opts.view, grid);
          prunePreparedMaps(
            prepared,
            displayView,
            opts.view,
            transition,
            route,
          );
          pending = null;
          canvas.removeAttribute("aria-busy");
          onLoading(false);
          render(request.model, request.opts);
        })
        .catch((error) => {
          if (request.controller.signal.aborted || disposed || pending !== request) return;
          pending = null;
          canvas.removeAttribute("aria-busy");
          onLoading(false);
          onError(error);
        });
      return;
    }
    canvas.removeAttribute("aria-busy");
    onLoading(false);
    const now = performance.now();
    sampleTransition(now);
    const viewChanged = options?.view !== opts.view;
    const regionalSwitch =
      viewChanged &&
      (REGIONAL_VIEWS[opts.view] ||
        DISCONTINUOUS_VIEWS[opts.view] ||
        Object.keys(weights || {}).some(
          (id) => REGIONAL_VIEWS[id] || DISCONTINUOUS_VIEWS[id],
        ));
    if (!weights || reducedMotion.matches) {
      weights = { [opts.view]: 1 };
      displayView = opts.view;
      unfoldAmount = 1;
      transition = null;
      route = [];
    } else if (
      viewChanged &&
      (DISCONTINUOUS_VIEWS[displayView] || DISCONTINUOUS_VIEWS[opts.view])
    ) {
      route = projectionRoute(displayView, opts.view, unfoldAmount);
      startStage(now);
    } else if (viewChanged) {
      route = [];
      unfoldAmount = 1;
      displayView = opts.view;
      if (regionalSwitch) {
        weights = { [opts.view]: 1 };
        transition = null;
      } else
        transition = {
          kind: "map",
          from: { ...weights },
          target: opts.view,
          start: now,
        };
    }
    current = model;
    options = opts;
    if (viewChanged)
      deck.setProps({
        viewState: {
          target: [0, 0, 0],
          zoom: 0,
          minZoom: -1,
          maxZoom: 4,
        },
      });
    if (!animationFrame) animationFrame = requestAnimationFrame(animate);
  }
  function draw(model, opts) {
    opts = { ...opts, view: displayView ?? opts.view };
    const { view, age, showIce, ghost, labels } = opts;
    const size = 361 * 181;
    if (!fields || fields.model !== model || fields.age !== age) {
      const ice = model.footprints
          ? model.ice.subarray(
              model.manifest.ages.indexOf(nearestOSFChapter(age).age) *
                model.count,
              (model.manifest.ages.indexOf(nearestOSFChapter(age).age) + 1) *
                model.count,
            )
          : interpolateField(model.ice, model.count, model.manifest.ages, age),
        bed = interpolateField(
          model.bed,
          model.count,
          model.manifest.ages,
          age,
        );
      fields = { model, age, ice, bed };
    }
    const { ice, bed } = fields;
    if (DISCONTINUOUS_VIEWS[view]) {
      drawDiscontinuous(model, opts, ice, bed);
      return;
    }
    const g = projectionGrid(view);
    const positions = new Float32Array(size * 3),
      normals = new Float32Array(size * 3),
      colors = new Float32Array(size * 3);
    const width = canvas.clientWidth || 900,
      height = canvas.clientHeight || 570;
    const offset = mapLongitudeOffset(view, longitude);
    const globeScale = Math.min(width, height) * 0.42;
    const endpoints = Object.entries(weights).map(([id, weight]) => {
      const mesh = projectionGrid(id);
      const scale =
        id === "globe"
          ? globeScale
          : Math.min((width * 0.46) / mesh.maxX, (height * 0.43) / mesh.maxY);
      return { id, weight, mesh, scale };
    });
    const globeWeight = weights.globe || 0;
    const tilt = latitude * RAD;
    function point(lon, lat) {
      const a = (lon - longitude) * RAD,
        b = lat * RAD;
      const x = Math.cos(b) * Math.sin(a),
        y = Math.sin(b),
        z = Math.cos(b) * Math.cos(a);
      return [
        x,
        y * Math.cos(tilt) - z * Math.sin(tilt),
        y * Math.sin(tilt) + z * Math.cos(tilt),
      ];
    }
    // Every endpoint shares vertex identities, including the longitude seam.
    // Ice, graticules and text follow the same weighted geographical positions.
    function blendedPoint(
      lon,
      lat,
      lift = 0,
      chartLongitude = wrapLongitude(lon - offset),
    ) {
      const result = [0, 0, 0];
      for (const endpoint of endpoints) {
        let p;
        if (endpoint.id === "globe")
          p = point(lon, lat).map((v) => v * (endpoint.scale + lift));
        else {
          p = projectCoordinate(endpoint.id, [chartLongitude, lat]);
          p = [
            (p[0] - endpoint.mesh.centerX) * endpoint.scale,
            (p[1] - endpoint.mesh.centerY) * endpoint.scale,
            lift,
          ];
        }
        for (let axis = 0; axis < 3; axis++)
          result[axis] += p[axis] * endpoint.weight;
      }
      return result;
    }
    for (let y = 0; y <= 180; y++)
      for (let x = 0; x <= 360; x++) {
        const i = y * 361 + x,
          c = color(
            sampleLongitudeRow(bed, x, y, offset),
            sampleLongitudeRow(ice, x, y, offset) *
              (model.footprints || model.maskModel ? 1500 : 1),
            showIce,
            ghost,
          );
        const sphere = point(x - 180 + offset, y - 90);
        for (const endpoint of endpoints) {
          const p =
            endpoint.id === "globe"
              ? sphere.map((v) => v * endpoint.scale)
              : [
                  endpoint.mesh.positions[i * 2] * endpoint.scale,
                  endpoint.mesh.positions[i * 2 + 1] * endpoint.scale,
                  0,
                ];
          for (let axis = 0; axis < 3; axis++)
            positions[i * 3 + axis] += p[axis] * endpoint.weight;
        }
        const normal = sphere.map(
          (v, axis) => v * globeWeight + (axis === 2 ? 1 - globeWeight : 0),
        );
        const length = Math.hypot(...normal) || 1;
        normals.set(
          normal.map((v) => v / length),
          i * 3,
        );
        const shade = 1 - globeWeight * 0.3 * (1 - Math.max(0, sphere[2]));
        colors.set(
          c.map((v) => (v / 255) * shade),
          i * 3,
        );
      }
    const mesh = new Geometry({
      topology: "triangle-list",
      indices: g.indices,
      attributes: {
        positions: { size: 3, value: positions },
        normals: { size: 3, value: normals },
        colors: { size: 3, value: colors },
      },
    });
    const lines = [];
    if (labels) {
      const [west, south, east, north] = REGIONAL_VIEWS[view]?.bounds || [
        -180, -85, 180, 85,
      ];
      for (let lon = Math.ceil(west / 30) * 30; lon <= east; lon += 30) {
        const path = [];
        for (let lat = south; lat <= north; lat += 1)
          path.push(blendedPoint(lon, lat, 0.6));
        lines.push({ path, opacity: 1 });
      }
      for (
        let lat = Math.ceil(south / 30) * 30;
        lat <= Math.min(north, 60);
        lat += 30
      ) {
        const path = [];
        for (let lon = west; lon <= east; lon += 1)
          path.push(blendedPoint(lon + offset, lat, 0.6, lon));
        lines.push({ path, opacity: 1 });
      }
    }
    setLayers(view, mesh, lines);
  }
  function drawDiscontinuous(model, opts, ice, bed) {
    const g = prepared.get(opts.view);
    const width = canvas.clientWidth || 900,
      height = canvas.clientHeight || 570;
    const fitted = fitMapLayout(g.layout, {
      width,
      height,
      padding: {
        left: width * 0.04,
        right: width * 0.04,
        top: height * 0.07,
        bottom: height * 0.07,
      },
    });
    const regions = new Map(
      fitted.regions.map((region) => [region.id, region]),
    );
    let pose;
    if (g.map.motion && unfoldAmount < 1) {
      if (!animations.has(g.map))
        animations.set(g.map, prepareMyriahedralAnimation(g.map));
      pose = myriahedralPose(
        animations.get(g.map),
        unfoldAmount,
        { width, height, longitude, latitude },
        fitted,
      );
    }
    const viewport = { width, height, longitude, latitude };
    const offset = mapLongitudeOffset(opts.view, longitude);
    const toScene = (p, regionId, lift = 0, source) => {
      if (pose) return pose(p, regionId, lift);
      const [x, y] = fitted.project(p);
      const flat = [
        x - width / 2,
        height / 2 - y,
        regions.get(regionId).layer * 2 + lift,
      ];
      if (!g.map.motion && unfoldAmount < 1) {
        const geographic =
          source || g.map.unprojectPoint(p, regionId)[0]?.position;
        if (geographic)
          return segmentedPosition(
            flat,
            geographicSource(geographic, offset),
            unfoldAmount,
            viewport,
            lift,
          );
      }
      return flat;
    };
    let endpoint;
    if (!g.map.motion) {
      endpoint = endpoints.get(g);
      const key = [width, height, longitude, latitude].join(":");
      if (!endpoint || endpoint.key !== key) {
        endpoint = {
          key,
          flat: new Float32Array(g.samples.length * 3),
          globe: new Float32Array(g.samples.length * 3),
          samples:
            offset === 0
              ? g.samples
              : g.sources.map((p) => sourceSample(geographicSource(p, offset))),
        };
        for (let i = 0; i < g.samples.length; i++) {
          const [x, y] = fitted.project([
            g.positions[i * 2],
            g.positions[i * 2 + 1],
          ]);
          endpoint.flat.set(
            [
              x - width / 2,
              height / 2 - y,
              regions.get(g.regionIds[i]).layer * 2,
            ],
            i * 3,
          );
          endpoint.globe.set(
            globePosition(geographicSource(g.sources[i], offset), viewport),
            i * 3,
          );
        }
        endpoints.set(g, endpoint);
      }
    }
    const positions = new Float32Array(g.samples.length * 3);
    let surface = surfaces.get(g);
    const surfaceChanged =
      !surface ||
      surface.fields !== fields ||
      surface.offset !== offset ||
      surface.showIce !== opts.showIce ||
      surface.ghost !== opts.ghost;
    if (surfaceChanged) {
      surface = {
        fields,
        offset,
        showIce: opts.showIce,
        ghost: opts.ghost,
        colors: new Float32Array(positions.length),
        normals: new Float32Array(positions.length),
      };
      surfaces.set(g, surface);
    }
    const { colors, normals } = surface;
    for (let i = 0; i < g.samples.length; i++) {
      if (endpoint) {
        for (let k = i * 3; k < i * 3 + 3; k++)
          positions[k] =
            endpoint.globe[k] +
            (endpoint.flat[k] - endpoint.globe[k]) * unfoldAmount;
      } else
        positions.set(
          toScene(
            [g.positions[i * 2], g.positions[i * 2 + 1]],
            g.regionIds[i],
            0,
            g.sources[i],
          ),
          i * 3,
        );
      normals[i * 3 + 2] = 1;
      if (surfaceChanged) {
        const thickness =
          sampleField(ice, endpoint?.samples[i] || g.samples[i]) *
          (model.footprints || model.maskModel ? 1500 : 1);
        colors.set(
          color(
            sampleField(bed, endpoint?.samples[i] || g.samples[i]),
            thickness,
            opts.showIce,
            opts.ghost,
          ).map((v) => v / 255),
          i * 3,
        );
      }
    }
    const mesh = new Geometry({
      topology: "triangle-list",
      indices: g.indices,
      attributes: {
        positions: { size: 3, value: positions },
        normals: { size: 3, value: normals },
        colors: { size: 3, value: colors },
      },
    });
    const lines = centeredGraticules(g.map, g.lines, offset)
      .filter(
        (line) =>
          opts.view !== "albersUsa" && (opts.labels || line.kind === "cell"),
      )
      .map((line) => ({
        kind: line.kind,
        opacity: 1,
        path: line.coordinates.map((p, i) =>
          toScene(p, line.regionId, 0.2, line.sourceCoordinates?.[i]),
        ),
      }));
    const insets = fitted.regions.filter(
      (region) => region.kind === "inset" && opts.view !== "albersUsa",
    );
    const frameData = insets.map((region) => {
      const [left, top, right, bottom] = region.frame || region.bounds;
      const scene = ([x, y]) => [
        x - width / 2,
        height / 2 - y,
        region.layer * 2 + 0.8,
      ];
      return {
        label: region.label,
        path: [
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom],
          [left, top],
        ].map(scene),
        anchor: scene([left + 3, top - 3]),
      };
    });
    const referenceLand = g.referenceLand.map((part) => ({
      polygon: part.coordinates.map((ring) =>
        ring.map((p) => toScene(p, part.regionId, 0.4)),
      ),
    }));
    setLayers(opts.view, mesh, lines, [
      new PolygonLayer({
        id: "modern-island-reference",
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: referenceLand,
        getPolygon: (d) => d.polygon,
        getFillColor: [170, 175, 125, 255],
        getLineColor: [239, 234, 191, 255],
        getLineWidth: 1,
        lineWidthUnits: "pixels",
        stroked: true,
        material: false,
      }),
      new PathLayer({
        id: "inset-frames",
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: frameData,
        getPath: (d) => d.path,
        getColor: [224, 235, 240, 230],
        getWidth: 1.5,
        widthUnits: "pixels",
      }),
      new TextLayer({
        id: "inset-labels",
        coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
        data: frameData,
        getText: (d) => d.label,
        getPosition: (d) => d.anchor,
        getSize: 12,
        sizeUnits: "pixels",
        getColor: [245, 247, 242],
        getTextAnchor: "start",
        getAlignmentBaseline: "bottom",
        background: true,
        getBackgroundColor: [12, 28, 37, 210],
        backgroundPadding: [3, 2],
      }),
    ]);
  }
  function setLayers(view, mesh, lines, overlays = []) {
    deck.setProps({
      controller: { dragPan: view !== "globe" && !dragging, scrollZoom: true },
      layers: [
        new SimpleMeshLayer({
          id: "global-ice",
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: [{}],
          mesh,
          getPosition: [0, 0, 0],
          getColor: [255, 255, 255],
          material: { unlit: true },
        }),
        new PathLayer({
          id: "global-graticule",
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: lines,
          getPath: (d) => d.path,
          getColor: (d) =>
            d.kind === "cell"
              ? [235, 222, 170, 180]
              : [181, 211, 224, 60 * d.opacity],
          getWidth: 1,
          widthUnits: "pixels",
          parameters: { depthWriteEnabled: false },
        }),
        ...overlays,
      ],
    });
  }
  function down(e) {
    if (
      !transition &&
      (displayView === "globe" || (e.shiftKey && canCenterMap(displayView)))
    ) {
      dragging = [e.clientX, e.clientY, longitude, latitude];
      deck.setProps({ controller: { dragPan: false, scrollZoom: true } });
      canvas.setPointerCapture(e.pointerId);
    }
  }
  function move(e) {
    if (dragging) {
      longitude = wrapLongitude(dragging[2] - (e.clientX - dragging[0]) * 0.35);
      if (displayView === "globe")
        latitude = Math.max(
          -85,
          Math.min(85, dragging[3] + (e.clientY - dragging[1]) * 0.35),
        );
      onLongitude(longitude);
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    }
  }
  function up() {
    dragging = null;
    deck.setProps({
      controller: { dragPan: displayView !== "globe", scrollZoom: true },
    });
  }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  const resize = new ResizeObserver(() => {
    if (current) draw(current, options);
  });
  resize.observe(canvas);
  return {
    render,
    finalize() {
      disposed = true;
      pending?.controller.abort();
      prepared.clear();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      transition = null;
      route = [];
      resize.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      deck.finalize();
    },
  };
}
