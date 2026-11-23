# Line networks

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.1-blue.svg?style=flat-square" alt="From v5.1" />
</p>

`buildLineNetwork` turns line geometry into a graph. Nodes are the points where lines
meet. Edges are the pieces of line between two nodes. Every column of the result is a
typed array, so a graph of a million segments needs no per-feature objects.

```typescript
import {
  buildLineNetwork,
  buildLineNetworkAdjacency,
  getRouteEdges,
  getRouteGeometry
} from '@math.gl/geospatial/line-network';

const lines = {
  positions: {value: new Float64Array([0, 0, 0.002, 0, 0.001, 0.00009, 0.001, 0.001]), size: 2},
  pathIndices: {value: new Uint32Array([0, 2, 4]), size: 1}
};
const network = buildLineNetwork(lines, {snapTolerance: 1, junctionTolerance: 15});
// network.nodeCount === 4, network.edgeCount === 3:
// the second line ends 10 m from the first, so the first line splits there.

const adjacency = buildLineNetworkAdjacency(network);
// Run a shortest-path search on the adjacency and network.edgeWeight, then:
const route = getRouteEdges(adjacency, network.edgeWeight, predecessors, source, target);
const path = route && getRouteGeometry(network, lines, route, source);
```

## Input

The input has the shape of a loaders.gl binary line geometry. Positions are longitude
and latitude in degrees.

| Field | Type | Description |
| --- | --- | --- |
| `positions` | `{value, size}` | Interleaved positions. `size` is 2 or more. Values after the first two (Z, M) are ignored. |
| `pathIndices` | `{value, size}` | First vertex of each path, followed by the total vertex count (`pathCount + 1` values). |
| `pathRows` | `ArrayLike<number>` (optional) | Source table row of each path. Defaults to the path index. |

A path with fewer than two vertices gives no edge. math.gl does not depend on
loaders.gl. To build the input from a column of WKB values, convert each row with
loaders.gl (`convertWKBToBinaryGeometry` from `@loaders.gl/core/geoarrow`, loaders.gl 5) and concatenate the paths:

```typescript
import {convertWKBToBinaryGeometry} from '@loaders.gl/core/geoarrow';

function readLines(wkbRows: ArrayBuffer[]) {
  const positions: number[] = [];
  const pathIndices: number[] = [0];
  const pathRows: number[] = [];
  wkbRows.forEach((wkb, row) => {
    const geometry = convertWKBToBinaryGeometry(wkb);
    if (geometry.type !== 'LineString') return;
    const {value, size} = geometry.positions;
    const indices = geometry.pathIndices.value;
    const base = positions.length / 2;
    for (let i = 0; i < value.length; i += size) positions.push(value[i], value[i + 1]);
    for (let p = 1; p < indices.length; p++) {
      pathIndices.push(base + indices[p]);
      pathRows.push(row);
    }
  });
  return {
    positions: {value: new Float64Array(positions), size: 2},
    pathIndices: {value: new Uint32Array(pathIndices), size: 1},
    pathRows: new Uint32Array(pathRows)
  };
}
```

A binary line feature collection (for example the `lines` of
`convertGeojsonToBinaryFeatureCollection`) has
`positions` and `pathIndices` already. Its `featureIds` column has one value for each
vertex. Take the value at the first vertex of each path to get `pathRows`.

## Usage

#### `buildLineNetwork(lines, options?)`

Builds the graph.

1. **Snap.** Path endpoints closer than `snapTolerance` metres join into one node. With
   `splitAtSharedVertices`, interior vertices snap too, and a path splits at an interior
   vertex that another vertex shares.
2. **T-junctions.** A dangling end is an endpoint that no other vertex shares. It joins the
   nearest point on another path within `junctionTolerance` metres. That path splits
   there. The gap adds to the length of the dangling edge. A path never joins itself.
3. **Crossings.** With `splitAtCrossings`, two segments that cross with no shared vertex
   get a new node at the crossing, and both split there.

Snapping uses a grid hash in a local metric frame, with the longitude scale of each
latitude row. A point joins the first node within the tolerance, so the result is
deterministic for a given input order. Snapping does not join points across the
antimeridian.

| Option | Default | Description |
| --- | --- | --- |
| `snapTolerance` | `1` | Metres. Vertices closer than this join into one node. Must be positive. |
| `junctionTolerance` | `snapTolerance` | Metres. A dangling end joins the nearest other path within this distance. `0` turns T-junctions off. |
| `splitAtSharedVertices` | `false` | Also split paths at interior vertices that another vertex shares. |
| `splitAtCrossings` | `false` | Add a node where two segments cross with no shared vertex. This also joins lines that cross with no connection, such as a bridge over a road or a pipe over a cable. |
| `directed` | `false` | Edges are one-way, in path direction. `buildLineNetworkAdjacency` then lists each edge from its source only. |
| `distance` | `haversineDistance` | `(lon1, lat1, lon2, lat2) => metres`. Measures edge lengths and junction gaps. The snap and junction searches always use the local metric frame. |
| `pathWeightFactors` | — | One factor for each path. The weight of an edge is its length times the factor of its path. |
| `edgeWeight` | — | `(pathIndex, startFraction, endFraction, lengthMetres) => weight`. Returns the weight of each edge. The fractions give where the edge starts and ends along its path, as fractions of the path length (gaps excluded). Replaces `pathWeightFactors`; give one or the other. |

