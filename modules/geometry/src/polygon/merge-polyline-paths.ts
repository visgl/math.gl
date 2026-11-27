// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Coordinates in the path order of one line component. */
type Path = readonly (readonly number[])[];

/** A line component incident to an endpoint, with its orientation from that endpoint. */
type IncidentPath = {
  /** Index of the original line component. */
  index: number;
  /** Whether the component starts at this endpoint. */
  forward: boolean;
};

/** Paths incident to an exact XY endpoint. A closed path contributes two incidences. */
type Endpoint = IncidentPath[];

/** An input line with its start and end junctions. */
type MergePath = {
  /** Original coordinates in input order. */
  path: Path;
  /** Junction at the first vertex. */
  start: Endpoint;
  /** Junction at the final vertex. */
  end: Endpoint;
};

/** Walks exact degree-two endpoint chains, stopping at branches and retaining loops. */
export function mergePolylinePaths(paths: readonly Path[]): Path[] {
  const columns = new Map<number, Map<number, Endpoint>>();
  /** Looks up a shared endpoint using exact XY ordinates. */
  function endpoint(coordinate: readonly number[]): Endpoint {
    const x = coordinate[0]!;
    const y = coordinate[1]!;
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('Polyline endpoints must be finite');
    let column = columns.get(x);
    if (!column) {
      column = new Map();
      columns.set(x, column);
    }
    let node = column.get(y);
    if (!node) {
      node = [];
      column.set(y, node);
    }
    return node;
  }

  const lines: MergePath[] = [];
  for (const path of paths) {
    if (path.length < 2) continue;
    const start = endpoint(path[0]!);
    const end = endpoint(path[path.length - 1]!);
    const index = lines.length;
    start.push({index, forward: true});
    end.push({index, forward: false});
    lines.push({path, start, end});
  }

  const used = new Uint8Array(lines.length);
  const merged: Path[] = [];
  /** Writes a chain once, using the direction favored by its original components. */
  function append(first: IncidentPath): void {
    let edge: IncidentPath | undefined = first;
    let orientation = 0;
    const path: (readonly number[])[] = [];
    while (edge && !used[edge.index]) {
      const {index, forward} = edge;
      const line = lines[index]!;
      const offset = path.length ? 1 : 0;
      used[index] = 1;
      orientation += forward ? 1 : -1;
      for (let point = offset; point < line.path.length; point++)
        path.push(line.path[forward ? point : line.path.length - point - 1]!);
      const node = forward ? line.end : line.start;
      edge = node.length === 2 ? node[used[node[0]!.index] ? 1 : 0] : undefined;
    }
    if (orientation < 0) path.reverse();
    merged.push(path);
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    if (used[index]) continue;
    if (line.start.length !== 2) append({index, forward: true});
    else if (line.end.length !== 2) append({index, forward: false});
  }
  for (let index = 0; index < lines.length; index++) {
    if (!used[index]) append({index, forward: true});
  }
  return merged;
}
