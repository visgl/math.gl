// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original application-supplied coordinate operation selection; no database or model data.

/** Geographic bounds in degrees: west, south, east, north. West > east crosses the antimeridian. */
export type OperationArea = readonly [west: number, south: number, east: number, north: number];
/** Inclusive decimal-year interval, separate from coordinate M values. */
export type OperationEpochRange = readonly [start: number, end: number];

/** Identity of application-prepared grid data. Both strings must match at selection time. */
export type OperationGrid = {readonly id: string; readonly revision: string};
/** Application-reviewed source and pinned revision of the operation metadata. */
export type OperationProvenance = {
  readonly authority: string;
  readonly version: string;
  readonly reference: string;
};

/** Reviewed compound/frame identities; frame epoch is not the coordinate epoch. */
export type OperationCRSMetadata = {
  readonly horizontalCRS: string;
  readonly verticalCRS?: string;
  readonly referenceFrame: string;
  readonly frameKind: 'static' | 'dynamic';
  readonly frameEpoch?: number;
};
/** Application-owned model revision and reviewed data terms, not a license certificate. */
export type OperationModel = OperationGrid & {
  readonly license: string;
  readonly termsReference: string;
};

/** A directed, application-reviewed operation; the payload is never called or copied. */
export type CoordinateOperation<T> = {
  readonly id: string;
  readonly sourceCRS: string;
  readonly targetCRS: string;
  readonly area: OperationArea;
  /** Conservative covered rectangles. A request must fit entirely in one cell. */
  readonly coverage?: readonly OperationArea[];
  readonly sourceMetadata?: OperationCRSMetadata;
  readonly targetMetadata?: OperationCRSMetadata;
  readonly models?: readonly OperationModel[];
  /** null explicitly declares that this operation has no epoch restriction. */
  readonly epochRange: OperationEpochRange | null;
  /** Declared accuracy in metres; null means unknown, not zero. */
  readonly accuracyMeters: number | null;
  readonly ballpark?: boolean;
  readonly grids?: readonly OperationGrid[];
  readonly provenance: OperationProvenance;
  readonly operation: T;
};

export type OperationSelectionRequest = {
  readonly sourceCRS: string;
  readonly targetCRS: string;
  readonly area: OperationArea;
  /** A coordinate epoch or the inclusive range of a batch's epochs. */
  readonly epoch?: number | OperationEpochRange;
  readonly availableGrids?: readonly OperationGrid[];
  readonly availableModels?: readonly OperationGrid[];
  readonly sourceMetadata?: OperationCRSMetadata;
  readonly targetMetadata?: OperationCRSMetadata;
  readonly maxAccuracyMeters?: number;
  readonly allowUnknownAccuracy?: boolean;
  readonly allowBallpark?: boolean;
};

export type OperationRejectionReason =
  | 'source-crs'
  | 'target-crs'
  | 'area'
  | 'epoch-required'
  | 'epoch'
  | 'grid'
  | 'accuracy-unknown'
  | 'accuracy'
  | 'ballpark'
  | 'coverage'
  | 'source-metadata'
  | 'target-metadata'
  | 'model';

export type OperationRejection<T> = {
  readonly candidate: CoordinateOperation<T>;
  readonly reasons: readonly OperationRejectionReason[];
  readonly missingGrids: readonly OperationGrid[];
  readonly missingModels: readonly OperationModel[];
};
export type OperationSelection<T> = {
  readonly selected: CoordinateOperation<T> | undefined;
  /** Eligible operations in rank order. */
  readonly candidates: readonly CoordinateOperation<T>[];
  readonly rejected: readonly OperationRejection<T>[];
};

type Request = {
  sourceCRS: string;
  targetCRS: string;
  area: OperationArea;
  epoch: OperationEpochRange | undefined;
  grids: Map<string, Set<string>>;
  models: readonly OperationGrid[];
  sourceMetadata?: OperationCRSMetadata;
  targetMetadata?: OperationCRSMetadata;
  maxAccuracyMeters: number | undefined;
  allowUnknownAccuracy: boolean;
  allowBallpark: boolean;
};
const REASONS: readonly OperationRejectionReason[] = [
  'source-crs',
  'target-crs',
  'area',
  'epoch-required',
  'epoch',
  'grid',
  'accuracy-unknown',
  'accuracy',
  'ballpark',
  'coverage',
  'source-metadata',
  'target-metadata',
  'model'
];

/**
 * Optional metadata-only catalogue. Rank by non-ballpark, known accuracy, lower
 * accuracy in metres, then code-unit identifier order. No downloads, CRS inference,
 * inverse synthesis or execution; select once before processing a coordinate batch.
 */
