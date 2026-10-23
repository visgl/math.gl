// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { cellToBoundary, getRes0Cells } from "h3-js";

const rad = Math.PI / 180;
const unit = ([lon, lat]) => [
  Math.cos(lon * rad) * Math.cos(lat * rad),
  Math.sin(lon * rad) * Math.cos(lat * rad),
  Math.sin(lat * rad),
];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a) => a.map((value) => value / Math.hypot(...a));
const key = (p) => p.map((value) => Math.round(value * 1e10)).join(":");

/** Exact H3 resolution-0 spherical cell boundaries, triangulated into planar hinges.
 * H3 hexagons themselves are not generally planar. Every shared boundary vertex
 * receives one index; the extra center vertex is unique to its cell.
 */
export function createH3MyriahedralMesh() {
  const vertices = [],
    faces = [],
    cells = [];
  const vertexIds = new Map();
  const vertex = (point) => {
    const p = unit(point),
      id = key(p);
    if (!vertexIds.has(id)) {
      vertexIds.set(id, vertices.length);
      vertices.push(p);
    }
    return vertexIds.get(id);
  };
  for (const token of getRes0Cells()) {
    const boundary = cellToBoundary(token, true);
    const ring = boundary.slice(0, -1).map(vertex);
    const center = normalize(
      ring.reduce(
        (sum, index) => sum.map((v, i) => v + vertices[index][i]),
        [0, 0, 0],
      ),
    );
    const centerIndex = vertices.push(center) - 1;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      const face = [centerIndex, a, b];
      const va = vertices[a].map((v, k) => v - center[k]),
        vb = vertices[b].map((v, k) => v - center[k]);
      if (dot(cross(va, vb), center) < 0) face.reverse();
      faces.push(face);
    }
    cells.push({ token, ring, centerIndex });
  }
  return {
    mesh: { vertices, faces },
    cells,
    centerVertices: new Set(cells.map((cell) => cell.centerIndex)),
  };
}

/** Keep the triangles inside each H3 cell joined before selecting intercell cuts. */
export function h3CellWeight(edge, presetWeight, centers) {
  return (
    presetWeight + (edge.vertices.some((index) => centers.has(index)) ? 1e8 : 0)
  );
}

/** Both sides of a cut receive their own outline in the unfolded layout. */
export function h3CellOutlines(map, cells) {
  const edgePanels = new Map();
  map.layout.mesh.faces.forEach((face, i) => {
    for (let j = 0; j < face.length; j++) {
      const a = face[j],
        b = face[(j + 1) % face.length];
      const edge = [a, b].sort((x, y) => x - y).join(":");
      if (!edgePanels.has(edge)) edgePanels.set(edge, []);
      edgePanels.get(edge).push(i);
    }
  });
  const geographic = (point) => [
    Math.atan2(point[1], point[0]) / rad,
    Math.atan2(point[2], Math.hypot(point[0], point[1])) / rad,
  ];
  const lines = [];
  for (const cell of cells) {
    const { ring, centerIndex } = cell;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      const panel = edgePanels
        .get([a, b].sort((x, y) => x - y).join(":"))
        ?.find((index) => map.layout.mesh.faces[index].includes(centerIndex));
      if (panel === undefined) throw new Error("H3 edge lost its source panel");
      const sourceCoordinates = [a, b].map((index) =>
        geographic(map.layout.mesh.vertices[index]),
      );
      const regionId = `panel-${panel}`;
      lines.push({
        kind: "cell",
        regionId,
        sourceCoordinates,
        coordinates: sourceCoordinates.map(
          (p) => map.projectPoint(p, regionId).position,
        ),
      });
    }
  }
  return lines;
}
