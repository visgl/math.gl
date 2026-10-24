// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import { cellToBoundary, getNumCells, getRes0Cells } from "a5-js";
import { createA5MyriahedralMesh } from "./dggs-mesh.js";
import { discontinuousGrid } from "./discontinuous-views.js";

const rad = Math.PI / 180;
const unit = ([lon, lat]) => [
  Math.cos(lon * rad) * Math.cos(lat * rad),
  Math.sin(lon * rad) * Math.cos(lat * rad),
  Math.sin(lat * rad),
];
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join(":");

test("A5 base cells share sampled boundaries in a closed spherical mesh", () => {
  const { mesh, cells, hingeEdges } = createA5MyriahedralMesh();
  assert.equal(getRes0Cells().length, 12);
  assert.equal(cells.length, 12);
  assert.equal(mesh.vertices.length, 80);
  assert.equal(mesh.faces.length, 156);
  assert(cells.every((cell) => cell.ring.length === 15));
  assert.equal(hingeEdges.size, 30);
  const edges = new Map();
  for (const face of mesh.faces)
    face.forEach((v, i) => {
      const key = edgeKey(v, face[(i + 1) % 3]);
      edges.set(key, (edges.get(key) || 0) + 1);
    });
  assert.equal(edges.size, 234);
  assert([...edges.values()].every((n) => n === 2));
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
  for (const cell of cells) {
    const boundary = cellToBoundary(cell.token);
    for (let i = 0; i < 15; i++) {
      const sample = 64 * Math.floor(i / 3) + [0, 20, 44][i % 3];
      assert(
        distance(mesh.vertices[cell.ring[i]], unit(boundary[sample])) < 1e-10,
      );
    }
    for (let edge = 0; edge < 5; edge++)
      assert(
        hingeEdges.has(
          edgeKey(cell.ring[edge * 3 + 1], cell.ring[edge * 3 + 2]),
        ),
      );
  }
});

test("A5 unfolding joins cells only at the central subdivided edge segments", () => {
  const panels = createA5MyriahedralMesh(),
    g = discontinuousGrid("myriahedral:a5-0", 5);
  const inner = g.map.motion.edges.filter(
    (e) => e.hinge && panels.innerEdges.has(edgeKey(e.a, e.b)),
  );
  const outer = g.map.motion.edges.filter(
    (e) => e.hinge && !panels.innerEdges.has(edgeKey(e.a, e.b)),
  );
  assert.equal(inner.length, 156 - 12);
  assert.equal(outer.length, 12 - 1);
  assert(outer.every((e) => panels.hingeEdges.has(edgeKey(e.a, e.b))));
  const outlines = g.lines.filter((line) => line.kind === "cell");
  assert.equal(outlines.length, 180);
  for (let cell = 0; cell < 12; cell++)
    for (let i = 0; i < 15; i++)
      assert(
        distance(
          outlines[cell * 15 + i].coordinates[1],
          outlines[cell * 15 + ((i + 1) % 15)].coordinates[0],
        ) < 1e-8,
      );
  for (const line of outlines) {
    for (let i = 0; i < 2; i++) {
      const p = g.map.projectPoint(line.sourceCoordinates[i], line.regionId);
      assert(p);
      assert(distance(p.position, line.coordinates[i]) < 1e-9);
    }
  }
});

test("A5 resolution 1 forms 60 closed triangular cells", () => {
  const panels = createA5MyriahedralMesh(1);
  const { mesh, cells, hingeEdges } = panels;
  assert.equal(cells.length, getNumCells(1));
  assert.equal(cells.length, 60);
  assert.equal(mesh.vertices.length, 212);
  assert.equal(mesh.faces.length, 420);
  assert.equal(hingeEdges.size, 90);
  const edges = new Map();
  for (const face of mesh.faces)
    face.forEach((v, i) => {
      const key = edgeKey(v, face[(i + 1) % 3]);
      edges.set(key, (edges.get(key) || 0) + 1);
    });
  assert([...edges.values()].every((count) => count === 2));
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
  for (const cell of cells) {
    assert.equal(cell.ring.length, 9);
    const boundary = cellToBoundary(cell.token);
    for (let i = 0; i < cell.ring.length; i++) {
      const sample = 32 * Math.floor(i / 3) + [0, 10, 22][i % 3];
      assert(
        distance(mesh.vertices[cell.ring[i]], unit(boundary[sample])) < 1e-10,
      );
    }
  }
});

test("A5 resolution 1 unfolds through the intended middle segments", () => {
  const panels = createA5MyriahedralMesh(1);
  const grid = discontinuousGrid("myriahedral:a5-1", 5);
  const internal = grid.map.motion.edges.filter(
    (edge) => edge.hinge && panels.innerEdges.has(edgeKey(edge.a, edge.b)),
  );
  const external = grid.map.motion.edges.filter(
    (edge) => edge.hinge && !panels.innerEdges.has(edgeKey(edge.a, edge.b)),
  );
  assert.equal(internal.length, 420 - 60);
  assert.equal(external.length, 59);
  assert(
    external.every((edge) => panels.hingeEdges.has(edgeKey(edge.a, edge.b))),
  );
  assert.equal(grid.lines.filter((line) => line.kind === "cell").length, 540);
  const outlines = grid.lines.filter((line) => line.kind === "cell");
  for (let cell = 0; cell < 60; cell++)
    for (let i = 0; i < 9; i++)
      assert(
        distance(
          outlines[cell * 9 + i].coordinates[1],
          outlines[cell * 9 + ((i + 1) % 9)].coordinates[0],
        ) < 1e-8,
      );
});