export class OperationCatalog<T> {
  readonly operations: readonly CoordinateOperation<T>[];

  constructor(operations: readonly CoordinateOperation<T>[]) {
    if (!Array.isArray(operations)) throw new Error('Operations must be an array');
    const ids = new Set<string>();
    const snapshots: CoordinateOperation<T>[] = [];
    for (const candidate of operations) {
      const snapshot = snapshotOperation<T>(candidate);
      if (ids.has(snapshot.id)) throw new Error(`Duplicate operation id: ${snapshot.id}`);
      ids.add(snapshot.id);
      snapshots.push(snapshot);
    }
    this.operations = Object.freeze(snapshots.sort(compareOperations));
    // Prevent replacement of reviewed metadata at runtime, too. Payload ownership stays with the caller.
    Object.freeze(this);
  }

  /** Best eligible operation, or undefined. Malformed metadata/request values throw. */
  select(request: OperationSelectionRequest): CoordinateOperation<T> | undefined {
    const normalized = normalizeRequest(request);
    for (const candidate of this.operations) {
      if (rejectionMask(candidate, normalized) === 0) return candidate;
    }
    return undefined;
  }

  /** Explain eligibility without constructing, preloading or executing any payload. */
  inspect(request: OperationSelectionRequest): OperationSelection<T> {
    const normalized = normalizeRequest(request);
    const candidates: CoordinateOperation<T>[] = [];
    const rejected: OperationRejection<T>[] = [];
    for (const candidate of this.operations) {
      const mask = rejectionMask(candidate, normalized);
      if (mask === 0) {
        candidates.push(candidate);
      } else {
        const reasons = REASONS.filter((_, index) => Boolean(mask & (1 << index)));
        const missingGrids = (candidate.grids || []).filter(grid => !hasGrid(normalized, grid));
        rejected.push(
          Object.freeze({
            candidate,
            reasons: Object.freeze(reasons),
            missingGrids: Object.freeze(missingGrids),
            missingModels: Object.freeze(
              (candidate.models || []).filter(model => !hasModel(normalized, model))
            )
          })
        );
      }
    }
    return Object.freeze({
      selected: candidates[0],
      candidates: Object.freeze(candidates),
      rejected: Object.freeze(rejected)
    });
  }
}

function rejectionMask<T>(candidate: CoordinateOperation<T>, request: Request): number {
  let mask = 0;
  if (candidate.sourceCRS !== request.sourceCRS) mask |= 1 << 0;
  if (candidate.targetCRS !== request.targetCRS) mask |= 1 << 1;
  if (!containsArea(candidate.area, request.area)) mask |= 1 << 2;
  if (candidate.epochRange) {
    if (!request.epoch) mask |= 1 << 3;
    else if (
      request.epoch[0] < candidate.epochRange[0] ||
      request.epoch[1] > candidate.epochRange[1]
    )
      mask |= 1 << 4;
  }
  for (const grid of candidate.grids || []) {
    if (!hasGrid(request, grid)) {
      mask |= 1 << 5;
      break;
    }
  }
  if (candidate.accuracyMeters === null) {
    // An unknown accuracy can never satisfy a numerical accuracy ceiling.
    if (!request.allowUnknownAccuracy || request.maxAccuracyMeters !== undefined) mask |= 1 << 6;
  } else if (
    request.maxAccuracyMeters !== undefined &&
    candidate.accuracyMeters > request.maxAccuracyMeters
  )
    mask |= 1 << 7;
  if (candidate.ballpark && !request.allowBallpark) mask |= 1 << 8;
  if (candidate.coverage && !candidate.coverage.some(cell => containsArea(cell, request.area)))
    mask |= 1 << 9;
  if (!sameMetadata(candidate.sourceMetadata, request.sourceMetadata)) mask |= 1 << 10;
  if (!sameMetadata(candidate.targetMetadata, request.targetMetadata)) mask |= 1 << 11;
  if (candidate.models?.some(model => !hasModel(request, model))) mask |= 1 << 12;
  return mask;
}
function hasModel(request: Request, model: OperationModel): boolean {
  return request.models.some(
    available => available.id === model.id && available.revision === model.revision
  );
}
function sameMetadata(
  a: OperationCRSMetadata | undefined,
  b: OperationCRSMetadata | undefined
): boolean {
  if (!a || !b) return a === b;
  return (
    a.horizontalCRS === b.horizontalCRS &&
    a.verticalCRS === b.verticalCRS &&
    a.referenceFrame === b.referenceFrame &&
    a.frameKind === b.frameKind &&
    a.frameEpoch === b.frameEpoch
  );
}

function hasGrid(request: Request, grid: OperationGrid): boolean {
  return Boolean(request.grids.get(grid.id)?.has(grid.revision));
}

