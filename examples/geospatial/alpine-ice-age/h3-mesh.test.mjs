// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import { cellToBoundary, getRes0Cells } from "h3-js";
import { createH3MyriahedralMesh } from "./dggs-mesh.js";
import { discontinuousGrid } from "./discontinuous-views.js";

const rad = Math.PI / 180;
const unit = ([lon, lat]) => [
  Math.cos(lon * rad) * Math.cos(lat * rad),
  Math.sin(lon * rad) * Math.cos(lat * rad),
  Math.sin(lat * rad),
];
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join(":");

test("H3 base cells form one closed, outward-wound spherical triangle mesh", () => {
  const { mesh, cells } = createH3MyriahedralMesh();
  assert.equal(cells.length, 122);
  assert.equal(getRes0Cells().length, 122);
  assert.equal(mesh.vertices.length, 240);
  assert.equal(mesh.faces.length, 476);
  assert.deepEqual(
    Object.groupBy(cells, (cell) => cell.ring.length)[5].length,
    12,
  );
  assert.equal(
    Object.groupBy(cells, (cell) => cell.ring.length)[6].length,
    110,
  );
  const edges = new Map();
  for (const face of mesh.faces) {
    const [a, b, c] = face.map((i) => mesh.vertices[i]);
    const cross = [
      (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
      (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
    ];
    assert(cross.reduce((sum, v, i) => sum + v * a[i], 0) > 0);
    face.forEach((v, i) => {
      const key = edgeKey(v, face[(i + 1) % 3]);
      edges.set(key, (edges.get(key) || 0) + 1);
    });
  }
  assert.equal(edges.size, 714);
  assert([...edges.values()].every((n) => n === 2));
  assert.equal(mesh.vertices.length - edges.size + mesh.faces.length, 2);
  for (const cell of cells) {
    const boundary = cellToBoundary(cell.token, true);
    for (let i = 0; i < cell.ring.length; i++)
      assert(distance(mesh.vertices[cell.ring[i]], unit(boundary[i])) < 1e-10);
  }
});

test("H3 unfolding keeps every cell connected and projects its outlines", () => {
  const grid = discontinuousGrid("myriahedral:h3-0", 5),
    { mesh, cells } = createH3MyriahedralMesh();
  assert.equal(grid.map.regions.length, 476);
  const panels = createH3MyriahedralMesh();
  const inside = grid.map.motion.edges.filter(
    (edge) => edge.hinge && panels.innerEdges.has(edgeKey(edge.a, edge.b)),
  );
  const between = grid.map.motion.edges.filter(
    (edge) => edge.hinge && !panels.innerEdges.has(edgeKey(edge.a, edge.b)),
  );
  assert.equal(inside.length, 476 - 122);
  assert.equal(between.length, 122 - 1);
  const outlines = grid.lines.filter((line) => line.kind === "cell");
  assert.equal(outlines.length, 720);
  let offset = 0;
  for (const cell of cells) {
    const size = cell.ring.length;
    for (let i = 0; i < size; i++)
      assert(
        distance(
          outlines[offset + i].coordinates[1],
          outlines[offset + ((i + 1) % size)].coordinates[0],
        ) < 1e-8,
      );
    offset += size;
  }
  for (const line of outlines) {
    assert.equal(line.coordinates.length, 2);
    for (let i = 0; i < 2; i++) {
      const projected = grid.map.projectPoint(
        line.sourceCoordinates[i],
        line.regionId,
      );
      assert(projected);
      assert(distance(projected.position, line.coordinates[i]) < 1e-9);
    }
  }
  assert.equal(mesh.faces.length, grid.map.regions.length);
});
