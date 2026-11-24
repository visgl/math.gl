// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './types';
import {getWellKnownDimensionSize, inferWellKnownGeometryDimension} from './types';

/** Options for parsing WKT text. */
export type WKTParseOptions = Readonly<{
  /** Infer unmarked coordinate dimensions for legacy WKT such as POINT (1 2 3). */
  inferDimensions?: boolean;
}>;

/** One parsed WKT geometry and its semantic dimension, including collection children. */
export type WKTParseResult = Readonly<{
  geometry: WellKnownGeometry;
  dimension: WellKnownDimension;
  children?: readonly WKTParseResult[];
}>;

/** Parses one WKT geometry, including Z/M/ZM, collections, alternate MultiPoint, and empties. */
export function parseWKT(text: string, options?: WKTParseOptions): WellKnownGeometry {
  const parser = new WKTParser(text);
  const result = parser.parseGeometry('xy', options ?? {}, false);
  parser.assertComplete();
  return result.geometry;
}

/** Parses WKT while preserving each geometry's declared or inferred semantic dimension. */
export function parseWKTWithMetadata(text: string, options: WKTParseOptions = {}): WKTParseResult {
  const parser = new WKTParser(text);
  const result = parser.parseGeometry('xy', options, true);
  parser.assertComplete();
  return result;
}

/** Options for counting WKT vertices without materializing geometry. */
export type WKTScanOptions = WKTParseOptions &
  Readonly<{
    /** Stops scanning as soon as this number of vertices is exceeded. */
    maximumVertices?: number;
  }>;

/** Counts validated WKT coordinate tuples without building geometry or coordinate arrays. */
export function countWKTVertices(text: string, options: WKTScanOptions = {}): number {
  const maximumVertices = options.maximumVertices ?? Infinity;
  if (
    maximumVertices !== Infinity &&
    (!Number.isSafeInteger(maximumVertices) || maximumVertices < 0)
  ) {
    throw new Error('WKT maximumVertices must be a non-negative safe integer');
  }
  const parser = new WKTParser(text);
  let count = 0;
  parser.scanGeometry('xy', options, () => {
    if (++count > maximumVertices) throw new Error('WKT vertex count exceeds maximumVertices');
  });
  parser.assertComplete();
  return count;
}

/** Formats one geometry as WKT using an explicit or tuple-inferred semantic dimension. */
export function formatWKT(
  geometry: WellKnownGeometry | WKTParseResult,
  dimension?: WellKnownDimension
): string {
  if (isWKTParseResult(geometry)) {
    return dimension === undefined
      ? formatWKTResult(geometry)
      : formatWKTGeometry(geometry.geometry, dimension);
  }
  return formatWKTGeometry(geometry, dimension ?? inferWellKnownGeometryDimension(geometry));
}

function formatWKTResult(result: WKTParseResult): string {
  return formatWKTGeometry(result.geometry, result.dimension, result.children);
}

function formatWKTGeometry(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension,
  children?: readonly WKTParseResult[]
): string {
  const dimensionToken = dimension === 'xy' ? '' : ' ' + dimension.slice(2).toUpperCase();
  if (geometry.type === 'GeometryCollection') {
    if (geometry.geometries.length === 0) return 'GEOMETRYCOLLECTION' + dimensionToken + ' EMPTY';
    const formattedChildren = children
      ? children.map(formatWKTResult)
      : geometry.geometries.map(child => formatWKTGeometry(child, dimension));
    return 'GEOMETRYCOLLECTION' + dimensionToken + ' (' + formattedChildren.join(', ') + ')';
  }
  const type = geometry.type.toUpperCase();
  const isEmpty =
    geometry.type === 'MultiPoint'
      ? geometry.coordinates.length === 0
      : isEmptyCoordinates(geometry.coordinates);
  if (isEmpty) return type + dimensionToken + ' EMPTY';
  return (
    type +
    dimensionToken +
    ' ' +
    formatCoordinateNesting(
      geometry.coordinates,
      getGeometryDepth(geometry.type),
      geometry.type === 'MultiPoint'
    )
  );
}

