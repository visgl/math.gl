// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './types';
import {getWellKnownDimensionSize, inferWellKnownGeometryDimension} from './types';

/** Parses one WKT geometry, including Z/M/ZM, collections, alternate MultiPoint, and empties. */
export function parseWKT(text: string): WellKnownGeometry {
  const parser = new WKTParser(text);
  const geometry = parser.parseGeometry(2);
  parser.assertComplete();
  return geometry;
}

/** Formats one geometry as WKT using an explicit or tuple-inferred semantic dimension. */
export function formatWKT(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension = inferWellKnownGeometryDimension(geometry)
): string {
  const dimensionToken = dimension === 'xy' ? '' : ` ${dimension.slice(2).toUpperCase()}`;
  if (geometry.type === 'GeometryCollection') {
    if (geometry.geometries.length === 0) return `GEOMETRYCOLLECTION${dimensionToken} EMPTY`;
    return `GEOMETRYCOLLECTION${dimensionToken} (${geometry.geometries.map(child => formatWKT(child, dimension)).join(', ')})`;
  }
  const type = geometry.type.toUpperCase();
  if (isEmptyCoordinates(geometry.coordinates)) return `${type}${dimensionToken} EMPTY`;
  return `${type}${dimensionToken} ${formatCoordinateNesting(geometry.coordinates, getGeometryDepth(geometry.type))}`;
}

class WKTParser {
  private readonly tokens: string[];
  private index = 0;

  constructor(text: string) {
    this.tokens = tokenizeWKT(text);
  }

  parseGeometry(inheritedDimensionSize: number): WellKnownGeometry {
    const type = this.takeWord().toUpperCase();
    let dimensionSize = inheritedDimensionSize;
    if (['Z', 'M', 'ZM'].includes(this.peek().toUpperCase())) {
      const dimension = this.take().toUpperCase();
      dimensionSize = dimension === 'ZM' ? 4 : 3;
    }
    if (this.peek().toUpperCase() === 'EMPTY') {
      this.take();
      return makeEmptyGeometry(type, dimensionSize);
    }
    if (type === 'GEOMETRYCOLLECTION') {
      this.expect('(');
      const geometries: WellKnownGeometry[] = [];
      if (this.peek() !== ')') {
        do geometries.push(this.parseGeometry(dimensionSize));
        while (this.takeIf(','));
      }
      this.expect(')');
      return {type: 'GeometryCollection', geometries};
    }
    const coordinates = this.parseCoordinateNesting(getWKTDepth(type), dimensionSize);
    return makeGeometry(type, coordinates);
  }

  assertComplete(): void {
    if (this.index !== this.tokens.length) throw new Error(`Unexpected WKT token ${this.peek()}`);
  }

  private parseCoordinateNesting(depth: number, dimensionSize: number): unknown {
    this.expect('(');
    if (depth === 0) {
      const coordinate = this.readCoordinate(dimensionSize);
      this.expect(')');
      return coordinate;
    }
    const values: unknown[] = [];
    if (this.peek() !== ')') {
      do {
        if (depth === 1 && this.peek() !== '(') {
          values.push(this.readCoordinate(dimensionSize));
        } else {
          values.push(this.parseCoordinateNesting(depth - 1, dimensionSize));
        }
      } while (this.takeIf(','));
    }
    this.expect(')');
    return values;
  }

  private readCoordinate(dimensionSize: number): number[] {
    const values: number[] = [];
    while (values.length < dimensionSize && isNumberToken(this.peek())) {
      values.push(Number(this.take()));
    }
    if (values.length < 2) throw new Error('WKT coordinate requires at least two numbers');
    return values;
  }

  private peek(): string {
    return this.tokens[this.index] || '';
  }

  private take(): string {
    if (this.index >= this.tokens.length) throw new Error('Unexpected end of WKT');
    return this.tokens[this.index++];
  }

  private takeWord(): string {
    const token = this.take();
    if (!/^[A-Za-z_]+$/.test(token)) throw new Error(`Expected WKT geometry type, found ${token}`);
    return token;
  }

  private takeIf(token: string): boolean {
    if (this.peek() !== token) return false;
    this.index++;
    return true;
  }

  private expect(token: string): void {
    const actual = this.take();
    if (actual !== token) throw new Error(`Expected WKT token ${token}, found ${actual}`);
  }
}

function tokenizeWKT(text: string): string[] {
  const tokens: string[] = [];
  const tokenPattern = /[A-Za-z_]+|[(),]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/gy;
  let index = 0;
  while (index < text.length) {
    while (index < text.length && /\s/.test(text[index])) index++;
    if (index === text.length) break;
    tokenPattern.lastIndex = index;
    const match = tokenPattern.exec(text);
    if (!match) {
      throw new Error(`Unexpected WKT character ${JSON.stringify(text[index])} at ${index}`);
    }
    tokens.push(match[0]);
    index = tokenPattern.lastIndex;
  }
  return tokens;
}

function formatCoordinateNesting(value: readonly unknown[], depth: number): string {
  if (depth === 0) return `(${(value as readonly number[]).map(formatNumber).join(' ')})`;
  return `(${value
    .map(child => {
      if (depth === 1) return (child as readonly number[]).map(formatNumber).join(' ');
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
