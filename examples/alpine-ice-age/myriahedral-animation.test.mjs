// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import { fitMapLayout } from "@math.gl/geospatial/discontinuous";
import { discontinuousGrid } from "./discontinuous-views.js";
import {
  prepareMyriahedralAnimation,
  myriahedralPose,
} from "./myriahedral-animation.js";
import { myriahedralRoute } from "./projection-transition.js";

test("hinge transitions match globe and flat endpoints and preserve panel edges", () => {
  const viewport = { width: 900, height: 570, longitude: -25, latitude: 35 };
  const rad = Math.PI / 180;
  for (const view of ["myriahedral:cylindric", "myriahedral:icosahedron"]) {
    const g = discontinuousGrid(view, 10),
      animation = prepareMyriahedralAnimation(g.map);
    const fitted = fitMapLayout(g.layout, { width: 900, height: 570 });
    const folded = myriahedralPose(animation, 0, viewport, fitted);
    const flat = myriahedralPose(animation, 1, viewport, fitted);
    for (let i = 0; i < g.sources.length; i += 13) {
      const [lon, lat] = g.sources[i],
        p = g.map.projectPoint(g.sources[i], g.regionIds[i]).position;
      const a = (lon - viewport.longitude) * rad,
        b = lat * rad,
        tilt = viewport.latitude * rad;
      const expected = [
        Math.cos(b) * Math.sin(a),
        Math.sin(b) * Math.cos(tilt) -
          Math.cos(b) * Math.cos(a) * Math.sin(tilt),
        Math.sin(b) * Math.sin(tilt) +
          Math.cos(b) * Math.cos(a) * Math.cos(tilt),
      ].map((v) => v * 570 * 0.42);
      assert(
        Math.hypot(
          ...folded(p, g.regionIds[i]).map((v, k) => v - expected[k]),
        ) < 1e-7,
      );
      const screen = fitted.project(p),
        end = flat(p, g.regionIds[i]);
      assert(
        Math.hypot(
          end[0] - (screen[0] - 450),
          end[1] - (285 - screen[1]),
          end[2],
        ) < 1e-7,
      );
    }
    for (const t of [0.1, 0.4, 0.7]) {
      const pose = myriahedralPose(animation, t, viewport, fitted);
      const scale = 570 * 0.42 + (fitted.scale - 570 * 0.42) * t;
      for (let i = 0; i < g.map.regions.length; i++) {
        const r = g.map.regions[i];
        const points = r.boundary
          .slice(0, 2)
          .map((p) => pose(g.map.projectPoint(p, r.id).position, r.id));
        const vertices = g.map.layout.mesh.faces[i]
          .slice(0, 2)
          .map((v) => g.map.layout.mesh.vertices[v]);
        const length = Math.hypot(
          ...vertices[0].map((v, k) => v - vertices[1][k]),
        );
        assert(
          Math.abs(
            Math.hypot(...points[0].map((v, k) => v - points[1][k])) / scale -
              length,
          ) < 1e-8,
        );
      }
    }
  }
});

test("preset changes and interrupted unfolds route through the globe", () => {
  assert.deepEqual(
    myriahedralRoute("myriahedral:sealine", "myriahedral:coastline", 0.37),
    [
      { kind: "hinge", view: "myriahedral:sealine", from: 0.37, to: 0 },
      { kind: "hinge", view: "myriahedral:coastline", from: 0, to: 1 },
    ],
  );
  assert.deepEqual(myriahedralRoute("eqearth", "myriahedral:cylindric"), [
    { kind: "map", view: "globe" },
    { kind: "hinge", view: "myriahedral:cylindric", from: 0, to: 1 },
  ]);
  assert.deepEqual(myriahedralRoute("myriahedral:cylindric", "globe"), [
    { kind: "hinge", view: "myriahedral:cylindric", from: 1, to: 0 },
  ]);
});
