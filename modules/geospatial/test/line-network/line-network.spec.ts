// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import turfDistance from '@turf/distance';
import turfNearestPointOnLine from '@turf/nearest-point-on-line';
import {
  NO_PREDECESSOR,
  buildLineNetwork,
  buildLineNetworkAdjacency,
  getEdgeGeometry,
  getEdgePointCount,
  getRouteEdges,
  getRouteGeometry,
  haversineDistance,
  type LineNetwork,
  type LineNetworkLines
} from '@math.gl/geospatial/line-network';
import {ONE_METRE, dijkstra, makeGridLines, makeLines, makeRandom} from './line-network-fixtures';

/** Sorted undirected edge keys. */
function getEdgeSet(net: LineNetwork): string[] {
  return Array.from(net.edgeSource, (s, e) => {
    const t = net.edgeTarget[e];
    return `${Math.min(s, t)}-${Math.max(s, t)}`;
  }).sort();
}

/** GeoJSON point for the turf oracles. */
function point(lon: number, lat: number) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {type: 'Point' as const, coordinates: [lon, lat]}
  };
}

describe('buildLineNetwork', () => {
  it('joins lines that share an endpoint into one node', () => {
    // Junctions off, so the test sees the snap alone (a junction would also join these ends).
    const net = buildLineNetwork(
      makeLines([0, 0, 0.001, 0], [0.001, 0, 0.002, 0], [0.001, 0, 0.001, 0.001]),
      {junctionTolerance: 0}
    );
    expect(net.nodeCount).toBe(4);
    expect(net.edgeCount).toBe(3);
    const degree = new Uint32Array(net.nodeCount);
    for (let e = 0; e < net.edgeCount; e++) {
      degree[net.edgeSource[e]]++;
      degree[net.edgeTarget[e]]++;
    }
    expect(Array.from(degree).sort()).toEqual([1, 1, 1, 3]);
    expect(Array.from(net.edgeRow)).toEqual([0, 1, 2]);
    expect(Array.from(net.edgePath)).toEqual([0, 1, 2]);
  });

  it('joins endpoints within the snap tolerance and keeps farther ones apart', () => {
    const gap = 0.5 * ONE_METRE;
    const input = makeLines([0, 0, 0.001, 0], [0.001, gap, 0.002, 0]);
    expect(buildLineNetwork(input, {snapTolerance: 1}).nodeCount).toBe(3);
    expect(buildLineNetwork(input, {snapTolerance: 0.1}).nodeCount).toBe(4);
    // 1.3 m apart with a 1 m tolerance: the points are in neighbouring cells, so only the
    // distance test keeps them apart.
    const near = makeLines([0, 0, 0.001, 0], [0.001, 1.3 * ONE_METRE, 0.002, 0]);
    expect(buildLineNetwork(near, {snapTolerance: 1}).nodeCount).toBe(4);
  });

  it('snaps across grid cell borders at high latitude, east and west', () => {
    // 40 pairs of endpoints 0.6 m apart in longitude at 70 degrees north, half with the new
    // point east of the first and half west. With 1 m cells, many pairs straddle a cell border.
    const dLon = 0.6 / (111_195 * Math.cos((70 * Math.PI) / 180));
    const paths: number[][] = [];
    for (let k = 0; k < 20; k++) {
      const lon = 10 + k * 0.01 + k * 0.0000123;
      paths.push([lon - 0.001, 70, lon, 70], [lon + dLon, 70, lon + 0.001, 70]);
      const lat = 70.5;
      paths.push([lon + 0.001, lat, lon, lat], [lon - dLon, lat, lon - 0.001, lat]);
    }
    const net = buildLineNetwork(makeLines(...paths), {snapTolerance: 1, junctionTolerance: 0});
    expect(net.nodeCount).toBe(40 * 3);
  });

  it('splits at an interior vertex that another line shares, only when asked', () => {
    const input = makeLines([0, 0, 0.001, 0, 0.002, 0], [0.001, 0, 0.001, 0.001]);
    // Junctions off: only the split mode joins the shared vertex.
    const plain = buildLineNetwork(input, {junctionTolerance: 0});
    expect(plain.edgeCount).toBe(2);
    expect(plain.nodeCount).toBe(4);
    const split = buildLineNetwork(input, {splitAtInteriorVertices: true});
    expect(split.edgeCount).toBe(3);
    expect(split.nodeCount).toBe(4);
    expect(Array.from(split.edgeRow)).toEqual([0, 0, 1]);
    expect(Array.from(split.edgeVertexStart)).toEqual([0, 1, 3]);
    expect(Array.from(split.edgeVertexEnd)).toEqual([1, 2, 4]);
    // The two pieces of line 0 add up to its whole length.
    const whole = haversineDistance(0, 0, 0.002, 0);
    expect(split.edgeLength[0] + split.edgeLength[1]).toBeCloseTo(whole, 6);
  });

  it('does not split at interior vertices that no other line touches', () => {
    const net = buildLineNetwork(makeLines([0, 0, 0.001, 0, 0.002, 0.001]), {
      splitAtInteriorVertices: true
    });
    expect(net.edgeCount).toBe(1);
    expect(net.edgeLength[0]).toBeCloseTo(
      haversineDistance(0, 0, 0.001, 0) + haversineDistance(0.001, 0, 0.002, 0.001),
      6
    );
  });

  it('keeps disconnected parts apart', () => {
    const net = buildLineNetwork(makeLines([0, 0, 0.001, 0], [1, 1, 1.001, 1]));
    expect(net.nodeCount).toBe(4);
    const adjacency = buildLineNetworkAdjacency(net);
    const result = dijkstra(adjacency, net.edgeWeight, net.edgeSource[0]);
    expect(result.distances[net.edgeSource[1]]).toBe(Infinity);
    expect(result.predecessors[net.edgeTarget[1]]).toBe(NO_PREDECESSOR);
    expect(
      getRouteEdges(
        adjacency,
        net.edgeWeight,
        result.predecessors,
        net.edgeSource[0],
        net.edgeTarget[1]
      )
    ).toBeNull();
  });

  it('builds the expected grid graph with jitter below the tolerance', () => {
    const grid = makeGridLines({side: 5, jitterDegrees: 0.2 * ONE_METRE, seed: 7});
    const net = buildLineNetwork(grid, {snapTolerance: 1});
    expect(net.nodeCount).toBe(25);
    expect(net.edgeCount).toBe(40);
    expect(new Set(getEdgeSet(net)).size).toBe(40);
  });

  it('reads positions with more than two values for each vertex', () => {
    // XYZ positions: the Z values are large, so a stride error gives different nodes.
    const xy = makeLines([0, 0, 0.001, 0, 0.002, 0], [0.001, 0, 0.001, 0.001]);
    const xyz: LineNetworkLines = {
      ...xy,
      positions: {
        value: Float64Array.from([
          0, 0, 50, 0.001, 0, 60, 0.002, 0, 70, 0.001, 0, 80, 0.001, 0.001, 90
        ]),
        size: 3
      }
    };
    const a = buildLineNetwork(xy, {splitAtInteriorVertices: true});
    const b = buildLineNetwork(xyz, {splitAtInteriorVertices: true});
    expect(Array.from(b.nodePositions)).toEqual(Array.from(a.nodePositions));
    expect(Array.from(b.edgeLength)).toEqual(Array.from(a.edgeLength));
    // Endpoint mode (the default) reads the same nodes.
    const endpoints = buildLineNetwork(xyz, {junctionTolerance: 0});
    expect(Array.from(endpoints.nodePositions)).toEqual(
      Array.from(buildLineNetwork(xy, {junctionTolerance: 0}).nodePositions)
    );
    const geometry = getEdgeGeometry(b, xyz, 2);
    expect(Array.from(geometry)).toEqual([0.001, 0, 0.001, 0.001]);
  });

  it('defaults the rows to path indices and skips paths with one vertex', () => {
    const {positions, pathIndices} = makeLines([5, 5], [0, 0, 0.001, 0]);
    const net = buildLineNetwork({positions, pathIndices});
    expect(net.edgeCount).toBe(1);
    expect(Array.from(net.edgeRow)).toEqual([1]);
    expect(Array.from(net.edgePath)).toEqual([1]);
  });

  it('rejects bad input', () => {
    const input = makeLines([0, 0, 0.001, 0]);
    expect(() => buildLineNetwork(input, {snapTolerance: 0})).toThrow(/snapTolerance/);
    expect(() => buildLineNetwork(input, {junctionTolerance: -1})).toThrow(/junctionTolerance/);
    expect(() =>
      buildLineNetwork({...input, positions: {value: input.positions.value, size: 1}})
    ).toThrow(/size/);
    expect(() =>
      buildLineNetwork({...input, pathIndices: {value: Uint32Array.of(0, 3), size: 1}})
    ).toThrow(/pathIndices/);
    expect(() =>
      buildLineNetwork({...input, positions: {value: Float64Array.of(0, 0, 0, 91), size: 2}})
    ).toThrow(/positions/);
    expect(() => buildLineNetwork(input, {pathWeightFactors: []})).toThrow(/pathWeightFactors/);
  });
});