function isWKTParseResult(value: WellKnownGeometry | WKTParseResult): value is WKTParseResult {
  return 'geometry' in value && 'dimension' in value;
}

class WKTParser {
  /** Sticky grammar with only one token of lookahead. */
  private readonly tokenPattern =
    /[A-Za-z_]+|[(),]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/gy;
  /** Offset immediately after the most recently read token. */
  private offset = 0;
  /** Buffered unread token, or an empty string at end of input. */
  private lookahead?: string;

  constructor(private readonly text: string) {}

  /** Reads a type and its optional dimension marker. */
  private readHeader(inheritedDimension: WellKnownDimension) {
    const type = this.takeWord().toUpperCase();
    const token = this.peek().toUpperCase();
    const hasExplicitDimension = token === 'Z' || token === 'M' || token === 'ZM';
    if (hasExplicitDimension) this.take();
    const dimension: WellKnownDimension =
      token === 'Z' ? 'xyz' : token === 'M' ? 'xym' : token === 'ZM' ? 'xyzm' : inheritedDimension;
    return {type, dimension, hasExplicitDimension};
  }

  /** Visits vertex tuples without retaining their ordinates. */
  scanGeometry(
    inheritedDimension: WellKnownDimension,
    options: WKTParseOptions,
    visitVertex: () => void,
    depth = 0
  ): void {
    if (depth > 64) throw new Error('WKT geometry nesting exceeds 64 levels');
    const {type, dimension, hasExplicitDimension} = this.readHeader(inheritedDimension);
    const coordinateDepth = type === 'GEOMETRYCOLLECTION' ? null : getWKTDepth(type);
    if (this.peek().toUpperCase() === 'EMPTY') {
      this.take();
      return;
    }
    if (coordinateDepth === null) {
      this.expect('(');
      if (this.peek() !== ')') {
        do this.scanGeometry(dimension, options, visitVertex, depth + 1);
        while (this.takeIf(','));
      }
      this.expect(')');
      return;
    }
    const infer = options.inferDimensions && !hasExplicitDimension && inheritedDimension === 'xy';
    let coordinateSize: number | undefined = infer
      ? undefined
      : getWellKnownDimensionSize(dimension);
    this.parseCoordinateNesting(
      coordinateDepth,
      coordinateSize ?? null,
      type === 'MULTIPOINT',
      size => {
        coordinateSize ??= size;
        if (size !== coordinateSize)
          throw new Error('WKT geometry contains inconsistent coordinate dimensions');
        visitVertex();
      }
    );
  }

  parseGeometry(
    inheritedDimension: WellKnownDimension,
    options: WKTParseOptions,
    validateInheritedDimensions: boolean
  ): WKTParseResult {
    const {
      type,
      dimension: declaredDimension,
      hasExplicitDimension
    } = this.readHeader(inheritedDimension);
    let dimension = declaredDimension;
    const dimensionSize = getWellKnownDimensionSize(dimension);
    if (this.peek().toUpperCase() === 'EMPTY') {
      this.take();
      return {geometry: makeEmptyGeometry(type, dimensionSize), dimension};
    }
    if (type === 'GEOMETRYCOLLECTION') {
      this.expect('(');
      const children: WKTParseResult[] = [];
      if (this.peek() !== ')') {
        do children.push(this.parseGeometry(dimension, options, validateInheritedDimensions));
        while (this.takeIf(','));
      }
      this.expect(')');
      return {
        geometry: {type: 'GeometryCollection', geometries: children.map(child => child.geometry)},
        dimension,
        children
      };
    }
    const inferDimension = Boolean(
      options.inferDimensions && !hasExplicitDimension && inheritedDimension === 'xy'
    );
    const coordinates = this.parseCoordinateNesting(
      getWKTDepth(type),
      inferDimension ? null : dimensionSize,
      type === 'MULTIPOINT'
    );
    const coordinateValues = coordinates as readonly unknown[];
    if (inferDimension) {
      const inferredSize = inferCoordinateSize(coordinateValues);
      if (inferredSize !== null) dimension = getDimensionForSize(inferredSize);
    } else if (hasExplicitDimension || validateInheritedDimensions) {
      assertCoordinateSize(coordinateValues, dimensionSize);
    }
    return {geometry: makeGeometry(type, coordinates), dimension};
  }

