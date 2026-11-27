// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Field} from 'apache-arrow';
import type {GeoArrowEncoding} from '../geoarrow-utils/types';

/** Arrow extension metadata retained without a loaders.gl schema or CRS conversion. */
export type GeoArrowExtensionMetadata = Readonly<{
  /** Canonical GeoArrow extension name. */
  encoding: GeoArrowEncoding;
  /** Parsed extension metadata, including opaque CRS and edge semantics. */
  metadata: Readonly<Record<string, unknown>>;
}>;

const GEOARROW_ENCODINGS = new Set<GeoArrowEncoding>([
  'geoarrow.point',
  'geoarrow.linestring',
  'geoarrow.polygon',
  'geoarrow.multipoint',
  'geoarrow.multilinestring',
  'geoarrow.multipolygon',
  'geoarrow.geometry',
  'geoarrow.geometrycollection',
  'geoarrow.box',
  'geoarrow.wkb',
  'geoarrow.wkt'
]);

/** Reads a recognized GeoArrow field extension, rejecting malformed extension JSON. */
export function getGeoArrowExtensionMetadata(field: Field): GeoArrowExtensionMetadata | null {
  const encoding = field.metadata.get('ARROW:extension:name') as GeoArrowEncoding | undefined;
  if (!encoding || !GEOARROW_ENCODINGS.has(encoding)) return null;
  const serialized = field.metadata.get('ARROW:extension:metadata');
  const metadata: unknown = serialized ? JSON.parse(serialized) : {};
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error(
      `Invalid GeoArrow extension metadata for field ${field.name}: expected a JSON object.`
    );
  }
  return {encoding, metadata: metadata as Record<string, unknown>};
}