Edges always run in path direction: `edgeSource` is at the start of the piece of
path. Weights must be zero or positive. `+Infinity` marks an edge that a route cannot
use. The builder calls `distance` and `edgeWeight` with numbers only and keeps no
objects in its loops.

The default distance is the haversine distance on a sphere of radius 6,371,008.8 m (the
mean Earth radius), the same as `@turf/distance`. For WGS84 ellipsoid lengths, pass a
geodesic distance:

```typescript
import {EllipsoidGeodesic} from '@math.gl/geospatial/geodesics';

const geodesic = new EllipsoidGeodesic({semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179});
const network = buildLineNetwork(lines, {
  distance: (lon1, lat1, lon2, lat2) => geodesic.inverse(lat1, lon1, lat2, lon2).s12
});
```

The haversine error is below 0.5 % of the length. That is much smaller than a usual snap
tolerance on generalized lines. A later version can make the ellipsoid distance the
default.

#### Result

| Field | Type | Description |
| --- | --- | --- |
| `directed` | `boolean` | The `directed` option. |
| `nodeCount`, `edgeCount` | `number` | Graph size. |
| `nodePositions` | `Float64Array` | Longitude, latitude of each node. A snapped node has the position of its first vertex. |
| `edgeSource`, `edgeTarget` | `Uint32Array` | End nodes of each edge, in path direction. |
| `edgeLength` | `Float64Array` | Metres, with the gap of a joined dangling end. |
| `edgeWeight` | `Float32Array` | Routing weight. The length unless a weight option is given. |
| `edgePath` | `Uint32Array` | Path of each edge. |
| `edgeRow` | `Uint32Array` | Source row of each edge (`pathRows`, or the path index). |
| `edgeVertexStart`, `edgeVertexEnd` | `Uint32Array` | Vertex range of each edge in `positions`, inclusive. |
| `edgeStartFraction`, `edgeEndFraction` | `Float64Array` | Where the edge starts on its first segment and ends on its last segment. 0 and 1 unless a junction or a crossing split the segment. |

`edgeWeight` is a `Float32Array` because GPU shortest-path kernels, such as the luma.gl
graph algorithms, take 32-bit weights. A CPU search that adds in 32 bits
(`Math.fround`) then finds the same distances bit for bit. The relative precision is
about 6e-8, which is 0.6 mm on a 10 km edge. Use `edgeLength` for measurements.

#### `buildLineNetworkAdjacency(network, {directed?})`

Builds a compressed sparse row adjacency: `offsets` (`nodeCount + 1` values),
`neighbors` and `edges` (one slot for each edge end). An undirected adjacency lists each
edge from both nodes. A directed adjacency lists it from its source only. The default
is `network.directed`.

#### `getRouteEdges(adjacency, edgeWeight, predecessors, source, target)`

Walks a predecessor array (one node for each node, `NO_PREDECESSOR` = `0xffffffff` for
the source and unreachable nodes) from `target` back to `source`. It returns the edges
in travel order, an empty array when `target` is `source`, or `null` when `target` is
unreachable. Between two nodes it takes the edge of lowest weight, as a shortest-path
search does.

#### `getRouteGeometry(network, lines, route, source)`

Concatenates the original geometry of the route edges into one flat longitude, latitude
path from `source`. It reverses edges as needed, starts and ends split edges at their
split points, and writes a shared point once. A joined dangling end gives a straight
step to the split point.

#### `getEdgeGeometry(network, lines, edge, target?, offset?)` and `getEdgePointCount(network, edge)`

Write the longitude, latitude points of one edge, in path direction, into `target`
from value index `offset`. Without `target`, a new array of
`2 * getEdgePointCount(network, edge)` values is returned.

#### `haversineDistance(lon1, lat1, lon2, lat2)`

Great-circle distance in metres on the mean Earth sphere.

## Examples

The same builder serves many kinds of line data. Choose the options for what a
meeting of two lines means in the data.

### Road and street networks

Generalized road lines often stop a few metres short of the road that they join. Keep
T-junctions on and crossings off: roads that cross with no shared vertex are usually a
bridge over a road.

```typescript
const roads = buildLineNetwork(lines, {
  snapTolerance: 5,
  junctionTolerance: 50,
  splitAtSharedVertices: true
});
```