function containsArea(outer: OperationArea, inner: OperationArea): boolean {
  if (inner[1] < outer[1] || inner[3] > outer[3]) return false;
  if (outer[0] === -180 && outer[2] === 180) return true;
  const innerPoint = inner[0] === inner[2] || (inner[0] === 180 && inner[2] === -180);
  if (innerPoint) return containsLongitude(outer, inner[0]);
  if (outer[0] === outer[2] || (outer[0] === 180 && outer[2] === -180)) return false;
  // Canonical seam endpoints for nonzero arcs. Compare intervals directly: adding
  // 360 to tiny differences could round an out-of-area point onto the boundary.
  const west = outer[0] === 180 ? -180 : outer[0];
  const east = outer[2] === -180 ? 180 : outer[2];
  const innerWest = inner[0] === 180 ? -180 : inner[0];
  const innerEast = inner[2] === -180 ? 180 : inner[2];
  if (west <= east) return innerWest <= innerEast && innerWest >= west && innerEast <= east;
  return innerWest > innerEast
    ? innerWest >= west && innerEast <= east
    : innerWest >= west || innerEast <= east;
}

function containsLongitude(area: OperationArea, longitude: number): boolean {
  // Both seam spellings identify the same point, including degenerate seam arcs.
  if (longitude === -180 || longitude === 180) {
    return area[0] === -180 || area[2] === 180 || area[0] > area[2];
  }
  return area[0] <= area[2]
    ? longitude >= area[0] && longitude <= area[2]
    : longitude >= area[0] || longitude <= area[2];
}