describe('brute-force reference', () => {
  it('gives the same nodes and edges as an all-pairs snap on 10,000 jittered segments', () => {
    // Random segments between neighbouring junctions of a 20 m lattice; endpoint copies are
    // jittered by up to 0.3 m, and the tolerance is 1 m, so every snap is unambiguous.
    const SEGMENTS = 10_000;
    const STEP = 20 * ONE_METRE;
    const random = makeRandom(99);
    const jitter = () => (random() - 0.5) * 0.6 * ONE_METRE;
    const paths: number[][] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const x = Math.floor(random() * 60);
      const y = Math.floor(random() * 60);
      const horizontal = random() < 0.5;
      const lat0 = 52 + y * STEP;
      paths.push([
        x * STEP * 1.6 + jitter(),
        lat0 + jitter(),
        (x + (horizontal ? 1 : 0)) * STEP * 1.6 + jitter(),
        lat0 + (horizontal ? 0 : STEP) + jitter()
      ]);
    }
    const net = buildLineNetwork(makeLines(...paths), {snapTolerance: 1});

    // Reference: compare each endpoint with every earlier node (haversine distance).
    const nodes: number[] = [];
    const nodeOf = (lon: number, lat: number) => {
      for (let n = 0; n < nodes.length; n += 2) {
        if (haversineDistance(nodes[n], nodes[n + 1], lon, lat) <= 1) return n / 2;
      }
      nodes.push(lon, lat);
      return nodes.length / 2 - 1;
    };
    const edges = paths.map(p => `${nodeOf(p[0], p[1])}-${nodeOf(p[2], p[3])}`);
    expect(net.nodeCount).toBe(nodes.length / 2);
    expect(Array.from(net.edgeSource, (s, e) => `${s}-${net.edgeTarget[e]}`)).toEqual(edges);
  });
});

