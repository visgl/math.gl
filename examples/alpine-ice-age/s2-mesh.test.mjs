// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import { S2Decoder } from "@math.gl/dggs/s2";
import { createS2MyriahedralMesh } from "./dggs-mesh.js";
import { discontinuousGrid } from "./discontinuous-views.js";

test("S2 level-zero cells form an outward-wound closed cube", () => {
  const { mesh, cells } = createS2MyriahedralMesh();
  assert.deepEqual(
    cells.map((cell) => cell.token),
    ["1", "3", "5", "7", "9", "b"],
  );
  assert.equal(mesh.vertices.length, 8);
  assert.equal(mesh.faces.length, 6);
  const edges = new Map();
  for (const face of mesh.faces) {
    assert.equal(face.length, 4);
    for (let i = 0; i < 4; i++) {
      const edge = [face[i], face[(i + 1) % 4]].sort((a, b) => a - b).join(":");
      edges.set(edge, (edges.get(edge) || 0) + 1);
    }
  }
  assert.equal(edges.size, 12);
  assert([...edges.values()].every((count) => count === 2));
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
  for (const cell of cells) {
    const samples = S2Decoder.cellToBoundary(cell.token);
    assert.equal(samples.length, 401);
    assert.equal(cell.ring.length, 4);
  }
});

test("S2 level-zero cells unfold through five hinges with visible outlines", () => {
  const grid = discontinuousGrid("myriahedral:s2-0", 5);
  assert.equal(grid.map.regions.length, 6);
  assert.equal(grid.map.layout.edges.filter((edge) => edge.hinge).length, 5);
  assert.equal(grid.lines.filter((line) => line.kind === "cell").length, 24);
});

test("S2 level-one cells share a closed spherical boundary mesh", () => {
  const { mesh, cells } = createS2MyriahedralMesh(1);
  assert.equal(cells.length, 24);
  assert.equal(mesh.vertices.length, 26);
  assert.equal(mesh.faces.length, 48);
  const edges = new Map();
  for (const face of mesh.faces)
    face.forEach((vertex, i) => {
      const edge = [vertex, face[(i + 1) % 3]].sort((a, b) => a - b).join(":");
      edges.set(edge, (edges.get(edge) || 0) + 1);
    });
  assert.equal(edges.size, 72);
  assert([...edges.values()].every((count) => count === 2));
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
  assert(
    cells.every((cell) => S2Decoder.cellToBoundary(cell.token).length === 201),
  );
});

test("S2 level-one cells unfold with their cell outlines", () => {
  const grid = discontinuousGrid("myriahedral:s2-1", 5);
  const panels = createS2MyriahedralMesh(1);
  const hinges = grid.map.layout.edges.filter((edge) => edge.hinge);
  assert.equal(grid.map.regions.length, 48);
  assert.equal(hinges.length, 47);
  assert.equal(
    hinges.filter((edge) =>
      panels.innerEdges.has([edge.a, edge.b].sort((a, b) => a - b).join(":")),
    ).length,
    24,
  );
  const outlines = grid.lines.filter((line) => line.kind === "cell");
  assert.equal(outlines.length, 96);
  for (let cell = 0; cell < 24; cell++)
    for (let i = 0; i < 4; i++) {
      const a = outlines[cell * 4 + i].coordinates[1];
      const b = outlines[cell * 4 + ((i + 1) % 4)].coordinates[0];
      assert(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-8);
    }
});
