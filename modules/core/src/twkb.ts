// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from './arrow-integration/wkb/types';

export type {WellKnownDimension, WellKnownGeometry};

/** Controls decimal quantization and the interpretation of three-ordinate tuples. */
export type TWKBWriteOptions = Readonly<{
  /** XY decimal precision from -8 to 7. Defaults to 5. */
  precision?: number;
  /** Z decimal precision from 0 to 7. Defaults to 0. */
  zPrecision?: number;
  /** M decimal precision from 0 to 7. Defaults to 0. */
  mPrecision?: number;
  /** Coordinate dimension override. By default individual geometries infer XYZ from triples. */
  dimension?: WellKnownDimension;
}>;

/** The decoded geometry and the semantic dimension declared in its header. */
export type TWKBParseResult = Readonly<{
  /** The decoded geometry. */
  geometry: WellKnownGeometry;
  /** The root header's XY, XYZ, XYM, or XYZM semantics. */
  dimension: WellKnownDimension;
  /** Dimension metadata for decoded collection members. */
  children?: readonly TWKBParseResult[];
}>;

/** TWKB geometry types in header order. */
const GEOMETRY_TYPES = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
] as const;

/** Maximum number of enclosing collections. */
const MAXIMUM_DEPTH = 64;

/** Parses one TWKB geometry. Optional bounding boxes and component IDs are consumed. */
export function parseTWKB(input: ArrayBufferLike | ArrayBufferView): TWKBParseResult {
  const view = ArrayBuffer.isView(input)
    ? new DataView(input.buffer, input.byteOffset, input.byteLength)
    : new DataView(input);
  const reader = new TWKBReader(view);
  const result = readGeometry(reader, 0);
  if (reader.offset !== view.byteLength) throw new Error('TWKB contains trailing bytes');
  return result;
}

/** Encodes a quantized geometry in TWKB. */
export function writeTWKB(geometry: WellKnownGeometry, options: TWKBWriteOptions = {}): Uint8Array {
  const precision = options.precision ?? 5;
  const zPrecision = options.zPrecision ?? 0;
  const mPrecision = options.mPrecision ?? 0;
  validatePrecision(precision, -8);
  validatePrecision(zPrecision, 0);
  validatePrecision(mPrecision, 0);
  const writer = new TWKBWriter();
  writeGeometry(
    writer,
    geometry,
    {precision, zPrecision, mPrecision, dimension: options.dimension},
    0
  );
  return writer.finish();
}

/** Tracks the cursor and current declared geometry extent. */
class TWKBReader {
  /** Offset relative to the input view. */
  offset = 0;
  /** Exclusive read boundary. */
  limit: number;

  /** Initializes the cursor over the borrowed view. */
  constructor(private readonly view: DataView) {
    this.limit = view.byteLength;
  }

  /** Reads a byte and advances the cursor. */
  byte(): number {
    if (this.offset >= this.limit) throw new Error('Unexpected end of TWKB');
    return this.view.getUint8(this.offset++);
  }

  /** Reads an unsigned varint with a 64-bit bound. */
  unsigned(): bigint {
    let value = 0n;
    for (let shift = 0n; shift <= 63n; shift += 7n) {
      const byte = this.byte();
      if (shift === 63n && byte > 1) break;
      value |= BigInt(byte & 127) << shift;
      if (byte < 128) return value;
    }
    throw new Error('TWKB varint exceeds 64 bits');
  }

  /** Reads a count or byte length that must fit in the remaining buffer. */
  count(): number {
    const count = this.unsigned();
    if (count > BigInt(this.limit - this.offset))
      throw new Error('TWKB count exceeds remaining bytes');
    return Number(count);
  }
}

/** Growable typed buffer for encoded bytes. */
class TWKBWriter {
  /** Current output storage. */
  private bytes = new Uint8Array(64);
  /** Number of bytes written. */
  private length = 0;

  /** Appends one byte. */
  byte(value: number): void {
    if (this.length === this.bytes.length) {
      const bytes = new Uint8Array(this.length * 2);
      bytes.set(this.bytes);
      this.bytes = bytes;
    }
    this.bytes[this.length++] = value;
  }

  /** Encodes one unsigned varint. */
  unsigned(value: bigint): void {
    while (value >= 128n) {
      this.byte(Number(value & 127n) | 128);
      value >>= 7n;
    }
    this.byte(Number(value));
  }

  /** Returns the encoded bytes. */
  finish(): Uint8Array {
    return this.bytes.slice(0, this.length);
  }
}