describe('T-junctions', () => {
  // Line 0 runs east along the equator; line 1 ends 10 m north of its middle.
  const GAP = 10 * ONE_METRE;
  const tee = () => makeLines([0, 0, 0.002, 0], [0.001, GAP, 0.001, 0.001]);

  it('joins a dangling end to the interior of a line and splits that line there', () => {
    const net = buildLineNetwork(tee(), {junctionTolerance: 20});
    expect(net.nodeCount).toBe(4);
    expect(net.edgeCount).toBe(3);
    expect(Array.from(net.edgeRow)).toEqual([0, 0, 1]);
    // Both pieces of line 0 keep its one segment (vertices 0 to 1), cut at half way.
    expect(Array.from(net.edgeVertexStart)).toEqual([0, 0, 2]);
    expect(Array.from(net.edgeVertexEnd)).toEqual([1, 1, 3]);
    expect(Array.from(net.edgeStartFraction)).toEqual([0, 0.5, 0]);
    expect(Array.from(net.edgeEndFraction)).toEqual([0.5, 1, 1]);
    expect(getEdgePointCount(net, 0)).toBe(2);
    expect(Array.from(getEdgeGeometry(net, tee(), 0))).toEqual([0, 0, 0.001, 0]);
    // The split node is the node of the dangling end, with degree 3.
    expect(net.edgeTarget[0]).toBe(net.edgeSource[1]);
    expect(net.edgeSource[2]).toBe(net.edgeTarget[0]);
    const whole = haversineDistance(0, 0, 0.002, 0);
    expect(net.edgeLength[0] + net.edgeLength[1]).toBeCloseTo(whole, 6);
    // The 10 m gap adds to the dangling edge.
    expect(net.edgeLength[2]).toBeCloseTo(haversineDistance(0.001, GAP, 0.001, 0.001) + 10, 1);
  });

  it('joins at the tolerance and not beyond it', () => {
    expect(buildLineNetwork(tee(), {junctionTolerance: 10.001}).edgeCount).toBe(3);
    expect(buildLineNetwork(tee(), {junctionTolerance: 9.999}).edgeCount).toBe(2);
    // The default is the snap tolerance (1 m), so a 10 m gap stays open.
    expect(buildLineNetwork(tee()).nodeCount).toBe(4);
    expect(buildLineNetwork(tee()).edgeCount).toBe(2);
    expect(buildLineNetwork(tee(), {snapTolerance: 12}).edgeCount).toBe(3);
    expect(buildLineNetwork(tee(), {junctionTolerance: 0, snapTolerance: 12}).edgeCount).toBe(2);
  });

  it('joins only dangling ends, and never a line to itself', () => {
    // Lines 1 and 2 share an end (snapped, 0.9 m apart) 0.5 m north of line 0: that end is a
    // junction, not a dangle. Line 0 is nearer to the end of line 1 than line 2 is.
    const shared = makeLines(
      [0, 0, 0.002, 0],
      [0.001, 0.5 * ONE_METRE, 0.001, 0.001],
      [0.001 + 0.9 * ONE_METRE, 0.5 * ONE_METRE, 0.0015, 0.001]
    );
    const net = buildLineNetwork(shared, {junctionTolerance: 20});
    expect(net.edgeCount).toBe(3);
    expect(net.nodeCount).toBe(5);
    // A hook: the end of the line is 5 m from its own first segment.
    const hook = makeLines([0, 0, 0.002, 0, 0.002, 0.001, 0.001, 5 * ONE_METRE]);
    const self = buildLineNetwork(hook, {junctionTolerance: 20});
    expect(self.edgeCount).toBe(1);
    expect(self.nodeCount).toBe(2);
  });

  it('joins the node itself when the nearest point is a node vertex', () => {
    // The west end of line 1 is 15 m east of the east end of line 0, on the same axis.
    const input = makeLines([0, 0, 0.001, 0], [0.001 + 15 * ONE_METRE, 0, 0.002, 0]);
    expect(buildLineNetwork(input).nodeCount).toBe(4);
    const net = buildLineNetwork(input, {junctionTolerance: 20});
    expect(net.nodeCount).toBe(3);
    expect(net.edgeCount).toBe(2);
    expect(net.edgeTarget[0]).toBe(net.edgeSource[1]);
  });

  it('orders several cuts on one segment by position', () => {
    // Two dangling lines end 5 m north of line 0; the first one listed is the farther east.
    const net = buildLineNetwork(
      makeLines(
        [0, 0, 0.004, 0],
        [0.003, 5 * ONE_METRE, 0.003, 0.001],
        [0.001, 5 * ONE_METRE, 0.001, 0.001]
      ),
      {junctionTolerance: 20}
    );
    expect(net.edgeCount).toBe(5);
    const expected = [0, 0.25, 0.75, 1];
    for (let e = 0; e < 3; e++) {
      expect(net.edgeStartFraction[e]).toBeCloseTo(expected[e], 12);
      expect(net.edgeEndFraction[e]).toBeCloseTo(expected[e + 1], 12);
    }
    for (let e = 0; e < 3; e++) expect(net.edgeLength[e]).toBeGreaterThan(100);
  });

  it('matches a brute-force nearest-segment search at 60° N', () => {
    // Random lines of 30 to 300 m; dangling ends join the nearest other line within 25 m.
    const TOLERANCE = 25;
    const random = makeRandom(4242);
    const kx = Math.cos((60 * Math.PI) / 180);
    const paths: number[][] = [];
    for (let i = 0; i < 1500; i++) {
      const lon = 10 + (random() * 4000 * ONE_METRE) / kx;
      const lat = 60 + random() * 4000 * ONE_METRE;
      const angle = random() * Math.PI * 2;
      const length = (30 + random() * 270) * ONE_METRE;
      paths.push([lon, lat, lon + (Math.cos(angle) * length) / kx, lat + Math.sin(angle) * length]);
    }
    // 3,000 short lines far away make the mean segment, and so the grid cell, about the
    // tolerance: a line then crosses many cells and rows.
    const far = Array.from({length: 3000}, (_, i) => [20 + i * 0.001, 0, 20 + i * 0.001, 0.0001]);
    const net = buildLineNetwork(makeLines(...paths, ...far), {
      snapTolerance: 0.01,
      junctionTolerance: TOLERANCE
    });

    // Reference: every end (none is within 0.01 m of another) against every other segment.
    let splitCount = 0;
    let gapSum = 0;
    for (let p = 0; p < paths.length; p++) {
      for (let end = 0; end < 2; end++) {
        const lon = paths[p][2 * end];
        const lat = paths[p][2 * end + 1];
        const k = 111_195.08 * Math.cos((lat * Math.PI) / 180);
        let best = Infinity;
        let bestT = 0;
        for (let q = 0; q < paths.length; q++) {
          if (q === p) continue;
          const ax = (paths[q][0] - lon) * k;
          const ay = (paths[q][1] - lat) * 111_195.08;
          const ux = (paths[q][2] - lon) * k - ax;
          const uy = (paths[q][3] - lat) * 111_195.08 - ay;
          const t = Math.min(1, Math.max(0, -(ax * ux + ay * uy) / (ux * ux + uy * uy)));
          const d = Math.hypot(ax + t * ux, ay + t * uy);
          if (d < best) {
            best = d;
            bestT = t;
          }
        }
        if (best <= TOLERANCE) {
          gapSum += best;
          if (bestT > 0 && bestT < 1) splitCount++;
        }
      }
    }
    expect(splitCount).toBeGreaterThan(100);
    expect(net.edgeCount).toBe(paths.length + far.length + splitCount);
    let lengthSum = 0;
    for (let e = 0; e < net.edgeCount; e++) lengthSum += net.edgeLength[e];
    let lineSum = 0;
    for (const p of [...paths, ...far]) lineSum += haversineDistance(p[0], p[1], p[2], p[3]);
    expect(lengthSum).toBeCloseTo(lineSum + gapSum, -1);
  });

  it('connects ends near long segments far from any vertex', () => {
    // At 43.15° N: a 1,019 m segment; a line ends 2 m south of it, 326 m from its west vertex.
    // A 14 km segment; a line ends 17 m from it, 1,050 m from a vertex. No vertex is within
    // the 50 m snap tolerance.
    const lat = 43.15;
    const kx = Math.cos((lat * Math.PI) / 180);
    const east = (metres: number) => (metres * ONE_METRE) / kx;
    const input = makeLines(
      [-77.6162, lat, -77.6162 + east(1019), lat, -77.6162 + east(1019) + east(14_000), lat],
      [-77.6162 + east(326), lat - 2 * ONE_METRE, -77.6162 + east(326), lat - 0.01],
      [-77.6162 + east(1019 + 1050), lat + 17 * ONE_METRE, -77.6162 + east(2069), lat + 0.02]
    );
    const options = {snapTolerance: 50, splitAtInteriorVertices: true};
    const before = buildLineNetwork(input, {...options, junctionTolerance: 0});
    const after = buildLineNetwork(input, options);
    const reach = (net: LineNetwork) => {
      const from = net.edgeTarget[net.edgeCount - 2];
      const to = net.edgeTarget[net.edgeCount - 1];
      return dijkstra(buildLineNetworkAdjacency(net), net.edgeWeight, from).distances[to];
    };
    expect(reach(before)).toBe(Infinity);
    const expected =
      haversineDistance(-77.6162 + east(326), lat - 0.01, -77.6162 + east(326), lat) +
      1743 +
      haversineDistance(-77.6162 + east(2069), lat, -77.6162 + east(2069), lat + 0.02);
    expect(reach(after)).toBeCloseTo(expected, -1);
  });

  it('places the split point and the gap where @turf/nearest-point-on-line finds them', () => {
    // One long line with bends at 45° N. On each of its 40 segments, a short line ends within
    // 30 m of it, off its vertices. The short lines are far apart, so each joins the long line.
    const random = makeRandom(31);
    const spine: number[] = [];
    for (let i = 0; i <= 40; i++) spine.push(5 + i * 0.002, 45 + (i % 2) * 0.0015);
    const spokes: number[][] = [];
    for (let s = 0; s < 40; s++) {
      const t = 0.2 + random() * 0.6;
      const lon = spine[2 * s] + t * (spine[2 * s + 2] - spine[2 * s]);
      const lat = spine[2 * s + 1] + t * (spine[2 * s + 3] - spine[2 * s + 1]);
      const offset = (2 + random() * 28) * ONE_METRE * (random() < 0.5 ? -1 : 1);
      spokes.push([lon, lat + offset, lon, lat + offset * 100]);
    }
    const input = makeLines(spine, ...spokes);
    const net = buildLineNetwork(input, {junctionTolerance: 60});
    const line = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: Array.from({length: spine.length / 2}, (_, i) => [
          spine[2 * i],
          spine[2 * i + 1]
        ])
      }
    };
    // The split point of each cut: the last point of the long-line edge that ends there.
    const splitPoints = new Map<number, number[]>();
    for (let e = 0; e < net.edgeCount; e++) {
      if (net.edgePath[e] !== 0 || net.edgeEndFraction[e] === 1) continue;
      const geometry = getEdgeGeometry(net, input, e);
      splitPoints.set(net.edgeTarget[e], Array.from(geometry.subarray(geometry.length - 2)));
    }
    expect(splitPoints.size).toBe(40);
    let checked = 0;
    for (let e = 0; e < net.edgeCount; e++) {
      const path = net.edgePath[e];
      if (path === 0) continue;
      const [lon, lat] = spokes[path - 1];
      const nearest = turfNearestPointOnLine(line, point(lon, lat), {units: 'meters'});
      const [nearLon, nearLat] = nearest.geometry.coordinates;
      // The short-line edge starts at the node of the cut.
      const [splitLon, splitLat] = splitPoints.get(net.edgeSource[e])!;
      expect(haversineDistance(splitLon, splitLat, nearLon, nearLat)).toBeLessThan(0.05);
      expect(nearest.properties.segmentIndex).toBe(path - 1);
      const spokeLength = haversineDistance(lon, lat, spokes[path - 1][2], spokes[path - 1][3]);
      expect(net.edgeLength[e] - spokeLength).toBeCloseTo(nearest.properties.pointDistance, 1);
      checked++;
    }
    expect(checked).toBe(40);
    expect(net.edgeCount).toBe(1 + 40 + 40);
  });
});

