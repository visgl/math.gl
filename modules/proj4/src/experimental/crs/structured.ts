// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import datums from './datum-table';
import {DEGREES_TO_RADIANS} from '../parameters';
import {unsupportedStage} from './types';
import type {CRSNormalizationOptions, ParsedCRS} from './types';
export type RecordValue = Record<string, unknown>;
export function object(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a CRS object');
  return value as RecordValue;
}
export function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}
export function key(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
function finite(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Expected a finite CRS parameter');
  return value;
}
export function unit(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value === 'object') {
    const factor = finite(object(value)['conversion_factor']);
    if (factor <= 0) throw new Error('Unit conversion factor must be positive');
    return factor;
  }
  const factors: Record<string, number> = {
    metre: 1,
    meter: 1,
    degree: DEGREES_TO_RADIANS,
    radian: 1,
    grad: Math.PI / 200,
    gon: Math.PI / 200,
    foot: 0.3048,
    ussurveyfoot: 1200 / 3937,
    kilometre: 1000,
    arcsecond: DEGREES_TO_RADIANS / 3600,
    partspermillion: 1e-6,
    unity: 1
  };
  const factor = factors[key(value)];
  if (!factor) unsupportedStage('Unsupported CRS unit: ' + String(value));
  return factor;
}
const METHODS: Record<string, string> = {
  transversemercator: 'tmerc',
  transversemercatorsouthorientated: 'unsupported-south-tmerc',
  mercator: 'merc',
  mercator1sp: 'merc',
  mercator2sp: 'merc',
  mercatorvarianta: 'merc',
  mercatorvariantb: 'merc',
  mercatorauxiliarysphere: 'webmerc',
  popularvisualisationpseudomercator: 'webmerc',
  lambertconformalconic: 'lcc',
  lambertconformalconic1sp: 'lcc',
  lambertconformalconic2sp: 'lcc',
  lambertconicconformal1sp: 'lcc',
  lambertconicconformal2sp: 'lcc',
  albers: 'aea',
  albersconicequalarea: 'aea',
  albersequalarea: 'aea',
  equidistantconic: 'eqdc',
  lambertazimuthalequalarea: 'laea',
  stereographic: 'stere',
  polarstereographic: 'stere',
  polarstereographicvarianta: 'stere',
  polarstereographicvariantb: 'stere',
  obliquestereographic: 'sterea',
  doublestereographic: 'sterea',
  azimuthalequidistant: 'aeqd',
  modifiedazimuthalequidistant: 'aeqd',
  equidistantcylindrical: 'eqc',
  equirectangular: 'eqc',
  platecarree: 'eqc',
  bonne: 'bonne',
  cassinisoldner: 'cass',
  cylindricalequalarea: 'cea',
  lambertcylindricalequalarea: 'cea',
  eckertvi: 'eck6',
  equalearth: 'eqearth',
  millercylindrical: 'mill',
  mollweide: 'moll',
  robinson: 'robin',
  sinusoidal: 'sinu',
  vandergrinten: 'vandg',
  vandergrinteni: 'vandg',
  gnomonic: 'gnom',
  orthographic: 'ortho',
  polyconic: 'poly',
  americanpolyconic: 'poly',
  newzealandmapgrid: 'nzmg',
  gaussschreibertransversemercator: 'gstmerc'
};
const PARAMETERS: Record<string, string> = {
  centralmeridian: 'lon_0',
  longitudeoforigin: 'lon_0',
  longitudeofcenter: 'lon_0',
  longitudeofnaturalorigin: 'lon_0',
  longitudeoffalseorigin: 'lon_0',
  longitudeofprojectioncentre: 'lon_0',
  straightverticalpolelongitude: 'lon_0',
  longitudeoforiginmeridian: 'lon_0',
  latitudeoforigin: 'lat_0',
  latitudeofcenter: 'lat_0',
  latitudeofnaturalorigin: 'lat_0',
  latitudeoffalseorigin: 'lat_0',
  latitudeofprojectioncentre: 'lat_0',
  standardparallel1: 'lat_1',
  latitudeof1ststandardparallel: 'lat_1',
  standardparallel2: 'lat_2',
  latitudeof2ndstandardparallel: 'lat_2',
  latitudeofstandardparallel: 'lat_ts',
  scalefactor: 'k_0',
  scalefactoratnaturalorigin: 'k_0',
  scalefactoratprojectionorigin: 'k_0',
  falseeasting: 'x_0',
  falsenorthing: 'y_0',
  eastingatfalseorigin: 'x_0',
  northingatfalseorigin: 'y_0'
};
const DIRECTIONS: Record<string, string> = {
  east: 'e',
  west: 'w',
  north: 'n',
  south: 's',
  up: 'u',
  down: 'd',
  geocentricx: 'e',
  geocentricy: 'n',
  geocentricz: 'u'
};

