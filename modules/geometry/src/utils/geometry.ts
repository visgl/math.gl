// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/core';
import type {PrimitiveTopology} from '../lib/geometry';
import {GL} from './constants';

/** A typed geometry attribute with either loaders.gl-style `value` or legacy `values` storage. */
export type GeometryAttribute = {
  value?: TypedArray;
  values?: TypedArray;
  size?: number;
};

/** Minimal geometry shape understood by the geometry utilities. */
export type Geometry = {
  /** Primitive topology, as set by the geometry generators. Takes precedence over `mode`. */
  topology?: PrimitiveTopology;
  /** @deprecated Use `topology`. WebGL primitive mode, for example `GL.TRIANGLES`. */
  mode?: number;
  indices?: GeometryAttribute | TypedArray;
  attributes: Record<string, GeometryAttribute>;
};

/** Returns whether a value has the minimal geometry shape. */
export function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const geometry = value as Partial<Geometry>;
  return getGeometryMode(geometry) !== undefined && Boolean(geometry.attributes);
}

const TOPOLOGY_MODES: Record<PrimitiveTopology, number> = {
  'point-list': GL.POINTS,
  'line-list': GL.LINES,
  'line-strip': GL.LINE_STRIP,
  'triangle-list': GL.TRIANGLES,
  'triangle-strip': GL.TRIANGLE_STRIP
};

/** Returns the WebGL primitive mode of a geometry, from `topology` or the deprecated `mode`. */
export function getGeometryMode(geometry: Pick<Geometry, 'topology' | 'mode'>): number | undefined {
  if (typeof geometry.topology === 'string') {
    return TOPOLOGY_MODES[geometry.topology];
  }
  return typeof geometry.mode === 'number' ? geometry.mode : undefined;
}

/** Returns the typed array stored in a geometry attribute. */
export function getAttributeValues(attribute: GeometryAttribute | TypedArray): TypedArray {
  if (ArrayBuffer.isView(attribute)) {
    return attribute as TypedArray;
  }
  const values = attribute.value || attribute.values;
  if (!values) {
    throw new Error('Geometry attribute does not contain typed-array values');
  }
  return values;
}

/** Returns a geometry's position attribute. */
export function getPositionAttribute(geometry: Geometry): GeometryAttribute {
  const position = geometry.attributes['POSITION'] || geometry.attributes['positions'];
  if (!position) {
    throw new Error('Geometry does not contain a position attribute');
  }
  return position;
}