/** Reads a complete geometry, including a collection member's independent header. */
function readGeometry(reader: TWKBReader, depth: number): TWKBParseResult {
  if (depth > MAXIMUM_DEPTH) throw new Error('TWKB collection nesting exceeds 64');
  const header = reader.byte();
  const type = GEOMETRY_TYPES[(header & 15) - 1];
  if (!type) throw new Error('Unsupported TWKB geometry type');
  const flags = reader.byte();
  const extended = flags & 8 ? reader.byte() : 0;
  const outerLimit = reader.limit;
  if (flags & 2) {
    const size = reader.count();
    reader.limit = reader.offset + size;
  }

  const hasZ = Boolean(extended & 1);
  const hasM = Boolean(extended & 2);
  const dimension = getDimension(hasZ, hasM);
  const factors = coordinateFactors(
    Number(decodeSigned(BigInt(header >> 4))),
    (extended >> 2) & 7,
    extended >> 5,
    dimension
  );
  if (flags & 1) {
    for (let index = 0; index < factors.length * 2; index++) reader.unsigned();
  }

  const pointOffsets = factors.map(() => 0n);
  const readPoint = () =>
    factors.map((factor, index) => {
      const value = pointOffsets[index] + decodeSigned(reader.unsigned());
      const ordinate = Number(value);
      if (!Number.isSafeInteger(ordinate))
        throw new Error('TWKB coordinate exceeds safe integer range');
      pointOffsets[index] = value;
      return ordinate / factor;
    });

  const empty = Boolean(flags & 16);
  const count = type === 'Point' || empty ? 0 : reader.count();
  if (flags & 4 && type !== 'Point' && type !== 'LineString' && type !== 'Polygon') {
    for (let index = 0; index < count; index++) reader.unsigned();
  }
  /** Reads one ring and restores its implicit closure for geometry consumers. */
  const readRing = () => {
    const ring = readList(reader.count(), readPoint);
    if (ring.length && !samePoint(ring[0], ring[ring.length - 1])) ring.push(ring[0].slice());
    return ring;
  };
  let result: TWKBParseResult;
  switch (type) {
    case 'Point':
      result = {dimension, geometry: {type, coordinates: empty ? [] : readPoint()}};
      break;
    case 'LineString':
    case 'MultiPoint':
      result = {dimension, geometry: {type, coordinates: readList(count, readPoint)}};
      break;
    case 'Polygon':
      result = {dimension, geometry: {type, coordinates: readList(count, readRing)}};
      break;
    case 'MultiLineString':
      result = {
        dimension,
        geometry: {type, coordinates: readList(count, () => readList(reader.count(), readPoint))}
      };
      break;
    case 'MultiPolygon':
      result = {
        dimension,
        geometry: {type, coordinates: readList(count, () => readList(reader.count(), readRing))}
      };
      break;
    case 'GeometryCollection': {
      const children = readList(count, () => readGeometry(reader, depth + 1));
      result = {
        dimension,
        children,
        geometry: {type, geometries: children.map(child => child.geometry)}
      };
      break;
    }
  }
  if (flags & 2 && reader.offset !== reader.limit) throw new Error('TWKB geometry size mismatch');
  reader.limit = outerLimit;
  return result;
}

/** Reads a counted sequence without allocating from an unchecked count. */
function readList<Value>(count: number, readValue: () => Value): Value[] {
  const values: Value[] = [];
  for (let index = 0; index < count; index++) values.push(readValue());
  return values;
}

