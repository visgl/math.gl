// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A flat column of numbers with a fixed number of values for each element. */
export type LineNetworkFixedSizeList = {
  /** The values, `size` for each element. */
  value: ArrayLike<number>;
  /** The number of values for each element. */
  size: number;
};

/**
 * Flat binary lines, in the shape of a loaders.gl binary line geometry.
 * Positions are longitude and latitude in degrees. Values after the first two of each
 * position (Z, M) are ignored.
 */
export type LineNetworkLines = {
  /** Interleaved positions, `positions.size` values for each vertex (2 or more). */
  positions: LineNetworkFixedSizeList;
  /** First vertex of each path, followed by the total vertex count (`pathCount + 1` values). */
  pathIndices: LineNetworkFixedSizeList;
  /** Source table row of each path. Defaults to the path index. */
  pathRows?: ArrayLike<number>;
};

/** Measures the distance in metres between two longitude, latitude points in degrees. */
export type LineNetworkDistance = (
  longitude1: number,
  latitude1: number,
  longitude2: number,
  latitude2: number
) => number;

/**
 * Returns the routing weight of one edge.
 * @param pathIndex - Path that the edge comes from.
 * @param startFraction - Start of the edge along its path, as a fraction of the path length.
 * @param endFraction - End of the edge along its path, as a fraction of the path length.
 * @param lengthMetres - Edge length in metres, with the gap of a joined dangling end.
 */
export type LineNetworkEdgeWeight = (
  pathIndex: number,
  startFraction: number,
  endFraction: number,
  lengthMetres: number
) => number;

/** Options of `buildLineNetwork`. */
export type BuildLineNetworkOptions = {
  /** Vertices closer than this many metres join into one node. Must be positive. Default 1. */
  snapTolerance?: number;
  /**
   * A dangling path end (an end that no other vertex shares) joins the nearest point on another
   * path within this many metres, and that path splits there. The gap adds to the length of
   * the dangling edge. 0 turns it off. Default: `snapTolerance`.
   */
  junctionTolerance?: number;
  /** Also split paths at interior vertices that another vertex shares. Default false. */
  splitAtSharedVertices?: boolean;
  /**
   * Add a node where two segments cross with no shared vertex, and split both. Default false.
   * This also joins lines that cross with no connection, such as a bridge over a road.
   */
  splitAtCrossings?: boolean;
  /** Edges follow the path direction and adjacency is one-way. Default false. */
  directed?: boolean;
  /** Measures edge lengths and junction gaps. Default `haversineDistance`. */
  distance?: LineNetworkDistance;
  /** Multiplies the length of every edge of a path to give its weight. One value for each path. */
  pathWeightFactors?: ArrayLike<number>;
  /** Returns the weight of each edge. Replaces the length times `pathWeightFactors`. */
  edgeWeight?: LineNetworkEdgeWeight;
};

/** A graph built from lines. Every column is a typed array. */
export type LineNetwork = {
  /** True when the edges are one-way, in path direction. */
  directed: boolean;
  /** Number of nodes. */
  nodeCount: number;
  /** Number of edges. */
  edgeCount: number;
  /** Interleaved longitude, latitude of each node in degrees. */
  nodePositions: Float64Array;
  /** Node at the start of each edge, in path direction. */
  edgeSource: Uint32Array;
  /** Node at the end of each edge, in path direction. */
  edgeTarget: Uint32Array;
  /** Length of each edge in metres, with the gap of a joined dangling end. */
  edgeLength: Float64Array;
  /** Routing weight of each edge. The length unless a weight option is given. */
  edgeWeight: Float32Array;
  /** Path that each edge comes from. */
  edgePath: Uint32Array;
  /** Source table row of each edge (`pathRows` of its path, or the path index). */
  edgeRow: Uint32Array;
  /** First vertex of each edge in `positions` (a vertex index, not a value index). */
  edgeVertexStart: Uint32Array;
  /** Last vertex of each edge, inclusive. */
  edgeVertexEnd: Uint32Array;
  /**
   * Where each edge starts on its first segment (`edgeVertexStart` to the next vertex), as a
   * fraction of that segment. 0 unless a junction or a crossing split the segment.
   */
  edgeStartFraction: Float64Array;
  /** Where each edge ends on its last segment (the vertex before `edgeVertexEnd` to it). 1 unless split. */
  edgeEndFraction: Float64Array;
};

/** Mean radius of the Earth in metres (IUGG). */
const EARTH_RADIUS = 6371008.8;
/** Metres of one degree of latitude on the mean sphere. */
const METRES_PER_DEGREE = (EARTH_RADIUS * Math.PI) / 180;
/** Degrees to radians. */
const DEGREES_TO_RADIANS = Math.PI / 180;
/** Marks an empty slot, cluster or segment. */
const EMPTY = -1;