function compareOperations<T>(a: CoordinateOperation<T>, b: CoordinateOperation<T>): number {
  const ballpark = Number(Boolean(a.ballpark)) - Number(Boolean(b.ballpark));
  if (ballpark) return ballpark;
  if (a.accuracyMeters !== b.accuracyMeters) {
    if (a.accuracyMeters === null) return 1;
    if (b.accuracyMeters === null) return -1;
    return a.accuracyMeters - b.accuracyMeters;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function snapshotOperation<T>(candidate: CoordinateOperation<T>): CoordinateOperation<T> {
  if (!candidate || typeof candidate !== 'object')
    throw new Error('Operation metadata must be an object');
  const id = text(candidate.id, 'operation id');
  const sourceCRS = text(candidate.sourceCRS, 'sourceCRS');
  const targetCRS = text(candidate.targetCRS, 'targetCRS');
  const area = snapshotArea(candidate.area);
  const sourceMetadata = snapshotMetadata(candidate.sourceMetadata),
    targetMetadata = snapshotMetadata(candidate.targetMetadata);
  let coverage: readonly OperationArea[] | undefined;
  if (candidate.coverage !== undefined) {
    if (!Array.isArray(candidate.coverage) || !candidate.coverage.length)
      throw new Error('Nonempty conservative coverage cells required');
    coverage = Object.freeze(
      candidate.coverage.map(cell => {
        const snapshot = snapshotArea(cell);
        if (!containsArea(area, snapshot))
          throw new Error('Coverage cells must fit operation area');
        return snapshot;
      })
    );
  }
  let models: readonly OperationModel[] | undefined;
  if (candidate.models !== undefined) {
    const identities = snapshotGrids(candidate.models);
    models = Object.freeze(
      identities.map((identity, i) =>
        Object.freeze({
          ...identity,
          license: text(candidate.models[i].license, 'model license'),
          termsReference: text(candidate.models[i].termsReference, 'model termsReference')
        })
      )
    );
  }
  const epochRange = candidate.epochRange === null ? null : snapshotEpoch(candidate.epochRange);
  if (
    (sourceMetadata?.frameKind === 'dynamic' || targetMetadata?.frameKind === 'dynamic') &&
    !epochRange
  )
    throw new Error('Dynamic frame operations require a reviewed epochRange');
  const accuracyMeters = candidate.accuracyMeters;
  if (accuracyMeters !== null) nonnegative(accuracyMeters, 'accuracyMeters');
  const ballpark = optionalBoolean(candidate.ballpark, 'ballpark');
  const grids = snapshotGrids(candidate.grids);
  const provenance = Object.freeze({
    authority: text(candidate.provenance.authority, 'provenance authority'),
    version: text(candidate.provenance.version, 'provenance version'),
    reference: text(candidate.provenance.reference, 'provenance reference')
  });
  return Object.freeze({
    id,
    sourceCRS,
    targetCRS,
    area,
    coverage,
    sourceMetadata,
    targetMetadata,
    models,
    epochRange,
    accuracyMeters,
    ballpark,
    grids,
    provenance,
    operation: candidate.operation
  });
}

function normalizeRequest(request: OperationSelectionRequest): Request {
  const sourceCRS = text(request.sourceCRS, 'sourceCRS');
  const targetCRS = text(request.targetCRS, 'targetCRS');
  const area = snapshotArea(request.area);
  const epoch =
    request.epoch === undefined
      ? undefined
      : typeof request.epoch === 'number'
        ? snapshotEpoch([request.epoch, request.epoch])
        : snapshotEpoch(request.epoch);
  const maxAccuracyMeters = request.maxAccuracyMeters;
  if (maxAccuracyMeters !== undefined) nonnegative(maxAccuracyMeters, 'maxAccuracyMeters');
  const allowUnknownAccuracy = optionalBoolean(
    request.allowUnknownAccuracy,
    'allowUnknownAccuracy'
  );
  const allowBallpark = optionalBoolean(request.allowBallpark, 'allowBallpark');
  const grids = new Map<string, Set<string>>();
  for (const grid of snapshotGrids(request.availableGrids)) {
    let revisions = grids.get(grid.id);
    if (!revisions) {
      revisions = new Set();
      grids.set(grid.id, revisions);
    }
    revisions.add(grid.revision);
  }
  return {
    sourceCRS,
    targetCRS,
    area,
    epoch,
    grids,
    models: snapshotGrids(request.availableModels),
    sourceMetadata: snapshotMetadata(request.sourceMetadata),
    targetMetadata: snapshotMetadata(request.targetMetadata),
    maxAccuracyMeters,
    allowUnknownAccuracy,
    allowBallpark
  };
}

function snapshotArea(area: OperationArea): OperationArea {
  if (
    !Array.isArray(area) ||
    area.length !== 4 ||
    !Number.isFinite(area[0]) ||
    !Number.isFinite(area[1]) ||
    !Number.isFinite(area[2]) ||
    !Number.isFinite(area[3]) ||
    area[0] < -180 ||
    area[0] > 180 ||
    area[2] < -180 ||
    area[2] > 180 ||
    area[1] < -90 ||
    area[3] > 90 ||
    area[1] > area[3]
  ) {
    throw new Error('Operation area must be [west, south, east, north] in geographic degrees');
  }
  return Object.freeze([area[0], area[1], area[2], area[3]]);
}

function snapshotEpoch(epoch: OperationEpochRange): OperationEpochRange {
  if (
    !Array.isArray(epoch) ||
    epoch.length !== 2 ||
    !Number.isFinite(epoch[0]) ||
    !Number.isFinite(epoch[1]) ||
    epoch[0] > epoch[1]
  ) {
    throw new Error('Operation epoch range must contain two finite, ordered decimal years');
  }
  return Object.freeze([epoch[0], epoch[1]]);
}

function snapshotGrids(grids: readonly OperationGrid[] = []): readonly OperationGrid[] {
  if (!Array.isArray(grids)) throw new Error('Operation grids must be an array');
  const snapshots: OperationGrid[] = [];
  for (const grid of grids) {
    if (!grid || typeof grid !== 'object') throw new Error('Operation grid must be an object');
    snapshots.push(
      Object.freeze({id: text(grid.id, 'grid id'), revision: text(grid.revision, 'grid revision')})
    );
  }
  return Object.freeze(snapshots);
}

function text(value: string, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Operation ${label} must be a nonempty string`);
  return value;
}

function nonnegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`Operation ${label} must be finite and nonnegative`);
}

function optionalBoolean(value: boolean | undefined, label: string): boolean {
  if (value !== undefined && typeof value !== 'boolean')
    throw new Error(`Operation ${label} must be boolean`);
  return value === true;
}

function snapshotMetadata(
  value: OperationCRSMetadata | undefined
): OperationCRSMetadata | undefined {
  if (value === undefined) return undefined;
  if (!value || (value.frameKind !== 'static' && value.frameKind !== 'dynamic'))
    throw new Error('Explicit static/dynamic frame metadata required');
  if (
    (value.frameKind === 'dynamic' && !Number.isFinite(value.frameEpoch)) ||
    (value.frameKind === 'static' && value.frameEpoch !== undefined)
  )
    throw new Error('Dynamic frame requires finite frameEpoch; static frame has none');
  return Object.freeze({
    horizontalCRS: text(value.horizontalCRS, 'horizontalCRS'),
    verticalCRS:
      value.verticalCRS === undefined ? undefined : text(value.verticalCRS, 'verticalCRS'),
    referenceFrame: text(value.referenceFrame, 'referenceFrame'),
    frameKind: value.frameKind,
    frameEpoch: value.frameEpoch
  });
}
