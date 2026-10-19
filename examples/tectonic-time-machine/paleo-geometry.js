// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Schema and validation for externally sourced, epoch-specific paleogeography.
// Geometry coordinates are reconstructed lon/lat at the declared epoch, NOT present-day coordinates.
// This module intentionally contains no invented ancient geographic positions.
const GEOMETRY_TYPES = new Set(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']);
const FEATURE_TYPES = new Set(['mountain belt', 'ocean', 'sea', 'paleocontinent']);
const finite = n => typeof n === 'number' && Number.isFinite(n);

function validCoordinates(value, depth) {
  if (depth === 0) {
    return Array.isArray(value) && value.length >= 2 &&
      finite(value[0]) && finite(value[1]) &&
      value[0] >= -180 && value[0] <= 180 &&
      value[1] >= -90 && value[1] <= 90;
  }
  return Array.isArray(value) && value.length > 0 &&
    value.every(item => validCoordinates(item, depth - 1));
}

const DEPTHS = {
  Point: 0, MultiPoint: 1, LineString: 1,
  MultiLineString: 2, Polygon: 2, MultiPolygon: 3
};

export function validatePaleoGeometry(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return ['Expected a feature record'];
  if (typeof record.id !== 'string' || !record.id.trim()) errors.push('id is required');
  if (typeof record.name !== 'string' || !record.name.trim()) errors.push('name is required');
  if (!FEATURE_TYPES.has(record.type)) errors.push('Unsupported feature type');
  if (!finite(record.epochMa) || record.epochMa < 0) errors.push('epochMa must be nonnegative and finite');
  if (!finite(record.olderMa) || !finite(record.youngerMa) ||
      record.youngerMa < 0 || record.olderMa < record.youngerMa ||
      (finite(record.epochMa) && (record.epochMa < record.youngerMa || record.epochMa > record.olderMa)))
    errors.push('Epoch must fall within a valid age interval');
  if (typeof record.source !== 'string' || !record.source.trim()) errors.push('Source citation is required');
  if (typeof record.license !== 'string' || !record.license.trim()) errors.push('Data license is required');
  if (typeof record.reconstructionModel !== 'string' || !record.reconstructionModel.trim())
    errors.push('Reconstruction model is required');
  if (record.plateId !== undefined &&
      (!Number.isSafeInteger(record.plateId) || record.plateId < 0))
    errors.push('plateId must be a nonnegative integer');
  if (!record.geometry || !GEOMETRY_TYPES.has(record.geometry.type) ||
      !validCoordinates(record.geometry.coordinates, DEPTHS[record.geometry?.type]))
    errors.push('Invalid GeoJSON geometry or longitude/latitude coordinates');
  return errors;
}

export function featuresForEpoch(records, epochMa, modelId) {
  if (!finite(epochMa) || epochMa < 0) return [];
  return records.filter(record =>
    validatePaleoGeometry(record).length === 0 &&
    record.epochMa === epochMa &&
    record.reconstructionModel === modelId
  );
}