  assertComplete(): void {
    if (this.peek()) throw new Error(`Unexpected WKT token ${this.peek()}`);
  }

  private parseCoordinateNesting(
    depth: number,
    dimensionSize: number | null,
    allowEmptyPoints = false,
    visitCoordinate?: (size: number) => void
  ): unknown {
    this.expect('(');
    if (depth === 0) {
      const coordinate = this.readCoordinate(dimensionSize, visitCoordinate);
      this.expect(')');
      return coordinate;
    }
    const values: unknown[] | undefined = visitCoordinate ? undefined : [];
    if (this.peek() !== ')') {
      do {
        if (allowEmptyPoints && depth === 1 && this.peek().toUpperCase() === 'EMPTY') {
          this.take();
          values?.push([]);
        } else if (depth === 1 && this.peek() !== '(') {
          const coordinate = this.readCoordinate(dimensionSize, visitCoordinate);
          values?.push(coordinate);
        } else {
          const child = this.parseCoordinateNesting(
            depth - 1,
            dimensionSize,
            false,
            visitCoordinate
          );
          values?.push(child);
        }
      } while (this.takeIf(','));
    }
    this.expect(')');
    return values;
  }

  /** Consumes one tuple, retaining ordinates only when parsing geometry. */
  private readCoordinate(
    dimensionSize: number | null,
    visit?: (size: number) => void
  ): number[] | undefined {
    const values: number[] | undefined = visit ? undefined : [];
    let size = 0;
    while ((dimensionSize === null || size < dimensionSize) && isNumberToken(this.peek())) {
      const token = this.take();
      values?.push(Number(token));
      size++;
    }
    if (size < 2) throw new Error('WKT coordinate requires at least two numbers');
    if (size > 4) throw new Error('WKT coordinates cannot contain more than four numbers');
    visit?.(size);
    return values;
  }

  private peek(): string {
    if (this.lookahead !== undefined) return this.lookahead;
    while (this.offset < this.text.length && /\s/.test(this.text[this.offset]!)) this.offset++;
    if (this.offset === this.text.length) {
      this.lookahead = '';
      return this.lookahead;
    }
    this.tokenPattern.lastIndex = this.offset;
    const match = this.tokenPattern.exec(this.text);
    if (!match) {
      throw new Error(
        `Unexpected WKT character ${JSON.stringify(this.text[this.offset])} at ${this.offset}`
      );
    }
    this.offset = this.tokenPattern.lastIndex;
    this.lookahead = match[0];
    return this.lookahead;
  }

  private take(): string {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of WKT');
    this.lookahead = undefined;
    return token;
  }

  private takeWord(): string {
    const token = this.take();
    if (!/^[A-Za-z_]+$/.test(token)) throw new Error(`Expected WKT geometry type, found ${token}`);
    return token;
  }

  private takeIf(token: string): boolean {
    if (this.peek() !== token) return false;
    this.take();
    return true;
  }

  private expect(token: string): void {
    const actual = this.take();
    if (actual !== token) throw new Error(`Expected WKT token ${token}, found ${actual}`);
  }
}

function inferCoordinateSize(value: readonly unknown[]): number | null {
  let coordinateSize: number | null = null;
  const visit = (coordinates: readonly unknown[]): void => {
    if (coordinates.length === 0) return;
    if (typeof coordinates[0] === 'number') {
      if (coordinates.length < 2 || coordinates.length > 4) {
        throw new Error('WKT coordinates must contain between two and four numbers');
      }
      if (coordinateSize !== null && coordinateSize !== coordinates.length) {
        throw new Error('WKT geometry contains inconsistent coordinate dimensions');
      }
      coordinateSize = coordinates.length;
      return;
    }
    for (const child of coordinates) visit(child as readonly unknown[]);
  };
  visit(value);
  return coordinateSize;
}