describe('crossings', () => {
  // Two lines cross at a shallow angle at (0, 0) with no shared vertex: they stay within 2 m of
  // each other for about 200 m. Far away, 40 short lines make the mean segment (and so the grid
  // cell) small, so the crossing pair shares many cells and must still give one crossing.
  const cross = () =>
    makeLines(
      [-0.001, -0.00001, 0.001, 0.00001],
      [-0.001, 0.00001, 0.001, -0.00001],
      // Starts 1.45 m north of line 0: its extension crosses both lines, the segment does not.
      [0.0005, 2 * ONE_METRE, 0.0005, 0.0005],
      ...Array.from({length: 40}, (_, i) => [1 + i * 0.001, 1, 1 + i * 0.001 + 3 * ONE_METRE, 1])
    );

  it('adds a node at a crossing only with splitAtCrossings', () => {
    const plain = buildLineNetwork(cross());
    expect(plain.nodeCount).toBe(86);
    expect(plain.edgeCount).toBe(43);
    const net = buildLineNetwork(cross(), {splitAtCrossings: true});
    expect(net.nodeCount).toBe(87);
    expect(net.edgeCount).toBe(45);
    const crossing = net.edgeTarget[0];
    expect(net.nodePositions[2 * crossing]).toBeCloseTo(0, 12);
    expect(net.nodePositions[2 * crossing + 1]).toBeCloseTo(0, 12);
    expect(net.edgeEndFraction[0]).toBeCloseTo(0.5, 6);
    expect(net.edgeStartFraction[1]).toBeCloseTo(0.5, 6);
    expect(net.edgeEndFraction[2]).toBeCloseTo(0.5, 6);
    expect([net.edgeSource[1], net.edgeTarget[2], net.edgeSource[3]]).toEqual([
      crossing,
      crossing,
      crossing
    ]);
  });
});