/** Writes one complete geometry using its own dimension and delta state. */
function writeGeometry(
  writer: TWKBWriter,
  geometry: WellKnownGeometry,
  options: Required<Omit<TWKBWriteOptions, 'dimension'>> & Pick<TWKBWriteOptions, 'dimension'>,
  depth: number
): void {
  if (depth > MAXIMUM_DEPTH) throw new Error('TWKB collection nesting exceeds 64');
  const type = geometry.type;
  const coordinates = type === 'GeometryCollection' ? [] : geometry.coordinates;
  const dimension = options.dimension ?? inferDimension(coordinates);
  const hasZ = dimension === 'xyz' || dimension === 'xyzm';
  const hasM = dimension === 'xym' || dimension === 'xyzm';
  const extended = hasZ || hasM;
  const empty =
    type === 'GeometryCollection' ? geometry.geometries.length === 0 : coordinates.length === 0;
  writer.byte(
    GEOMETRY_TYPES.indexOf(type) + 1 + Number(encodeSigned(BigInt(options.precision)) << 4n)
  );
  writer.byte((extended ? 8 : 0) | (empty ? 16 : 0));
  if (extended) {
    writer.byte(
      (hasZ ? 1 | (options.zPrecision << 2) : 0) | (hasM ? 2 | (options.mPrecision << 5) : 0)
    );
  }
  if (empty) return;

  const factors = coordinateFactors(
    options.precision,
    options.zPrecision,
    options.mPrecision,
    dimension
  );
  const pointOffsets = factors.map(() => 0n);
  /** Writes one point relative to the previous quantized point. */
  const writePoint = (point: readonly number[]): void => {
    if (point.length !== factors.length) throw new Error('TWKB coordinate dimension mismatch');
    for (let index = 0; index < factors.length; index++) {
      const scaled = point[index] * factors[index];
      const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
      if (!Number.isSafeInteger(rounded))
        throw new Error('TWKB coordinate exceeds safe integer range');
      const value = BigInt(rounded);
      writer.unsigned(encodeSigned(value - pointOffsets[index]));
      pointOffsets[index] = value;
    }
  };
  /** Writes a point count and the requested coordinates. */
  const writePoints = (points: readonly (readonly number[])[], count = points.length): void => {
    writer.unsigned(BigInt(count));
    for (let index = 0; index < count; index++) writePoint(points[index]);
  };
  /** Writes rings using TWKB's implicit closure. */
  const writePolygon = (rings: readonly (readonly (readonly number[])[])[]): void => {
    writer.unsigned(BigInt(rings.length));
    for (const ring of rings) {
      const closed = ring.length > 1 && samePoint(ring[0], ring[ring.length - 1]);
      writePoints(ring, ring.length - Number(closed));
    }
  };
  switch (type) {
    case 'Point':
      writePoint(geometry.coordinates);
      break;
    case 'LineString':
    case 'MultiPoint':
      writePoints(geometry.coordinates);
      break;
    case 'Polygon':
      writePolygon(geometry.coordinates);
      break;
    case 'MultiLineString':
      writer.unsigned(BigInt(geometry.coordinates.length));
      for (const line of geometry.coordinates) writePoints(line);
      break;
    case 'MultiPolygon':
      writer.unsigned(BigInt(geometry.coordinates.length));
      for (const polygon of geometry.coordinates) writePolygon(polygon);
      break;
    case 'GeometryCollection':
      writer.unsigned(BigInt(geometry.geometries.length));
      for (const child of geometry.geometries) writeGeometry(writer, child, options, depth + 1);
      break;
  }
}

/** Maps Z and M header bits to tuple semantics. */
function getDimension(hasZ: boolean, hasM: boolean): WellKnownDimension {
  return hasZ ? (hasM ? 'xyzm' : 'xyz') : hasM ? 'xym' : 'xy';
}

/** Returns scale factors in coordinate storage order. */
function coordinateFactors(
  xy: number,
  z: number,
  m: number,
  dimension: WellKnownDimension
): number[] {
  const factors = [10 ** xy, 10 ** xy];
  if (dimension === 'xyz' || dimension === 'xyzm') factors.push(10 ** z);
  if (dimension === 'xym' || dimension === 'xyzm') factors.push(10 ** m);
  return factors;
}

/** Infers dimension from the first non-empty coordinate. */
function inferDimension(coordinates: readonly unknown[]): WellKnownDimension {
  const size = getFirstCoordinateSize(coordinates);
  return size === 4 ? 'xyzm' : size === 3 ? 'xyz' : 'xy';
}

/** Finds the first non-empty coordinate without flattening the geometry. */
function getFirstCoordinateSize(coordinates: readonly unknown[]): number {
  if (typeof coordinates[0] === 'number') return coordinates.length;
  for (const child of coordinates) {
    if (Array.isArray(child)) {
      const size = getFirstCoordinateSize(child);
      if (size) return size;
    }
  }
  return 0;
}

/** Tests equality across all coordinate ordinates. */
function samePoint(first: readonly number[], second: readonly number[]): boolean {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

/** Checks the precision range of a TWKB header field. */
function validatePrecision(value: number, minimum: number): void {
  if (!Number.isInteger(value) || value < minimum || value > 7) {
    throw new Error(`TWKB precision must be an integer from ${minimum} to 7`);
  }
}

/** Maps signed deltas to unsigned varints. */
function encodeSigned(value: bigint): bigint {
  return value < 0n ? -2n * value - 1n : 2n * value;
}

/** Reverses the zigzag mapping for signed deltas. */
function decodeSigned(value: bigint): bigint {
  return (value >> 1n) ^ -(value & 1n);
}
