// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {inferCRSRepresentation, parseWKTCRS} from '@math.gl/crs';
import type {WKTCRSNode} from '@math.gl/crs';
import type {CRSParser} from './types';
import {unsupportedStage} from './types';
import {readStructuredCRS} from './structured';
import type {RecordValue} from './structured';

function children(node: WKTCRSNode, ...names: string[]): WKTCRSNode[] {
  return node.values.filter(
    (value): value is WKTCRSNode =>
      value.type === 'node' && names.includes(value.keyword.toUpperCase())
  );
}
function child(node: WKTCRSNode, ...names: string[]): WKTCRSNode | undefined {
  return children(node, ...names)[0];
}
function value(node: WKTCRSNode, index = 0): string | number | undefined {
  const item = node.values[index];
  return item && item.type !== 'node' ? item.value : undefined;
}
function units(node?: WKTCRSNode): unknown {
  return node ? {name: value(node), conversion_factor: value(node, 1)} : undefined;
}
function operation(node: WKTCRSNode): RecordValue {
  const method = child(node, 'METHOD', 'PROJECTION');
  if (!method) throw new Error('WKT conversion requires a METHOD or PROJECTION');
  if (child(node, 'PARAMETERFILE')) unsupportedStage('Grid-based WKT operation is not implemented');
  return {
    method: {name: value(method)},
    parameters: children(node, 'PARAMETER').map(parameter => ({
      name: value(parameter),
      value: value(parameter, 1),
      unit: units(child(parameter, 'ANGLEUNIT', 'LENGTHUNIT', 'SCALEUNIT'))
    }))
  };
}
function readWKT(node: WKTCRSNode): RecordValue {
  const keyword = node.keyword.toUpperCase();
  if (keyword === 'COMPD_CS' || keyword === 'COMPOUNDCRS') {
    return {
      type: 'CompoundCRS',
      components: children(
        node,
        'PROJCS',
        'PROJCRS',
        'GEOGCS',
        'GEOGCRS',
        'GEODCRS',
        'BOUNDCRS',
        'VERT_CS',
        'VERTCRS'
      ).map(readWKT)
    };
  }
  if (keyword === 'BOUNDCRS') {
    const source = child(node, 'SOURCECRS'),
      target = child(node, 'TARGETCRS'),
      transform = child(node, 'ABRIDGEDTRANSFORMATION');
    if (!source || !target || !transform) throw new Error('Incomplete WKT BoundCRS');
    const root = (wrapper: WKTCRSNode): WKTCRSNode => {
      const entry = wrapper.values.find((value): value is WKTCRSNode => value.type === 'node');
      if (!entry) throw new Error('Missing bound CRS component');
      return entry;
    };
    // Abridged transformations express scale as a multiplier; PROJJSON uses ppm.
    const op = operation(transform);
    const parameters = op['parameters'] as RecordValue[];
    for (const parameter of parameters) {
      if (
        String(parameter['name']).toLowerCase() === 'scale difference' &&
        parameter['unit'] === undefined
      )
        parameter['value'] = (Number(parameter['value']) - 1) * 1e6;
    }
    return {
      type: 'BoundCRS',
      source_crs: readWKT(root(source)),
      target_crs: readWKT(root(target)),
      transformation: op
    };
  }
  if (['VERT_CS', 'VERTCRS'].includes(keyword)) return {type: 'VerticalCRS'};
  const projected = ['PROJCS', 'PROJCRS', 'PROJECTEDCRS'].includes(keyword);
  const geographic = [
    'GEOGCS',
    'GEOGCRS',
    'GEODCRS',
    'GEODETICCRS',
    'GEOGRAPHICCRS',
    'BASEGEOGCRS',
    'BASEGEODCRS',
    'GEOCCS'
  ].includes(keyword);
  if (!projected && !geographic) unsupportedStage('Unsupported WKT CRS: ' + keyword);
  if (child(node, 'DYNAMIC', 'DERIVINGCONVERSION', 'VELOCITYGRID', 'EXTENSION'))
    unsupportedStage('Unsupported WKT dynamic/extension operation');
  const cs = child(node, 'CS');
  const geocentric =
    keyword === 'GEOCCS' || (String(value(cs || node)).toLowerCase() === 'cartesian' && !projected);
  const localUnit = child(node, projected || geocentric ? 'LENGTHUNIT' : 'ANGLEUNIT', 'UNIT');
  const axes = children(node, 'AXIS')
    .sort((a, b) => Number(value(child(a, 'ORDER') || a)) - Number(value(child(b, 'ORDER') || b)))
    .map((axis, index) => ({
      name: value(axis),
      direction:
        keyword === 'GEOCCS'
          ? ['geocentricX', 'geocentricY', 'geocentricZ'][index]
          : value(axis, 1),
      unit: units(
        child(axis, 'ANGLEUNIT', 'LENGTHUNIT') ||
          (!geocentric && !projected && /^(up|down)$/i.test(String(value(axis, 1)))
            ? undefined
            : localUnit)
      ),
      meridian: child(axis, 'MERIDIAN') ? true : undefined
    }));
  if (!axes.length) {
    for (const direction of geocentric
      ? ['geocentricX', 'geocentricY', 'geocentricZ']
      : ['east', 'north'])
      axes.push({name: direction, direction, unit: units(localUnit), meridian: undefined});
  }
  const id = keyword === 'GEOGCS' ? undefined : child(node, 'ID');
  const result: RecordValue = {
    type: projected ? 'ProjectedCRS' : geocentric ? 'GeodeticCRS' : 'GeographicCRS',
    name: value(node),
    // WKT1 uses datum names; WKT2 base-CRS IDs select the upstream authority table.
    id: id ? {authority: value(id), code: value(id, 1)} : undefined,
    coordinate_system: {subtype: projected || geocentric ? 'Cartesian' : 'ellipsoidal', axis: axes}
  };
  if (projected) {
    const base = child(node, 'GEOGCS', 'BASEGEOGCRS', 'BASEGEODCRS', 'GEODCRS', 'GEOGCRS');
    if (!base) throw new Error('Projected WKT requires a base geographic CRS');
    result['base_crs'] = readWKT(base);
    result['conversion'] = operation(child(node, 'CONVERSION') || node);
  } else {
    const datum = child(node, 'DATUM', 'GEODETICDATUM', 'ENSEMBLE');
    if (!datum) throw new Error('WKT requires a geodetic datum');
    if (child(datum, 'EXTENSION', 'DYNAMIC')) unsupportedStage('Unsupported datum extension');
    const ellipsoid = child(datum, 'SPHEROID', 'ELLIPSOID');
    if (!ellipsoid) throw new Error('WKT datum requires an ellipsoid');
    const shift = child(datum, 'TOWGS84');
    result['datum'] = {
      name: value(datum),
      ellipsoid: {
        name: value(ellipsoid),
        semi_major_axis: value(ellipsoid, 1),
        inverse_flattening: value(ellipsoid, 2),
        unit: units(child(ellipsoid, 'LENGTHUNIT'))
      },
      towgs84: shift?.values.map((_, index) => value(shift, index))
    };
    const pm = child(node, 'PRIMEM');
    if (pm)
      result['prime_meridian'] = {
        name: value(pm),
        longitude: value(pm, 1),
        unit: units(child(pm, 'ANGLEUNIT') || (geocentric ? undefined : localUnit))
      };
    result['angular_unit'] = geocentric ? undefined : units(localUnit);
  }
  return result;
}
export const wktCRSParser: CRSParser = {
  name: 'wkt',
  canParse: definition => inferCRSRepresentation(definition) === 'wkt',
  parse(definition, options) {
    if (typeof definition !== 'string') throw new Error('Expected serialized WKT');
    return readStructuredCRS(readWKT(parseWKTCRS(definition).root), options);
  }
};