describe('directed networks', () => {
  // A main line flows east; a branch flows south into its middle (a T-junction).
  const flow = () => makeLines([0, 0, 0.002, 0], [0.001, 0.001, 0.001, 5 * ONE_METRE]);

  it('keeps path direction and lists each edge one way', () => {
    const net = buildLineNetwork(flow(), {directed: true, junctionTolerance: 10});
    expect(net.directed).toBe(true);
    expect(net.edgeCount).toBe(3);
    const undirected = buildLineNetwork(flow(), {junctionTolerance: 10});
    expect(undirected.directed).toBe(false);
    expect(Array.from(net.edgeSource)).toEqual(Array.from(undirected.edgeSource));
    expect(Array.from(net.edgeTarget)).toEqual(Array.from(undirected.edgeTarget));

    const adjacency = buildLineNetworkAdjacency(net);
    expect(adjacency.directed).toBe(true);
    expect(adjacency.edges.length).toBe(3);
    expect(buildLineNetworkAdjacency(net, {directed: false}).edges.length).toBe(6);
    for (let n = 0; n < net.nodeCount; n++) {
      for (let slot = adjacency.offsets[n]; slot < adjacency.offsets[n + 1]; slot++) {
        expect(net.edgeSource[adjacency.edges[slot]]).toBe(n);
        expect(net.edgeTarget[adjacency.edges[slot]]).toBe(adjacency.neighbors[slot]);
      }
    }
  });

  it('routes downstream and not upstream', () => {
    const input = flow();
    const net = buildLineNetwork(input, {directed: true, junctionTolerance: 10});
    const adjacency = buildLineNetworkAdjacency(net);
    const branchTop = net.edgeSource[2];
    const mouth = net.edgeTarget[1];
    const west = net.edgeSource[0];
    const down = dijkstra(adjacency, net.edgeWeight, branchTop);
    expect(down.distances[mouth]).toBeLessThan(Infinity);
    expect(down.distances[west]).toBe(Infinity);
    const route = getRouteEdges(adjacency, net.edgeWeight, down.predecessors, branchTop, mouth)!;
    expect(Array.from(route)).toEqual([2, 1]);
    const geometry = getRouteGeometry(net, input, route, branchTop);
    expect(Array.from(geometry)).toEqual([0.001, 0.001, 0.001, 5 * ONE_METRE, 0.001, 0, 0.002, 0]);
    const up = dijkstra(adjacency, net.edgeWeight, mouth);
    expect(up.distances[branchTop]).toBe(Infinity);
    expect(getRouteEdges(adjacency, net.edgeWeight, up.predecessors, mouth, branchTop)).toBeNull();
  });
});

