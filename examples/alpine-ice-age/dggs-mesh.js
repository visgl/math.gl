// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { cellToBoundary as h3Boundary, getRes0Cells as h3Cells } from "h3-js";
import {
  cellToBoundary as a5Boundary,
  cellToChildren as a5Children,
  getRes0Cells as a5Cells,
} from "a5-js";
import { S2Decoder } from "@math.gl/dggs/s2";

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

const edgeKey = (a, b) => [a, b].sort((x, y) => x - y).join(":");
const faceKey = (face) => [...face].sort((a, b) => a - b).join(":");

/** Triangulate each boundary without an interior vertex, so its hinge dual is a tree. */
function createCellMesh(boundaries) {
  const vertices = [],
    faces = [],
    cells = [];
  const vertexIds = new Map();
  const innerEdges = new Set();
  const vertex = (point) => {
    const p = unit(point),
      id = key(p);
    if (!vertexIds.has(id)) {
      vertexIds.set(id, vertices.length);
      vertices.push(p);
    }
    return vertexIds.get(id);
  };
  for (const { token, boundary } of boundaries)
    cells.push({ token, ring: boundary.map(vertex) });
  const boundaryEdges = new Set(
    cells.flatMap(({ ring }) =>
      ring.map((index, i) => edgeKey(index, ring[(i + 1) % ring.length])),
    ),
  );
  const usedFaces = new Set();
  for (const cell of cells) {
    const { ring, token } = cell;
    const cellBoundaryEdges = new Set(
      ring.map((index, i) => edgeKey(index, ring[(i + 1) % ring.length])),
    );
    const center = normalize(
      ring.reduce(
        (sum, index) => sum.map((value, i) => value + vertices[index][i]),
        [0, 0, 0],
      ),
    );
    const east = normalize(
      cross(Math.abs(center[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1], center),
    );
    const north = cross(center, east);
    const plane = ring.map((index) => [
      dot(vertices[index], east),
      dot(vertices[index], north),
    ]);
    const area = (a, b, c) =>
      (plane[b][0] - plane[a][0]) * (plane[c][1] - plane[a][1]) -
      (plane[b][1] - plane[a][1]) * (plane[c][0] - plane[a][0]);
    const polygonArea = plane.reduce(
      (sum, p, i) =>
        sum +
        p[0] * plane[(i + 1) % plane.length][1] -
        p[1] * plane[(i + 1) % plane.length][0],
      0,
    );
    const sign = Math.sign(polygonArea);
    if (!sign) throw new Error(`Degenerate DGGS cell ${token}`);
    const failed = new Set();
    const triangulate = (remaining) => {
      if (remaining.length === 3) {
        const face = remaining.map((i) => ring[i]);
        const [a, b, c] = face.map((index) => vertices[index]);
        const volume = Math.abs(
          dot(
            cross(
              b.map((value, k) => value - a[k]),
              c.map((value, k) => value - a[k]),
            ),
            a,
          ),
        );
        return volume > 1e-12 && !usedFaces.has(faceKey(face)) ? [face] : null;
      }
      const state = remaining.join(":");
      if (failed.has(state)) return null;
      const ears = remaining.map((middle, i) => {
        const prev = remaining[(i + remaining.length - 1) % remaining.length];
        const next = remaining[(i + 1) % remaining.length];
        return { prev, middle, next, i, size: sign * area(prev, middle, next) };
      });
      ears.sort((a, b) => b.size - a.size);
      for (const { prev, middle, next, i, size } of ears) {
        if (size <= 1e-12) continue;
        const face = [ring[prev], ring[middle], ring[next]];
        if (usedFaces.has(faceKey(face))) continue;
        const diagonal = edgeKey(ring[prev], ring[next]);
        if (
          boundaryEdges.has(diagonal) ||
          innerEdges.has(diagonal) ||
          cellBoundaryEdges.has(diagonal)
        )
          continue;
        const [a, b, c] = face.map((index) => vertices[index]);
        const volume = Math.abs(
          dot(
            cross(
              b.map((value, k) => value - a[k]),
              c.map((value, k) => value - a[k]),
            ),
            a,
          ),
        );
        if (volume <= 1e-12) continue;
        if (
          remaining.some(
            (point) =>
              point !== prev &&
              point !== middle &&
              point !== next &&
              sign * area(prev, middle, point) >= -1e-12 &&
              sign * area(middle, next, point) >= -1e-12 &&
              sign * area(next, prev, point) >= -1e-12,
          )
        )
          continue;
        const rest = remaining.filter((_, index) => index !== i);
        const tail = triangulate(rest);
        if (tail) return [face, ...tail];
      }
      failed.add(state);
      return null;
    };
    const candidate = triangulate(ring.map((_, i) => i));
    if (!candidate) throw new Error(`Could not triangulate DGGS cell ${token}`);
    const faceKeys = [];
    const diagonals = new Set();
    for (const face of candidate) {
      const [a, b, c] = face.map((index) => vertices[index]);
      if (
        dot(
          cross(
            b.map((v, k) => v - a[k]),
            c.map((v, k) => v - a[k]),
          ),
          a,
        ) < 0
      )
        face.reverse();
      faces.push(face);
      faceKeys.push(faceKey(face));
      usedFaces.add(faceKey(face));
      for (let i = 0; i < 3; i++) {
        const edge = edgeKey(face[i], face[(i + 1) % 3]);
        if (!cellBoundaryEdges.has(edge)) diagonals.add(edge);
      }
    }
    for (const diagonal of diagonals) innerEdges.add(diagonal);
    cell.faceKeys = faceKeys;
  }
  return {
    mesh: { vertices, faces },
    cells,
    innerEdges,
  };
}

/** H3 resolution 0: exact shared hexagon/pentagon boundary vertices. */
export function createH3MyriahedralMesh() {
  return createCellMesh(
    h3Cells().map((token) => ({
      token,
      boundary: h3Boundary(token, true).slice(0, -1),
    })),
  );
}

/** A5 resolution 0: three segments per pentagon edge, symmetric across neighbors.
 * A5 supplies 64 samples per original edge. The central [20, 44] segment is
 * identical from either side and is the only eligible intercell hinge.
 */
export function createA5MyriahedralMesh(resolution = 0) {
  if (resolution !== 0 && resolution !== 1)
    throw new Error("A5 myriahedral mesh supports resolutions 0 and 1");
  const tokens =
    resolution === 0
      ? a5Cells()
      : a5Cells().flatMap((token) => a5Children(token, 1));
  const edgeCount = resolution === 0 ? 5 : 3;
  const samplesPerEdge = resolution === 0 ? 64 : 32;
  const middle = resolution === 0 ? [20, 44] : [10, 22];
  const result = createCellMesh(
    tokens.map((token) => {
      const boundary = a5Boundary(token);
      return {
        token,
        boundary: Array.from({ length: edgeCount }, (_, edge) =>
          [0, ...middle].map(
            (offset) => boundary[edge * samplesPerEdge + offset],
          ),
        ).flat(),
      };
    }),
  );
  result.hingeEdges = new Set(
    result.cells.flatMap((cell) =>
      Array.from({ length: edgeCount }, (_, edge) => {
        const a = cell.ring[edge * 3 + 1],
          b = cell.ring[edge * 3 + 2];
        return [a, b].sort((x, y) => x - y).join(":");
      }),
    ),
  );
  return result;
}

/** Level-one S2 cells are four children per cube face. */
function s2Children(token) {
  const parent = S2Decoder.tokenToCell(token);
  const childLsb = (parent & -parent) >> 2n;
  return Array.from({ length: 4 }, (_, index) =>
    S2Decoder.cellToToken(parent + BigInt(2 * index - 3) * childLsb),
  );
}

/** S2 level zero uses rigid cube faces; level one facets spherical cell corners. */
export function createS2MyriahedralMesh(resolution = 0) {
  if (resolution !== 0 && resolution !== 1)
    throw new Error("S2 myriahedral mesh supports resolutions 0 and 1");
  const roots = ["1", "3", "5", "7", "9", "b"];
  const tokens = resolution === 0 ? roots : roots.flatMap(s2Children);
  if (resolution === 1)
    return createCellMesh(
      tokens.map((token) => {
        const boundary = S2Decoder.cellToBoundary(token);
        return {
          token,
          boundary: [49, 99, 149, 199].map((index) => boundary[index]),
        };
      }),
    );
  const vertices = [],
    faces = [],
    cells = [];
  const vertexIds = new Map();
  for (const token of tokens) {
    // The decoder samples 100 points per edge; the final sample is each corner.
    const boundary = S2Decoder.cellToBoundary(token);
    const ring = [99, 199, 299, 399].map((index) => {
      const p = unit(boundary[index]),
        id = key(p);
      if (!vertexIds.has(id)) {
        vertexIds.set(id, vertices.length);
        vertices.push(p);
      }
      return vertexIds.get(id);
    });
    const normal = cross(
      vertices[ring[1]].map((v, i) => v - vertices[ring[0]][i]),
      vertices[ring[2]].map((v, i) => v - vertices[ring[0]][i]),
    );
    if (dot(normal, vertices[ring[0]]) < 0) ring.reverse();
    faces.push(ring);
    cells.push({ token, ring, faceKeys: [faceKey(ring)] });
  }
  return {
    mesh: { vertices, faces },
    cells,
    innerEdges: new Set(),
  };
}

/** Keep triangles inside each DGGS cell joined before selecting intercell cuts. */
export function dggsCellWeight(edge, presetWeight, panels) {
  const key = edgeKey(...edge.vertices);
  if (panels.innerEdges.has(key)) return presetWeight + 1e8;
  if (panels.hingeEdges && !panels.hingeEdges.has(key))
    return presetWeight - 1e8;
  return presetWeight;
}

/** Both sides of a cut receive their own outline in the unfolded layout. */
export function dggsCellOutlines(map, cells) {
  const edgePanels = new Map();
  const panelByFace = new Map(
    map.motion.mesh.faces.map((face, index) => [faceKey(face), index]),
  );
  map.motion.mesh.faces.forEach((face, i) => {
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
    const { ring, faceKeys } = cell;
    const panels = new Set(faceKeys.map((face) => panelByFace.get(face)));
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      const panel = edgePanels
        .get([a, b].sort((x, y) => x - y).join(":"))
        ?.find((index) => panels.has(index));
      if (panel === undefined)
        throw new Error("DGGS edge lost its source panel");
      const sourceCoordinates = [a, b].map((index) =>
        geographic(map.motion.mesh.vertices[index]),
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