/** Great-circle distance in metres between two longitude, latitude points (haversine, mean radius). */
export function haversineDistance(
  longitude1: number,
  latitude1: number,
  longitude2: number,
  latitude2: number
): number {
  const phi1 = latitude1 * DEGREES_TO_RADIANS;
  const phi2 = latitude2 * DEGREES_TO_RADIANS;
  const sinHalfLat = Math.sin((phi2 - phi1) / 2);
  const sinHalfLon = Math.sin(((longitude2 - longitude1) * DEGREES_TO_RADIANS) / 2);
  const h = sinHalfLat * sinHalfLat + Math.cos(phi1) * Math.cos(phi2) * sinHalfLon * sinHalfLon;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Open-addressing slot of an integer cell key. Inserts the key when `insert` is set. */
function findCellSlot(
  slotKeys: Int32Array,
  slotHeads: Int32Array,
  slotMask: number,
  cellX: number,
  cellY: number,
  insert: boolean
): number {
  let slot = (Math.imul(cellX, 0x9e3779b1) ^ Math.imul(cellY, 0x85ebca77)) & slotMask;
  for (;;) {
    if (slotHeads[slot] === EMPTY) {
      if (!insert) return EMPTY;
      slotKeys[slot * 2] = cellX;
      slotKeys[slot * 2 + 1] = cellY;
      return slot;
    }
    if (slotKeys[slot * 2] === cellX && slotKeys[slot * 2 + 1] === cellY) return slot;
    slot = (slot + 1) & slotMask;
  }
}

/** Smallest power of two, at least 16, that is not less than `count`. */
function getHashCapacity(count: number): number {
  let capacity = 16;
  while (capacity < count) capacity *= 2;
  return capacity;
}

/**
 * Snaps points into clusters on a grid in a local metric frame.
 * A point joins the first cluster within the tolerance (own cell first, then the 8 neighbours),
 * so the result is deterministic for a given input order.
 */
class PointSnapper {
  /** Longitude of each cluster (its first point). */
  readonly clusterX: Float64Array;
  /** Latitude of each cluster (its first point). */
  readonly clusterY: Float64Array;
  /** Number of clusters. */
  clusterCount = 0;
  /** Snap distance and cell size in metres. */
  private readonly tolerance: number;
  /** Square of the tolerance. */
  private readonly toleranceSquared: number;
  /** Cell key of each slot, two values for each slot. */
  private readonly slotKeys: Int32Array;
  /** First cluster of the cell of each slot, or EMPTY. */
  private readonly slotHeads: Int32Array;
  /** Slot count minus one. */
  private readonly slotMask: number;
  /** Next cluster in the same cell, or EMPTY. */
  private readonly nextInCell: Int32Array;

  /** Makes a snapper for at most `maxPoints` clusters. */
  constructor(maxPoints: number, tolerance: number) {
    this.tolerance = tolerance;
    this.toleranceSquared = tolerance * tolerance;
    this.clusterX = new Float64Array(maxPoints);
    this.clusterY = new Float64Array(maxPoints);
    this.nextInCell = new Int32Array(maxPoints);
    const capacity = getHashCapacity(maxPoints * 2);
    this.slotMask = capacity - 1;
    this.slotKeys = new Int32Array(capacity * 2);
    this.slotHeads = new Int32Array(capacity).fill(EMPTY);
  }

  /** Returns the cluster of the point, and makes a new cluster when none is in range. */
  snap(lon: number, lat: number): number {
    const cellY = Math.floor((lat * METRES_PER_DEGREE) / this.tolerance);
    let found = EMPTY;
    // Each latitude row has its own longitude scale, so compute the column in every row searched.
    for (let dy = 0; found === EMPTY && dy < 3; dy++) {
      const row = cellY + (dy === 0 ? 0 : dy === 1 ? -1 : 1);
      const column = this.getColumn(lon, row);
      found = this.findInCell(column, row, lon, lat);
      if (found === EMPTY) found = this.findInCell(column - 1, row, lon, lat);
      if (found === EMPTY) found = this.findInCell(column + 1, row, lon, lat);
    }
    if (found !== EMPTY) return found;

    const cluster = this.clusterCount++;
    this.clusterX[cluster] = lon;
    this.clusterY[cluster] = lat;
    const slot = findCellSlot(
      this.slotKeys,
      this.slotHeads,
      this.slotMask,
      this.getColumn(lon, cellY),
      cellY,
      true
    );
    this.nextInCell[cluster] = this.slotHeads[slot];
    this.slotHeads[slot] = cluster;
    return cluster;
  }

  /** Grid column of a longitude in a row, with the longitude scale at the row centre. */
  private getColumn(lon: number, row: number): number {
    const rowLatitude = ((row + 0.5) * this.tolerance) / METRES_PER_DEGREE;
    const scale = METRES_PER_DEGREE * Math.cos(rowLatitude * DEGREES_TO_RADIANS);
    return Math.floor((lon * scale) / this.tolerance);
  }

  /** First cluster of a cell within the tolerance of the point, or EMPTY. */
  private findInCell(cellX: number, cellY: number, lon: number, lat: number): number {
    const slot = findCellSlot(this.slotKeys, this.slotHeads, this.slotMask, cellX, cellY, false);
    if (slot === EMPTY) return EMPTY;
    const cosLat = Math.cos(lat * DEGREES_TO_RADIANS);
    for (let c = this.slotHeads[slot]; c !== EMPTY; c = this.nextInCell[c]) {
      const dx = (this.clusterX[c] - lon) * METRES_PER_DEGREE * cosLat;
      const dy = (this.clusterY[c] - lat) * METRES_PER_DEGREE;
      if (dx * dx + dy * dy <= this.toleranceSquared) return c;
    }
    return EMPTY;
  }
}

/**
 * Grid hash of segments: each segment (named by its first vertex) goes into every cell that it
 * passes through. Rows use the same per-latitude longitude scale as `PointSnapper`, so a 3 x 3
 * search around a point finds every segment within one cell size.
 */
class SegmentIndex {
  /** Cell key of each slot, two values for each slot. */
  readonly slotKeys: Int32Array;
  /** First entry of the cell of each slot, or EMPTY. */
  readonly slotHeads: Int32Array;
  /** Segment (first vertex) of each entry. */
  readonly entrySegment: Int32Array;
  /** Next entry in the same cell, or EMPTY. */
  readonly entryNext: Int32Array;
  /** Cell size in metres. */
  readonly cellSize: number;
  /** Slot count minus one. */
  private readonly slotMask: number;
  /** Number of entries inserted so far. */
  private entryCount = 0;
  /** Longitude scale (metres per degree) of each row from `firstRow`, so `column` needs no cosine. */
  private readonly rowScale: Float64Array;
  /** Row of the first `rowScale` value. */
  private readonly firstRow: number;

  /** Indexes every segment of `lines`. */
  constructor(lines: LineNetworkLines, cellSize: number, minLatitude: number, maxLatitude: number) {
    this.cellSize = cellSize;
    // One spare row on each side for the 3 x 3 search.
    this.firstRow = this.row(minLatitude) - 1;
    this.rowScale = new Float64Array(this.row(maxLatitude) - this.firstRow + 2);
    for (let i = 0; i < this.rowScale.length; i++) {
      const rowLatitude = ((this.firstRow + i + 0.5) * cellSize) / METRES_PER_DEGREE;
      this.rowScale[i] = METRES_PER_DEGREE * Math.cos(rowLatitude * DEGREES_TO_RADIANS);
    }
    const pathIndices = lines.pathIndices.value;
    const pathCount = pathIndices.length - 1;
    let entries = 0;
    for (let path = 0; path < pathCount; path++) {
      for (let s = pathIndices[path]; s < pathIndices[path + 1] - 1; s++) {
        entries += this.addSegment(lines.positions, s, false);
      }
    }
    const capacity = getHashCapacity(entries * 2);
    this.slotMask = capacity - 1;
    this.slotKeys = new Int32Array(capacity * 2);
    this.slotHeads = new Int32Array(capacity).fill(EMPTY);
    this.entrySegment = new Int32Array(entries);
    this.entryNext = new Int32Array(entries);
    for (let path = 0; path < pathCount; path++) {
      for (let s = pathIndices[path]; s < pathIndices[path + 1] - 1; s++) {
        this.addSegment(lines.positions, s, true);
      }
    }
  }

  /** Grid row of a latitude. */
  row(lat: number): number {
    return Math.floor((lat * METRES_PER_DEGREE) / this.cellSize);
  }

  /** Metres per degree of longitude in a row (at the row centre). Covers the data and one row on each side. */
  scale(row: number): number {
    return this.rowScale[row - this.firstRow];
  }

  /** Grid column of a longitude in a row. */
  column(lon: number, row: number): number {
    return Math.floor((lon * this.scale(row)) / this.cellSize);
  }

  /** First entry of a cell, or EMPTY. */
  head(column: number, row: number): number {
    const slot = findCellSlot(this.slotKeys, this.slotHeads, this.slotMask, column, row, false);
    return slot === EMPTY ? EMPTY : this.slotHeads[slot];
  }

  /** Visits the cells that segment `s` (vertex s to s + 1) passes through. Returns the count. */
  private addSegment(positions: LineNetworkFixedSizeList, s: number, insert: boolean): number {
    const {value, size} = positions;
    const lon1 = value[size * s];
    const lat1 = value[size * s + 1];
    const lon2 = value[size * s + size];
    const lat2 = value[size * s + size + 1];
    const y1 = (lat1 * METRES_PER_DEGREE) / this.cellSize;
    const y2 = (lat2 * METRES_PER_DEGREE) / this.cellSize;
    const firstRow = Math.floor(Math.min(y1, y2));
    const lastRow = Math.floor(Math.max(y1, y2));
    let count = 0;
    for (let row = firstRow; row <= lastRow; row++) {
      // Clip the segment to the latitude band of the row, then take the column range in that row.
      let ta = 0;
      let tb = 1;
      if (y2 !== y1) {
        const a = (row - y1) / (y2 - y1);
        const b = (row + 1 - y1) / (y2 - y1);
        ta = Math.max(0, Math.min(a, b));
        tb = Math.min(1, Math.max(a, b));
      }
      const lonA = lon1 + ta * (lon2 - lon1);
      const lonB = lon1 + tb * (lon2 - lon1);
      const firstColumn = this.column(Math.min(lonA, lonB), row);
      const lastColumn = this.column(Math.max(lonA, lonB), row);
      for (let column = firstColumn; column <= lastColumn; column++) {
        count++;
        if (!insert) continue;
        const slot = findCellSlot(this.slotKeys, this.slotHeads, this.slotMask, column, row, true);
        const entry = this.entryCount++;
        this.entrySegment[entry] = s;
        this.entryNext[entry] = this.slotHeads[slot];
        this.slotHeads[slot] = entry;
      }
    }
    return count;
  }
}

/** Growable list of cut points inside segments: the segment (first vertex), the fraction and the cluster. */
class SplitList {
  /** Segment of each cut. */
  vertex = new Int32Array(64);
  /** Fraction of the segment at each cut. */
  fraction = new Float64Array(64);
  /** Cluster of each cut. */
  cluster = new Int32Array(64);
  /** Number of cuts. */
  count = 0;

  /** Adds a cut, and doubles the storage when it is full. */
  push(vertex: number, fraction: number, cluster: number): void {
    if (this.count === this.vertex.length) {
      const vertices = new Int32Array(this.count * 2);
      vertices.set(this.vertex);
      this.vertex = vertices;
      const fractions = new Float64Array(this.count * 2);
      fractions.set(this.fraction);
      this.fraction = fractions;
      const clusters = new Int32Array(this.count * 2);
      clusters.set(this.cluster);
      this.cluster = clusters;
    }
    this.vertex[this.count] = vertex;
    this.fraction[this.count] = fraction;
    this.cluster[this.count] = cluster;
    this.count++;
  }
}

/** Checks the input and returns the path count. */
function validateLines(lines: LineNetworkLines, options: BuildLineNetworkOptions): number {
  const {positions, pathIndices, pathRows} = lines;
  if (!(Number.isInteger(positions.size) && positions.size >= 2)) {
    throw new RangeError('buildLineNetwork: positions.size must be an integer of 2 or more');
  }
  const offsets = pathIndices.value;
  const pathCount = Math.max(offsets.length - 1, 0);
  const vertexCount = positions.value.length / positions.size;
  for (let path = 0; path <= pathCount && pathCount > 0; path++) {
    const at = offsets[path];
    const previous = path === 0 ? 0 : offsets[path - 1];
    if (!(Number.isInteger(at) && at >= previous && at <= vertexCount)) {
      throw new RangeError('buildLineNetwork: pathIndices must be ascending vertex indices');
    }
  }
  if (pathRows && pathRows.length < pathCount) {
    throw new RangeError('buildLineNetwork: pathRows needs one value for each path');
  }
  if (options.pathWeightFactors && options.pathWeightFactors.length < pathCount) {
    throw new RangeError('buildLineNetwork: pathWeightFactors needs one value for each path');
  }
  if (options.pathWeightFactors && options.edgeWeight) {
    throw new Error('buildLineNetwork: use pathWeightFactors or edgeWeight, not both');
  }
  return pathCount;
}

/**
 * Builds a graph from line geometry.
 *
 * Every path with two or more vertices gives one edge between the nodes of its snapped
 * endpoints. `splitAtSharedVertices` also cuts paths at interior vertices that another
 * vertex shares. T-junctions (`junctionTolerance`, on by default) join dangling ends to the
 * interior of nearby paths. `splitAtCrossings` (off by default) adds a node where two segments
 * cross. Paths with fewer than two vertices are skipped. Snapping does not handle the
 * antimeridian.
 */
export function buildLineNetwork(
  lines: LineNetworkLines,
  options: BuildLineNetworkOptions = {}
): LineNetwork {
  const tolerance = options.snapTolerance ?? 1;
  if (!(tolerance > 0 && tolerance < Infinity)) {
    throw new RangeError('buildLineNetwork: snapTolerance must be positive and finite');
  }
  const junctionTolerance = options.junctionTolerance ?? tolerance;
  if (!(junctionTolerance >= 0 && junctionTolerance < Infinity)) {
    throw new RangeError('buildLineNetwork: junctionTolerance must be zero or positive and finite');
  }
  const pathCount = validateLines(lines, options);
  const split = Boolean(options.splitAtSharedVertices);
  const crossings = Boolean(options.splitAtCrossings);
  const distance = options.distance ?? haversineDistance;
  const {value: positions, size} = lines.positions;
  const pathIndices = lines.pathIndices.value;
  const vertexCount = pathCount > 0 ? pathIndices[pathCount] : 0;

  let minLatitude = Infinity;
  let maxLatitude = -Infinity;
  for (let v = 0; v < vertexCount; v++) {
    const lon = positions[size * v];
    const lat = positions[size * v + 1];
    if (!(lat >= -90 && lat <= 90 && Number.isFinite(lon))) {
      throw new RangeError(
        'buildLineNetwork: positions must be finite longitude, latitude degrees'
      );
    }
    if (lat < minLatitude) minLatitude = lat;
    if (lat > maxLatitude) maxLatitude = lat;
  }

  const snapper = new PointSnapper(split ? vertexCount : pathCount * 2, tolerance);
  // Cluster of each vertex that is a node candidate (EMPTY for the others).
  const vertexCluster = new Int32Array(vertexCount).fill(EMPTY);
  for (let path = 0; path < pathCount; path++) {
    const first = pathIndices[path];
    const last = pathIndices[path + 1] - 1;
    if (last <= first) continue;
    if (split) {
      for (let v = first; v <= last; v++) {
        vertexCluster[v] = snapper.snap(positions[size * v], positions[size * v + 1]);
      }
    } else {
      vertexCluster[first] = snapper.snap(positions[size * first], positions[size * first + 1]);
      vertexCluster[last] = snapper.snap(positions[size * last], positions[size * last + 1]);
    }
  }

  // A cluster is a node when it holds an endpoint, or (split mode) two non-consecutive vertices.
  // `clusterUses` counts the visits; an endpoint cluster with one visit is a dangling end.
  const snappedCount = snapper.clusterCount;
  const clusterUses = new Uint32Array(snappedCount);
  const isEndpointCluster = new Uint8Array(snappedCount);
  for (let path = 0; path < pathCount; path++) {
    const first = pathIndices[path];
    const last = pathIndices[path + 1] - 1;
    if (last <= first) continue;
    isEndpointCluster[vertexCluster[first]] = 1;
    isEndpointCluster[vertexCluster[last]] = 1;
    for (let v = first; v <= last; v++) {
      const cluster = vertexCluster[v];
      if (cluster !== EMPTY && (v === first || cluster !== vertexCluster[v - 1])) {
        clusterUses[cluster]++;
      }
    }
  }
  const isSnappedNode = (c: number): boolean =>
    isEndpointCluster[c] === 1 || (split && clusterUses[c] >= 2);

  const splits = new SplitList();
  // Union pairs (a dangling end joins an existing node), and the positions of crossing clusters.
  const unions: number[] = [];
  const crossingPositions: number[] = [];
  const clusterGap = junctionTolerance > 0 ? new Float64Array(snappedCount) : null;

  let dangling = 0;
  if (clusterGap) {
    for (let c = 0; c < snappedCount; c++) {
      if (isEndpointCluster[c] && clusterUses[c] === 1) dangling++;
    }
  }
  if (dangling > 0 || crossings) {
    // Cell size: at least the junction tolerance (so a 3 x 3 search is complete), and about one
    // mean segment length (so a segment covers few cells).
    let lengthSum = 0;
    let segmentCount = 0;
    for (let path = 0; path < pathCount; path++) {
      for (let s = pathIndices[path]; s < pathIndices[path + 1] - 1; s++) {
        const cosLat = Math.cos(positions[size * s + 1] * DEGREES_TO_RADIANS);
        const dx = (positions[size * s + size] - positions[size * s]) * cosLat;
        const dy = positions[size * s + size + 1] - positions[size * s + 1];
        lengthSum += Math.sqrt(dx * dx + dy * dy) * METRES_PER_DEGREE;
        segmentCount++;
      }
    }
    const cellSize = Math.max(junctionTolerance, segmentCount ? lengthSum / segmentCount : 0, 1);
    // No segment means no latitude range, and nothing to join or to cross.
    const index =
      segmentCount > 0 ? new SegmentIndex(lines, cellSize, minLatitude, maxLatitude) : null;

    if (index && clusterGap && dangling > 0) {
      joinDanglingEnds(lines, vertexCluster, clusterUses, isEndpointCluster, index, {
        junctionTolerance,
        distance,
        clusterGap,
        isSnappedNode,
        splits,
        unions
      });
    }
    if (index && crossings) {
      splitCrossings(lines, vertexCluster, index, snappedCount, splits, crossingPositions);
    }
  }

  // Union-find over snapped clusters and crossing clusters. The root is the lowest id.
  const clusterCount = snappedCount + crossingPositions.length / 2;
  const parent = new Int32Array(clusterCount);
  for (let c = 0; c < clusterCount; c++) parent[c] = c;
  const find = (x: number): number => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  for (let i = 0; i < unions.length; i += 2) {
    const a = find(unions[i]);
    const b = find(unions[i + 1]);
    if (a !== b) parent[Math.max(a, b)] = Math.min(a, b);
  }
  const isNode = new Uint8Array(clusterCount);
  for (let c = 0; c < snappedCount; c++) if (isSnappedNode(c)) isNode[find(c)] = 1;
  for (let c = snappedCount; c < clusterCount; c++) isNode[c] = 1;
  for (let k = 0; k < splits.count; k++) isNode[find(splits.cluster[k])] = 1;

  const clusterNode = new Int32Array(clusterCount).fill(EMPTY);
  let nodeCount = 0;
  for (let c = 0; c < clusterCount; c++) {
    if (find(c) === c && isNode[c]) clusterNode[c] = nodeCount++;
  }
  const nodePositions = new Float64Array(nodeCount * 2);
  for (let c = 0; c < clusterCount; c++) {
    const root = find(c);
    if (root !== c) {
      clusterNode[c] = clusterNode[root];
      continue;
    }
    const node = clusterNode[c];
    if (node === EMPTY) continue;
    if (c < snappedCount) {
      nodePositions[2 * node] = snapper.clusterX[c];
      nodePositions[2 * node + 1] = snapper.clusterY[c];
    } else {
      nodePositions[2 * node] = crossingPositions[2 * (c - snappedCount)];
      nodePositions[2 * node + 1] = crossingPositions[2 * (c - snappedCount) + 1];
    }
  }

  // Cut points inside segments, grouped by segment and sorted by fraction.
  const splitOffsets = splits.count ? new Uint32Array(vertexCount + 1) : null;
  const splitFraction = new Float64Array(splits.count);
  const splitNode = new Int32Array(splits.count);
  if (splitOffsets) {
    for (let k = 0; k < splits.count; k++) splitOffsets[splits.vertex[k] + 1]++;
    for (let v = 0; v < vertexCount; v++) splitOffsets[v + 1] += splitOffsets[v];
    const cursor = splitOffsets.slice(0, vertexCount);
    for (let k = 0; k < splits.count; k++) {
      const at = cursor[splits.vertex[k]]++;
      // Insertion sort inside the bucket of the segment.
      let i = at;
      const start = splitOffsets[splits.vertex[k]];
      while (i > start && splitFraction[i - 1] > splits.fraction[k]) {
        splitFraction[i] = splitFraction[i - 1];
        splitNode[i] = splitNode[i - 1];
        i--;
      }
      splitFraction[i] = splits.fraction[k];
      splitNode[i] = clusterNode[splits.cluster[k]];
    }
  }

  // Count path by path: an empty path (a repeated offset) has no segment, not -1.
  let maxEdges = splits.count;
  for (let path = 0; path < pathCount; path++) {
    const pathVertices = pathIndices[path + 1] - pathIndices[path];
    if (pathVertices > 1) maxEdges += split ? pathVertices - 1 : 1;
  }
  const edges = new EdgeColumns(maxEdges, Boolean(options.edgeWeight));
  for (let path = 0; path < pathCount; path++) {
    const first = pathIndices[path];
    const last = pathIndices[path + 1] - 1;
    if (last <= first) continue;
    const row = lines.pathRows ? lines.pathRows[path] : path;
    const firstEdge = edges.count;
    let start = first;
    let startFraction = 0;
    let startNode = clusterNode[vertexCluster[first]];
    let previousNode = startNode;
    let length = clusterGap ? clusterGap[vertexCluster[first]] : 0;
    // Metres along the path geometry (no gaps) at the start of the current segment and edge.
    let pathAlong = 0;
    let edgeAlong = 0;
    for (let v = first + 1; v <= last; v++) {
      const segmentLength = distance(
        positions[size * v - size],
        positions[size * v - size + 1],
        positions[size * v],
        positions[size * v + 1]
      );
      let along = 0;
      if (splitOffsets) {
        for (let k = splitOffsets[v - 1]; k < splitOffsets[v]; k++) {
          const fraction = splitFraction[k];
          const node = splitNode[k];
          length += (fraction - along) * segmentLength;
          along = fraction;
          previousNode = node;
          if (length === 0 && node === startNode) {
            start = v - 1;
            startFraction = fraction;
            continue;
          }
          const cutAlong = pathAlong + fraction * segmentLength;
          edges.push(path, row, startNode, node, length, start, v, startFraction, fraction);
          edges.setAlong(edgeAlong, cutAlong);
          start = v - 1;
          startFraction = fraction;
          startNode = node;
          length = 0;
          edgeAlong = cutAlong;
        }
      }
      length += (1 - along) * segmentLength;
      pathAlong += segmentLength;
      const cluster = vertexCluster[v];
      const node = cluster === EMPTY ? EMPTY : clusterNode[cluster];
      const isCut = v === last || (split && node !== EMPTY && node !== previousNode);
      previousNode = node;
      if (!isCut) continue;
      if (v === last && clusterGap) length += clusterGap[cluster];
      if (length === 0 && node === startNode) {
        start = v;
        startFraction = 0;
        continue;
      }
      edges.push(path, row, startNode, node, length, start, v, startFraction, 1);
      edges.setAlong(edgeAlong, pathAlong);
      start = v;
      startFraction = 0;
      startNode = node;
      length = 0;
      edgeAlong = pathAlong;
    }
    edges.setWeights(firstEdge, pathAlong, options, path);
  }
  return edges.toNetwork(Boolean(options.directed), nodeCount, nodePositions);
}

/** Edge columns sized for the most edges that a build can make. */
class EdgeColumns {
  /** Number of edges written. */
  count = 0;
  /** Node at the start of each edge. */
  readonly source: Uint32Array;
  /** Node at the end of each edge. */
  readonly target: Uint32Array;
  /** Length in metres. */
  readonly length: Float64Array;
  /** Routing weight. */
  readonly weight: Float32Array;
  /** Path index. */
  readonly path: Uint32Array;
  /** Source row. */
  readonly row: Uint32Array;
  /** First vertex. */
  readonly vertexStart: Uint32Array;
  /** Last vertex. */
  readonly vertexEnd: Uint32Array;
  /** Fraction of the first segment where the edge starts. */
  readonly startFraction: Float64Array;
  /** Fraction of the last segment where the edge ends. */
  readonly endFraction: Float64Array;
  /** Metres along the path where each edge starts (only with an edge weight callback). */
  readonly alongStart: Float64Array | null;
  /** Metres along the path where each edge ends (only with an edge weight callback). */
  readonly alongEnd: Float64Array | null;

  /** Allocates the columns. `withAlong` keeps the along-path positions for the weight callback. */
  constructor(maxEdges: number, withAlong: boolean) {
    this.source = new Uint32Array(maxEdges);
    this.target = new Uint32Array(maxEdges);
    this.length = new Float64Array(maxEdges);
    this.weight = new Float32Array(maxEdges);
    this.path = new Uint32Array(maxEdges);
    this.row = new Uint32Array(maxEdges);
    this.vertexStart = new Uint32Array(maxEdges);
    this.vertexEnd = new Uint32Array(maxEdges);
    this.startFraction = new Float64Array(maxEdges);
    this.endFraction = new Float64Array(maxEdges);
    this.alongStart = withAlong ? new Float64Array(maxEdges) : null;
    this.alongEnd = withAlong ? new Float64Array(maxEdges) : null;
  }

  /** Appends one edge. */
  push(
    path: number,
    row: number,
    source: number,
    target: number,
    length: number,
    vertexStart: number,
    vertexEnd: number,
    startFraction: number,
    endFraction: number
  ): void {
    const e = this.count++;
    this.path[e] = path;
    this.row[e] = row;
    this.source[e] = source;
    this.target[e] = target;
    this.length[e] = length;
    this.vertexStart[e] = vertexStart;
    this.vertexEnd[e] = vertexEnd;
    this.startFraction[e] = startFraction;
    this.endFraction[e] = endFraction;
  }

  /** Records where the last edge starts and ends along its path, in metres. */
  setAlong(start: number, end: number): void {
    if (!this.alongStart || !this.alongEnd) return;
    this.alongStart[this.count - 1] = start;
    this.alongEnd[this.count - 1] = end;
  }

  /** Sets the weights of the edges of one path, from `firstEdge` to the last edge written. */
  setWeights(
    firstEdge: number,
    pathLength: number,
    options: BuildLineNetworkOptions,
    path: number
  ): void {
    const {edgeWeight, pathWeightFactors} = options;
    const factor = pathWeightFactors ? pathWeightFactors[path] : 1;
    for (let e = firstEdge; e < this.count; e++) {
      let weight: number;
      if (edgeWeight && this.alongStart && this.alongEnd) {
        // Divide (not multiply by the inverse), so an edge that ends at the path end gives 1.
        const startFraction = pathLength > 0 ? this.alongStart[e] / pathLength : 0;
        const endFraction = pathLength > 0 ? this.alongEnd[e] / pathLength : 0;
        weight = edgeWeight(path, startFraction, endFraction, this.length[e]);
      } else {
        weight = this.length[e] * factor;
      }
      if (!(weight >= 0)) {
        throw new RangeError('buildLineNetwork: edge weights must be zero or positive');
      }
      this.weight[e] = weight;
    }
  }

  /** Returns the network with columns trimmed to the edge count. */
  toNetwork(directed: boolean, nodeCount: number, nodePositions: Float64Array): LineNetwork {
    const n = this.count;
    return {
      directed,
      nodeCount,
      edgeCount: n,
      nodePositions,
      edgeSource: this.source.slice(0, n),
      edgeTarget: this.target.slice(0, n),
      edgeLength: this.length.slice(0, n),
      edgeWeight: this.weight.slice(0, n),
      edgePath: this.path.slice(0, n),
      edgeRow: this.row.slice(0, n),
      edgeVertexStart: this.vertexStart.slice(0, n),
      edgeVertexEnd: this.vertexEnd.slice(0, n),
      edgeStartFraction: this.startFraction.slice(0, n),
      edgeEndFraction: this.endFraction.slice(0, n)
    };
  }
}

/**
 * For each dangling end, finds the nearest point on a segment of another path. Within the
 * tolerance it records a split there (or a union when the point is an existing node vertex).
 */
function joinDanglingEnds(
  lines: LineNetworkLines,
  vertexCluster: Int32Array,
  clusterUses: Uint32Array,
  isEndpointCluster: Uint8Array,
  index: SegmentIndex,
  out: {
    junctionTolerance: number;
    distance: LineNetworkDistance;
    clusterGap: Float64Array;
    isSnappedNode: (cluster: number) => boolean;
    splits: SplitList;
    unions: number[];
  }
): void {
  const {value: positions, size} = lines.positions;
  const pathIndices = lines.pathIndices.value;
  const pathCount = pathIndices.length - 1;
  const limitSquared = out.junctionTolerance * out.junctionTolerance;
  for (let path = 0; path < pathCount; path++) {
    const first = pathIndices[path];
    const last = pathIndices[path + 1] - 1;
    if (last <= first) continue;
    for (let end = 0; end < 2; end++) {
      const v = end === 0 ? first : last;
      const cluster = vertexCluster[v];
      if (!isEndpointCluster[cluster] || clusterUses[cluster] !== 1) continue;
      const lon = positions[size * v];
      const lat = positions[size * v + 1];
      const kx = METRES_PER_DEGREE * Math.cos(lat * DEGREES_TO_RADIANS);
      let bestSquared = Infinity;
      let bestSegment = EMPTY;
      let bestFraction = 0;
      // Search the own cell, and a neighbour cell only when the point is within the tolerance of
      // the border to it.
      const cell = index.cellSize;
      const y = lat * METRES_PER_DEGREE;
      const row = index.row(lat);
      const yLow = y - row * cell < out.junctionTolerance ? -1 : 0;
      const yHigh = (row + 1) * cell - y < out.junctionTolerance ? 1 : 0;
      for (let dy = yLow; dy <= yHigh; dy++) {
        const x = lon * index.scale(row + dy);
        const column = Math.floor(x / cell);
        const xLow = x - column * cell < out.junctionTolerance ? -1 : 0;
        const xHigh = (column + 1) * cell - x < out.junctionTolerance ? 1 : 0;
        for (let dx = xLow; dx <= xHigh; dx++) {
          for (let e = index.head(column + dx, row + dy); e !== EMPTY; e = index.entryNext[e]) {
            const s = index.entrySegment[e];
            // The path of the dangling end itself is not a target.
            if (s >= first && s < last) continue;
            const ax = (positions[size * s] - lon) * kx;
            const ay = (positions[size * s + 1] - lat) * METRES_PER_DEGREE;
            const bx = (positions[size * s + size] - lon) * kx;
            const by = (positions[size * s + size + 1] - lat) * METRES_PER_DEGREE;
            const ux = bx - ax;
            const uy = by - ay;
            const lengthSquared = ux * ux + uy * uy;
            let t = lengthSquared > 0 ? -(ax * ux + ay * uy) / lengthSquared : 0;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const px = ax + t * ux;
            const py = ay + t * uy;
            const d2 = px * px + py * py;
            if (d2 < bestSquared || (d2 === bestSquared && s < bestSegment)) {
              bestSquared = d2;
              bestSegment = s;
              bestFraction = t;
            }
          }
        }
      }
      if (bestSegment === EMPTY || bestSquared > limitSquared) continue;
      const s = bestSegment;
      out.clusterGap[cluster] = out.distance(
        lon,
        lat,
        positions[size * s] + bestFraction * (positions[size * s + size] - positions[size * s]),
        positions[size * s + 1] +
          bestFraction * (positions[size * s + size + 1] - positions[size * s + 1])
      );
      // The nearest point is a vertex that is already a node: join that node.
      const atVertex = bestFraction === 0 ? s : bestFraction === 1 ? s + 1 : -1;
      const target = atVertex >= 0 ? vertexCluster[atVertex] : EMPTY;
      if (target !== EMPTY && out.isSnappedNode(target)) {
        out.unions.push(cluster, target);
      } else {
        out.splits.push(s, bestFraction, cluster);
      }
    }
  }
}

/**
 * Finds proper crossings (both segment interiors, no shared snapped vertex). Each crossing makes
 * a new cluster and a split on both segments. A pair is counted in the one cell that holds the
 * crossing point, so a pair that shares several cells gives one crossing.
 */
function splitCrossings(
  lines: LineNetworkLines,
  vertexCluster: Int32Array,
  index: SegmentIndex,
  snappedCount: number,
  splits: SplitList,
  crossingPositions: number[]
): void {
  const {value: positions, size} = lines.positions;
  const {slotHeads, slotKeys, entryNext, entrySegment} = index;
  for (let slot = 0; slot < slotHeads.length; slot++) {
    const head = slotHeads[slot];
    if (head === EMPTY || entryNext[head] === EMPTY) continue;
    const cellX = slotKeys[slot * 2];
    const cellY = slotKeys[slot * 2 + 1];
    for (let i = head; i !== EMPTY; i = entryNext[i]) {
      const a = entrySegment[i];
      const lonA = positions[size * a];
      const latA = positions[size * a + 1];
      const kx = Math.cos(latA * DEGREES_TO_RADIANS);
      const rx = (positions[size * a + size] - lonA) * kx;
      const ry = positions[size * a + size + 1] - latA;
      for (let j = entryNext[i]; j !== EMPTY; j = entryNext[j]) {
        const b = entrySegment[j];
        if (b === a || b === a + 1 || a === b + 1) continue;
        if (sharesCluster(vertexCluster, a, b)) continue;
        const qx = (positions[size * b] - lonA) * kx;
        const qy = positions[size * b + 1] - latA;
        const sx = (positions[size * b + size] - positions[size * b]) * kx;
        const sy = positions[size * b + size + 1] - positions[size * b + 1];
        const denominator = rx * sy - ry * sx;
        if (denominator === 0) continue;
        const t = (qx * sy - qy * sx) / denominator;
        const u = (qx * ry - qy * rx) / denominator;
        if (!(t > 0 && t < 1 && u > 0 && u < 1)) continue;
        const lon = lonA + t * (positions[size * a + size] - lonA);
        const lat = latA + t * (positions[size * a + size + 1] - latA);
        const row = index.row(lat);
        if (row !== cellY || index.column(lon, row) !== cellX) continue;
        const cluster = snappedCount + crossingPositions.length / 2;
        crossingPositions.push(lon, lat);
        splits.push(a, t, cluster);
        splits.push(b, u, cluster);
      }
    }
  }
}

/** True when segments `a` and `b` share a snapped vertex. */
function sharesCluster(vertexCluster: Int32Array, a: number, b: number): boolean {
  const a0 = vertexCluster[a];
  const a1 = vertexCluster[a + 1];
  const b0 = vertexCluster[b];
  const b1 = vertexCluster[b + 1];
  return (a0 !== EMPTY && (a0 === b0 || a0 === b1)) || (a1 !== EMPTY && (a1 === b0 || a1 === b1));
}