describe('edge weights', () => {
  const GAP = 10 * ONE_METRE;
  const tee = () => makeLines([0, 0, 0.002, 0], [0.001, GAP, 0.001, 0.001]);

  it('uses the length as the default weight', () => {
    const net = buildLineNetwork(tee(), {junctionTolerance: 20});
    expect(Array.from(net.edgeWeight)).toEqual(Array.from(net.edgeLength, Math.fround));
  });

  it('multiplies the length by the factor of its path', () => {
    const net = buildLineNetwork(tee(), {junctionTolerance: 20, pathWeightFactors: [2, 0.5]});
    expect(net.edgeWeight[0]).toBe(Math.fround(net.edgeLength[0] * 2));
    expect(net.edgeWeight[1]).toBe(Math.fround(net.edgeLength[1] * 2));
    expect(net.edgeWeight[2]).toBe(Math.fround(net.edgeLength[2] * 0.5));
  });

  it('calls the weight callback with the path, the fractions along it and the length', () => {
    const calls: number[][] = [];
    const net = buildLineNetwork(tee(), {
      junctionTolerance: 20,
      edgeWeight: (path, startFraction, endFraction, length) => {
        calls.push([path, startFraction, endFraction, length]);
        return path * 1000 + endFraction * 100;
      }
    });
    expect(calls.length).toBe(3);
    expect(calls.map(c => c[0])).toEqual([0, 0, 1]);
    expect(calls[0][1]).toBe(0);
    expect(calls[0][2]).toBeCloseTo(0.5, 12);
    expect(calls[1][1]).toBeCloseTo(0.5, 12);
    expect(calls[1][2]).toBe(1);
    // The dangling edge covers its whole path; the gap counts in the length, not the fractions.
    expect([calls[2][1], calls[2][2]]).toEqual([0, 1]);
    for (let e = 0; e < 3; e++) expect(calls[e][3]).toBe(net.edgeLength[e]);
    expect(Array.from(net.edgeWeight)).toEqual([50, 100, 1100].map(value => Math.fround(value)));
  });

  it('gives fractions by length on paths with several vertices', () => {
    // Three segments of 1, 2 and 1 units east; the vertex at 3 is shared with a crossing line.
    const unit = 0.001;
    const input = makeLines(
      [0, 0, unit, 0, 3 * unit, 0, 4 * unit, 0],
      [3 * unit, -unit, 3 * unit, 0, 3 * unit, unit]
    );
    const fractions: number[] = [];
    buildLineNetwork(input, {
      splitAtInteriorVertices: true,
      edgeWeight: (path, startFraction, endFraction) => {
        if (path === 0) fractions.push(startFraction, endFraction);
        return 1;
      }
    });
    expect(fractions.length).toBe(4);
    expect(fractions[0]).toBe(0);
    expect(fractions[1]).toBeCloseTo(0.75, 9);
    expect(fractions[2]).toBeCloseTo(0.75, 9);
    expect(fractions[3]).toBe(1);
  });

  it('changes the route when the weights change', () => {
    // Two parallel lines between the same ends: the shorter one wins until its factor is high.
    const input = makeLines([0, 0, 0.001, 0], [0, 0, 0, 0.0005, 0.001, 0.0005, 0.001, 0]);
    const route = (factors?: number[]) => {
      const net = buildLineNetwork(input, {pathWeightFactors: factors});
      const adjacency = buildLineNetworkAdjacency(net);
      const source = net.edgeSource[0];
      const target = net.edgeTarget[0];
      const result = dijkstra(adjacency, net.edgeWeight, source);
      return Array.from(
        getRouteEdges(adjacency, net.edgeWeight, result.predecessors, source, target)!
      );
    };
    expect(route()).toEqual([0]);
    expect(route([3, 1])).toEqual([1]);
  });

  it('rejects negative weights and two weight options', () => {
    expect(() => buildLineNetwork(tee(), {edgeWeight: () => -1})).toThrow(/weights/);
    expect(() => buildLineNetwork(tee(), {edgeWeight: () => NaN})).toThrow(/weights/);
    expect(() => buildLineNetwork(tee(), {edgeWeight: () => 1, pathWeightFactors: [1, 1]})).toThrow(
      /not both/
    );
  });
});