Build a directed network for one-way streets. Give each allowed direction its own
path, including both directions for two-way streets.

### River and drainage networks

Rivers flow downstream, so build a directed network from lines drawn in the flow
direction. Tributaries that end near a main stem join it as T-junctions.

`createTerrainDrainage` in `@math.gl/geospatial/terrain` returns a `receiver` for each
grid cell (`-1` for terminal and nodata cells) and the `contributingCells` count. It
does not return lines. Make one two-vertex path from each channel cell to its receiver:

```typescript
import {createTerrainDrainage} from '@math.gl/geospatial/terrain';

const {receiver, contributingCells} = createTerrainDrainage(field);
const positions: number[] = [];
const pathIndices: number[] = [0];
const center = (cell: number) => {
  const column = (cell % field.width) + 0.5;
  const row = Math.floor(cell / field.width) + 0.5;
  // Grid XY of the cell center; unproject converts it to longitude, latitude.
  return unproject([
    field.origin[0] + column * field.columnStep[0] + row * field.rowStep[0],
    field.origin[1] + column * field.columnStep[1] + row * field.rowStep[1]
  ]);
};
for (let cell = 0; cell < receiver.length; cell++) {
  if (receiver[cell] < 0 || contributingCells[cell] < minimumCells) continue;
  positions.push(...center(cell), ...center(receiver[cell]));
  pathIndices.push(positions.length / 2);
}
const rivers = buildLineNetwork(
  {
    positions: {value: new Float64Array(positions), size: 2},
    pathIndices: {value: new Uint32Array(pathIndices), size: 1}
  },
  {directed: true, snapTolerance: cellSize / 10, junctionTolerance: 0}
);
```

The cells share exact centers, so a small snap tolerance joins them, and T-junctions
can stay off. `fillTerrainDepressions` returns a receiver forest that also crosses flats
(`-1` for outlets, `-2` for disconnected cells), so the same loop works with it.

### Transit and rail

Use travel time as the weight. With one speed for each line, divide by the speed:

```typescript
const secondsPerMetre = Float64Array.from(speedsInMetresPerSecond, speed => 1 / speed);
const rail = buildLineNetwork(lines, {pathWeightFactors: secondsPerMetre});
```

Stations on a line are usually vertices of the line. Use `splitAtSharedVertices` so
that lines that share a station connect there.

### Utility networks

Pipes, cables and ducts connect only where the data says they connect. Use a small snap
tolerance, turn off T-junctions and keep crossings off. The graph then shows the
connectivity of the data, and a dangling end is a finding, not a gap to close.

```typescript
const utility = buildLineNetwork(lines, {
  snapTolerance: 0.01,
  junctionTolerance: 0,
  splitAtSharedVertices: true
});
// Nodes of degree 1 are open ends. Connected components show isolated parts.
```

### Survey and vessel track lines

Track lines cross each other with no shared vertex. Turn `splitAtCrossings` on to find
the crossings. Each crossing is a node of degree 4, and its edges give the track rows and
the positions along each track.

```typescript
const tracks = buildLineNetwork(lines, {junctionTolerance: 0, splitAtCrossings: true});
for (let node = 0; node < tracks.nodeCount; node++) {
  // A crossing node: read tracks.nodePositions[2 * node], [2 * node + 1], and find its
  // edges with buildLineNetworkAdjacency.
}
```

### Trails with a slope cost

The `edgeWeight` callback gets the position of each edge along its path. Sample the
elevation profile of the path at those fractions and add a cost for the climb:

```typescript
const trails = buildLineNetwork(lines, {
  junctionTolerance: 20,
  edgeWeight: (path, startFraction, endFraction, length) => {
    const climb = Math.max(0, elevationAt(path, endFraction) - elevationAt(path, startFraction));
    return length + 8 * climb;
  }
});
```

On an undirected network, the climb in one direction is the descent in the other. Build
a directed network with each trail in both directions when the cost depends on the
direction.

## Shortest paths

math.gl does not run the search. Feed `edgeSource`, `edgeTarget` and `edgeWeight` to a
GPU shortest-path kernel, such as the luma.gl graph algorithms, or to a CPU Dijkstra on
`buildLineNetworkAdjacency`. luma.gl requires finite weights. Before upload, apply
the same filter to all three GPU edge columns to remove edges with infinite
weight. Both search paths return a predecessor array for `getRouteEdges` and
`getRouteGeometry`. The route geometry can go straight to a path layer.

## Limits

- Coordinates are longitude and latitude in degrees. Projected coordinates are not
  supported.
- Snapping does not join points across the antimeridian or through a pole.
- The greedy snap order can give a different clustering than an all-pairs comparison
  where several clusters overlap within one tolerance.
- The builder makes no dual graph (lines as nodes) and does not read connector tables.