function assertCoordinateSize(value: readonly unknown[], expectedSize: number): void {
  const actualSize = inferCoordinateSize(value);
  if (actualSize !== null && actualSize !== expectedSize) {
    throw new Error('WKT coordinate dimension does not match declared dimension ' + expectedSize);
  }
}

function getDimensionForSize(size: number): WellKnownDimension {
  switch (size) {
    case 2:
      return 'xy';
    case 3:
      return 'xyz';
    case 4:
      return 'xyzm';
    default:
      throw new Error('Unsupported WKT coordinate dimension ' + size);
  }
}

function formatCoordinateNesting(
  value: readonly unknown[],
  depth: number,
  allowEmptyPoints = false
): string {
  if (depth === 0) return `(${(value as readonly number[]).map(formatNumber).join(' ')})`;
  return `(${value
    .map(child => {
      if (depth === 1) {
        const coordinate = child as readonly number[];
        if (allowEmptyPoints && isEmptyCoordinates(coordinate)) return 'EMPTY';
        return coordinate.map(formatNumber).join(' ');
      }
      return formatCoordinateNesting(child as readonly unknown[], depth - 1);
    })
    .join(', ')})`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'NaN';
  return String(value);
}

function getGeometryDepth(type: Exclude<WellKnownGeometry['type'], 'GeometryCollection'>): number {
  switch (type) {
    case 'Point':
      return 0;
    case 'LineString':
    case 'MultiPoint':
      return 1;
    case 'Polygon':
    case 'MultiLineString':
      return 2;
    case 'MultiPolygon':
      return 3;
  }
}

function getWKTDepth(type: string): number {
  switch (type) {
    case 'POINT':
      return 0;
    case 'LINESTRING':
      return 1;
    case 'POLYGON':
      return 2;
    case 'MULTIPOINT':
      return 1;
    case 'MULTILINESTRING':
      return 2;
    case 'MULTIPOLYGON':
      return 3;
    default:
      throw new Error(`Unsupported WKT geometry type ${type}`);
  }
}

function makeGeometry(type: string, coordinates: unknown): WellKnownGeometry {
  const canonical = type[0] + type.slice(1).toLowerCase();
  const names: Record<string, WellKnownGeometry['type']> = {
    Point: 'Point',
    Linestring: 'LineString',
    Polygon: 'Polygon',
    Multipoint: 'MultiPoint',
    Multilinestring: 'MultiLineString',
    Multipolygon: 'MultiPolygon'
  };
  const geometryType = names[canonical];
  if (!geometryType) throw new Error(`Unsupported WKT geometry type ${type}`);
  return {type: geometryType, coordinates} as WellKnownGeometry;
}

function makeEmptyGeometry(type: string, dimensionSize: number): WellKnownGeometry {
  if (type === 'GEOMETRYCOLLECTION') return {type: 'GeometryCollection', geometries: []};
  if (type === 'POINT') {
    return {
      type: 'Point',
      coordinates: new Array(getValidDimensionSize(dimensionSize)).fill(Number.NaN)
    };
  }
  return makeGeometry(type, []);
}

function getValidDimensionSize(size: number): 2 | 3 | 4 {
  if (size === 2 || size === 3 || size === 4) return size;
  return getWellKnownDimensionSize('xy');
}

function isEmptyCoordinates(value: readonly unknown[]): boolean {
  if (value.length === 0) return true;
  if (typeof value[0] === 'number') {
    return (value as readonly number[]).every(component => !Number.isFinite(component));
  }
  return value.every(child => isEmptyCoordinates(child as readonly unknown[]));
}

function isNumberToken(token: string): boolean {
  return token !== '' && Number.isFinite(Number(token));
}