describe('distance', () => {
  it('matches @turf/distance for haversine distance', () => {
    const random = makeRandom(5);
    for (let i = 0; i < 200; i++) {
      const lon1 = random() * 360 - 180;
      const lat1 = random() * 180 - 90;
      const lon2 = lon1 + (random() - 0.5) * 2;
      const lat2 = Math.max(-90, Math.min(90, lat1 + (random() - 0.5) * 2));
      const expected = turfDistance(point(lon1, lat1), point(lon2, lat2), {units: 'meters'});
      expect(haversineDistance(lon1, lat1, lon2, lat2)).toBeCloseTo(expected, 6);
    }
  });

  it('measures edge lengths and junction gaps with a custom distance', () => {
    const GAP = 10 * ONE_METRE;
    const input = makeLines([0, 0, 0.002, 0], [0.001, GAP, 0.001, 0.001]);
    const calls: number[] = [];
    // Twice the haversine distance: every length and the gap double.
    const net = buildLineNetwork(input, {
      junctionTolerance: 20,
      distance: (lon1, lat1, lon2, lat2) => {
        calls.push(lon1);
        return 2 * haversineDistance(lon1, lat1, lon2, lat2);
      }
    });
    const plain = buildLineNetwork(input, {junctionTolerance: 20});
    expect(calls.length).toBeGreaterThan(0);
    for (let e = 0; e < net.edgeCount; e++) {
      expect(net.edgeLength[e]).toBeCloseTo(2 * plain.edgeLength[e], 6);
    }
    // The tolerance stays in metres on the ground: the snap and join do not use the callback.
    expect(net.nodeCount).toBe(plain.nodeCount);
    expect(net.edgeCount).toBe(plain.edgeCount);
  });
});