export function readStructuredCRS(crs: RecordValue, options: CRSNormalizationOptions): ParsedCRS {
  const type = String(crs['type']);
  if (type === 'CompoundCRS') {
    if (options.mode !== 'horizontal')
      unsupportedStage('CompoundCRS requires explicit horizontal extraction');
    const components = array(crs['components'])
      .map(object)
      .filter(value =>
        ['ProjectedCRS', 'GeographicCRS', 'GeodeticCRS', 'BoundCRS'].includes(String(value['type']))
      );
    if (components.length !== 1)
      throw new Error('CompoundCRS requires exactly one horizontal component');
    return {...readStructuredCRS(components[0], options), lossy: true};
  }
  if (type === 'BoundCRS') {
    const source = readStructuredCRS(object(crs['source_crs']), options);
    const target = readStructuredCRS(object(crs['target_crs']), options);
    if (
      target.parameters['datum'] !== 'WGS84' ||
      !['longlat', 'geocent'].includes(target.parameters['proj']) ||
      Number(target.parameters['pm'] || 0) !== 0 ||
      target.parameters['towgs84'] ||
      Number(target.parameters['a']) !== 6378137 ||
      !(
        Math.abs(Number(target.parameters['rf']) - 298.257223563) <= 1e-9 ||
        Math.abs(Number(target.parameters['b']) - 6356752.314245179) <= 1e-6
      )
    )
      unsupportedStage('BoundCRS requires a WGS84 target');
    const operation = object(crs['transformation']);
    const method = key(object(operation['method'])['name']);
    const translation =
      method === 'geocentrictranslations' || /^geocentrictranslationsgeog[23]ddomain$/.test(method);
    const position =
      /^positionvector(?:transformation)?(?:geog[23]ddomain|geocentricdomain)?$/.test(method);
    const frame = /^coordinateframe(?:rotation)?(?:geog[23]ddomain|geocentricdomain)?$/.test(
      method
    );
    if (!translation && !position && !frame)
      unsupportedStage('Unsupported BoundCRS transformation: ' + method);
    const names = [
      'xaxistranslation',
      'yaxistranslation',
      'zaxistranslation',
      'xaxisrotation',
      'yaxisrotation',
      'zaxisrotation',
      'scaledifference'
    ];
    const values: (number | undefined)[] = new Array(translation ? 3 : 7).fill(undefined);
    for (const entry of array(operation['parameters'])) {
      const parameter = object(entry),
        index = names.indexOf(key(parameter['name']));
      if (index < 0 || index >= values.length || values[index] !== undefined)
        unsupportedStage(
          'Unsupported or duplicate Helmert parameter: ' + String(parameter['name'])
        );
      const base = index < 3 ? 1 : index < 6 ? DEGREES_TO_RADIANS / 3600 : 1e-6;
      values[index] =
        ((finite(parameter['value']) * unit(parameter['unit'], base)) / base) *
        (frame && index >= 3 && index < 6 ? -1 : 1);
    }
    if (values.some(value => value === undefined))
      throw new Error('Incomplete BoundCRS Helmert transformation');
    const parameters: Record<string, string | undefined> = {
      ...source.parameters,
      towgs84: values.join(',')
    };
    delete parameters['datum'];
    return {...source, parameters};
  }
  if (!['ProjectedCRS', 'GeographicCRS', 'GeodeticCRS'].includes(type))
    unsupportedStage('Unsupported CRS type: ' + type);
  const base = type === 'ProjectedCRS' ? object(crs['base_crs']) : crs;
  const datum = object(base['datum'] || base['datum_ensemble']);
  if (
    datum['type'] === 'DynamicGeodeticReferenceFrame' ||
    datum['frame_reference_epoch'] !== undefined ||
    crs['coordinate_epoch'] !== undefined
  )
    unsupportedStage('Time-dependent datum transformations are not implemented');
  const ellipsoid = object(datum['ellipsoid']);
  const major = finite(ellipsoid['semi_major_axis'] ?? ellipsoid['radius']);
  const parameters: Record<string, string | undefined> = {
    proj: 'longlat',
    a: String(major * unit(ellipsoid['unit'], 1))
  };
  if (ellipsoid['inverse_flattening'] !== undefined)
    parameters['rf'] = String(finite(ellipsoid['inverse_flattening']));
  else if (ellipsoid['semi_minor_axis'] !== undefined)
    parameters['b'] = String(finite(ellipsoid['semi_minor_axis']) * unit(ellipsoid['unit'], 1));
  else if (ellipsoid['radius'] !== undefined) parameters['b'] = parameters['a'];
  else throw new Error('Ellipsoid requires inverse flattening or semi-minor axis');
  const datumName = key(datum['name']);
  const namedDatum = Object.keys(datums).find(
    name => key(name) === datumName || key(name) === datumName.replace(/^d/, '')
  );
  if (namedDatum) parameters['datum'] = namedDatum;
  if (
    [
      'wgs84',
      'worldgeodeticsystem1984',
      'worldgeodeticsystem1984ensemble',
      'dwgs1984',
      'wgs1984'
    ].includes(datumName)
  )
    parameters['datum'] = 'WGS84';
  if (['nad83', 'northamericandatum1983', 'dnorthamerican1983'].includes(datumName))
    parameters['datum'] = 'NAD83';
  if (['nad27', 'northamericandatum1927', 'dnorthamerican1927'].includes(datumName))
    parameters['datum'] = 'NAD27';
  // WKT1's explicit operation takes priority over a datum-name lookup.
  if (datum['towgs84'] !== undefined)
    parameters['towgs84'] = array(datum['towgs84']).map(finite).join(',');
  const cs = crs['coordinate_system'] ? object(crs['coordinate_system']) : {};
  const axes = array(cs['axis']).map(object);
  const geocentric = key(cs['subtype']) === 'cartesian' && type === 'GeodeticCRS';
  if (
    type !== 'ProjectedCRS' &&
    !geocentric &&
    cs['subtype'] &&
    key(cs['subtype']) !== 'ellipsoidal'
  )
    unsupportedStage('Unsupported coordinate system subtype');
  if (geocentric) parameters['proj'] = 'geocent';
  let axis = '';
  for (const entry of axes) {
    if (entry['meridian'] !== undefined)
      unsupportedStage('Axis meridians require an orientation operation');
    const direction = DIRECTIONS[key(entry['direction'])];
    if (!direction) unsupportedStage('Unsupported axis direction: ' + String(entry['direction']));
    axis += direction;
  }
  if (axis.length === 2) axis += 'u';
  if (!geocentric && /[ud]/.test(axis.slice(0, 2)))
    unsupportedStage('Structured CRS vertical-first axes require an explicit PROJ axis definition');
  if (axis) parameters['axis'] = axis;
  const angularUnit = unit(base['angular_unit'], DEGREES_TO_RADIANS);
  const factor = unit(axes[0]?.['unit'], type === 'ProjectedCRS' || geocentric ? 1 : angularUnit);
  if (axes[1] && unit(axes[1]['unit'], factor) !== factor)
    unsupportedStage('Mixed horizontal axis units are not supported');
  if (geocentric && axes[2] && unit(axes[2]['unit'], factor) !== factor)
    unsupportedStage('Mixed geocentric axis units are not supported');
  const pm = base['prime_meridian'] || datum['prime_meridian'];
  if (pm) {
    const meridian = object(pm);
    parameters['pm'] = String(
      (finite(meridian['longitude']) * unit(meridian['unit'], angularUnit)) / DEGREES_TO_RADIANS
    );
  }
  if (type === 'ProjectedCRS') {
    const conversion = object(crs['conversion']),
      method = key(object(conversion['method'])['name']);
    const projection = METHODS[method];
    if (!projection || projection.startsWith('unsupported'))
      unsupportedStage(
        'Unsupported projection method: ' + String(object(conversion['method'])['name'])
      );
    parameters['proj'] = projection === 'webmerc' ? 'merc' : projection;
    for (const entry of array(conversion['parameters'])) {
      const parameter = object(entry),
        parameterName = key(parameter['name']);
      if (
        parameterName === 'auxiliaryspheretype' &&
        projection === 'webmerc' &&
        parameter['value'] === 0
      )
        continue;
      let name = PARAMETERS[parameterName];
      if (!name) unsupportedStage('Unsupported conversion parameter: ' + String(parameter['name']));
      if (name === 'lat_1' && ['merc', 'webmerc', 'eqc', 'stere', 'cea'].includes(projection))
        name = 'lat_ts';
      if (parameters[name] !== undefined)
        throw new Error('Duplicate conversion parameter: ' + name);
      if (['merc', 'webmerc'].includes(projection) && name === 'lat_0' && parameter['value'] === 0)
        continue;
      const angle = name.startsWith('lat') || name.startsWith('lon');
      const length = name === 'x_0' || name === 'y_0';
      parameters[name] = String(
        (finite(parameter['value']) *
          unit(parameter['unit'], angle ? angularUnit : length ? factor : 1)) /
          (angle ? DEGREES_TO_RADIANS : 1)
      );
    }
    if (projection === 'lcc' && parameters['lat_1'] === undefined)
      parameters['lat_1'] = parameters['lat_0'];
    if (projection === 'stere' && method.includes('polar') && parameters['lat_0'] === undefined)
      parameters['lat_0'] = Number(parameters['lat_ts'] || 90) < 0 ? '-90' : '90';
    if (projection === 'webmerc') {
      parameters['b'] = parameters['a'];
      delete parameters['rf'];
      parameters['nadgrids'] = '@null';
    }
  }
  if (type === 'ProjectedCRS' || geocentric) parameters['to_meter'] = String(factor);
  return {
    parameters,
    angularUnit: type === 'ProjectedCRS' || geocentric ? angularUnit : factor,
    verticalUnit: geocentric ? 1 : unit(axes[2]?.['unit'], 1)
  };
}