describe('route reconstruction', () => {
  it('follows predecessors and returns the original geometry from source to target', () => {
    // A square with a long detour: 0-1 direct is longer than 0-2-1.
    const input = makeLines(
      [0, 0, 0, 0.0005, 0, 0.001, 0.0005, 0.0015, 0.001, 0.001], // row 0: long bent line a->b
      [0, 0, 0.001, 0], // row 1: a->c
      [0.001, 0, 0.001, 0.001] // row 2: c->b
    );
    const net = buildLineNetwork(input);
    const adjacency = buildLineNetworkAdjacency(net);
    const a = net.edgeSource[1];
    const b = net.edgeTarget[2];
    const result = dijkstra(adjacency, net.edgeWeight, a);
    const edges = getRouteEdges(adjacency, net.edgeWeight, result.predecessors, a, b)!;
    expect(Array.from(edges, e => net.edgeRow[e])).toEqual([1, 2]);
    expect(result.distances[b]).toBeCloseTo(net.edgeLength[1] + net.edgeLength[2], 1);
    expect(
      Array.from(getRouteEdges(adjacency, net.edgeWeight, result.predecessors, a, a)!)
    ).toEqual([]);
    // Reverse direction: route b -> a walks the same edges backwards.
    const back = dijkstra(adjacency, net.edgeWeight, b);
    const backEdges = getRouteEdges(adjacency, net.edgeWeight, back.predecessors, b, a)!;
    const path = getRouteGeometry(net, input, backEdges, b);
    expect(Array.from(path)).toEqual([0.001, 0.001, 0.001, 0, 0, 0]);
  });

  it('draws a route through a split edge from the split point', () => {
    const gap = 10 * ONE_METRE;
    const input = makeLines([0, 0, 0.002, 0], [0.001, gap, 0.001, 0.001]);
    const net = buildLineNetwork(input, {junctionTolerance: 20});
    const adjacency = buildLineNetworkAdjacency(net);
    const west = net.edgeSource[0];
    const east = net.edgeTarget[1];
    const top = net.edgeTarget[2];
    const route = (from: number, to: number) => {
      const result = dijkstra(adjacency, net.edgeWeight, from);
      const edges = getRouteEdges(adjacency, net.edgeWeight, result.predecessors, from, to)!;
      return Array.from(getRouteGeometry(net, input, edges, from));
    };
    expect(route(west, top)).toEqual([0, 0, 0.001, 0, 0.001, gap, 0.001, 0.001]);
    expect(route(top, east)).toEqual([0.001, 0.001, 0.001, gap, 0.001, 0, 0.002, 0]);
    expect(route(west, east)).toEqual([0, 0, 0.001, 0, 0.002, 0]);
  });

  it('takes the cheapest of two parallel edges', () => {
    const net = buildLineNetwork(makeLines([0, 0, 0, 0.001, 0.001, 0.001], [0, 0, 0.001, 0.001]));
    expect(net.edgeCount).toBe(2);
    const adjacency = buildLineNetworkAdjacency(net);
    const s = net.edgeSource[0];
    const t = net.edgeTarget[0];
    const result = dijkstra(adjacency, net.edgeWeight, s);
    expect(
      Array.from(getRouteEdges(adjacency, net.edgeWeight, result.predecessors, s, t)!)
    ).toEqual([1]);
  });

  it('writes edge geometry into a caller array at an offset', () => {
    const input = makeLines([0, 0, 0.001, 0, 0.002, 0.001]);
    const net = buildLineNetwork(input);
    const target = new Float64Array(8).fill(-1);
    expect(getEdgeGeometry(net, input, 0, target, 2)).toBe(target);
    expect(Array.from(target)).toEqual([-1, -1, 0, 0, 0.001, 0, 0.002, 0.001]);
  });
});

describe('dijkstra oracle', () => {
  it('matches a brute-force Bellman-Ford oracle on a random weighted graph', () => {
    const nodeCount = 400;
    const edgeCount = 2000;
    const random = makeRandom(17);
    const source = new Uint32Array(edgeCount);
    const target = new Uint32Array(edgeCount);
    const weight = new Float32Array(edgeCount);
    for (let e = 0; e < edgeCount; e++) {
      // A ring keeps the graph connected; the other edges are random chords.
      source[e] = e < nodeCount ? e : Math.floor(random() * nodeCount);
      target[e] = e < nodeCount ? (e + 1) % nodeCount : Math.floor(random() * nodeCount);
      weight[e] = 1 + random() * 999;
    }
    const network = {nodeCount, edgeCount, edgeSource: source, edgeTarget: target, directed: false};
    const adjacency = buildLineNetworkAdjacency(network as LineNetwork);
    const result = dijkstra(adjacency, weight, 5);
    const expected = new Float32Array(nodeCount).fill(Infinity);
    expected[5] = 0;
    for (let round = 0; round < nodeCount; round++) {
      for (let e = 0; e < edgeCount; e++) {
        const [s, t, w] = [source[e], target[e], weight[e]];
        expected[t] = Math.min(expected[t], Math.fround(expected[s] + w));
        expected[s] = Math.min(expected[s], Math.fround(expected[t] + w));
      }
    }
    expect(Array.from(result.distances)).toEqual(Array.from(expected));
  });
});
