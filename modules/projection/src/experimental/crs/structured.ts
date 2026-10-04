// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original adapter; datum lookup and method/parameter normalization rules are adapted from proj4js 2.22.0 and its MIT-licensed wkt-parser dependency. See ../../../PROJ4-LICENSE.md.
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
  hotineobliquemercator: 'omerc',
  hotineobliquemercatorvarianta: 'omerc',
  hotineobliquemercatorvariantb: 'omerc',
  hotineobliquemercatorazimuthnaturalorigin: 'omerc',
  hotineobliquemercatorazimuthcenter: 'omerc',
  obliquemercator: 'omerc',
  krovak: 'krovak',
  krovaknorthorientated: 'krovak',
  quadrilateralizedsphericalcube: 'qsc',
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
  stereographicnorthpole: 'sterea',
  stereographicsouthpole: 'stere',
  polarstereographic: 'stere',
  polarstereographicvarianta: 'stere',
  polarstereographicvariantb: 'stere',
  obliquestereographic: 'sterea',
  doublestereographic: 'sterea',
  azimuthalequidistant: 'aeqd',
  modifiedazimuthalequidistant: 'aeqd',
  equidistantcylindrical: 'eqc',
  equidistantcylindricalspherical: 'eqc',
  equirectangular: 'eqc',
  platecarree: 'eqc',
  bonne: 'bonne',
  cassinisoldner: 'cass',
  cassini: 'cass',
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
// Projection-specific names must not leak into unrelated method interpretations.
const METHOD_PARAMETERS: Record<string, Record<string, string>> = {
  omerc: {
    longitudeofcenter: 'lonc',
    longitudeofprojectioncentre: 'lonc',
    azimuth: 'alpha',
    azimuthatprojectioncentre: 'alpha',
    rectifiedgridangle: 'gamma',
    anglefromrectifiedtoskewgrid: 'gamma',
    scalefactoratprojectioncentre: 'k_0',
    eastingatprojectioncentre: 'x_0',
    northingatprojectioncentre: 'y_0'
  },
  krovak: {
    azimuth: 'alpha',
    colatitudeofconeaxis: 'alpha',
    pseudostandardparallel1: 'lat_ts',
    latitudeofpseudostandardparallel: 'lat_ts',
    scalefactoronpseudostandardparallel: 'k_0'
  }
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
  // WKT1 spellings used by ESRI and older exporters.
  const datumAlias: Record<string, string> = {
    newzealand1949: 'nzgd49',
    belge1972: 'rnb72'
  };
  const alias = datumAlias[datumName.replace(/^d/, '')];
  if (alias) parameters['datum'] = alias;
  // Only the geographic base ID identifies a datum-table entry. A projected CRS
  // or datum object's ID belongs to a different authority namespace.
  if (type === 'ProjectedCRS' && base['id']) {
    const id = object(base['id']);
    const authorityDatum = String(id['authority']) + '_' + String(id['code']);
    if (Object.prototype.hasOwnProperty.call(datums, authorityDatum))
      parameters['datum'] = authorityDatum;
  }
  // WKT1's explicit operation takes priority over a datum-name or authority lookup.
  if (datum['towgs84'] !== undefined) {
    parameters['towgs84'] = array(datum['towgs84']).map(finite).join(',');
    // Do not inherit named datum grids over an explicit Helmert operation.
    delete parameters['datum'];
  }
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
    // ESRI's true-scale North Pole spelling omits scale_factor. Preserve the
    // older explicit-scale oblique spelling separately for compatibility.
    const conversionParameters = array(conversion['parameters']).map(object);
    const polarTrueScale =
      method === 'stereographicnorthpole' &&
      !conversionParameters.some(parameter => key(parameter['name']).startsWith('scalefactor'));
    const projection = polarTrueScale ? 'stere' : METHODS[method];
    const esriKrovak = conversionParameters.filter(parameter =>
      ['xscale', 'yscale', 'xyplanerotation'].includes(key(parameter['name']))
    );
    if (esriKrovak.length) {
      const expected: Record<string, number> = {xscale: -1, yscale: 1, xyplanerotation: 90};
      if (
        projection !== 'krovak' ||
        esriKrovak.length !== 3 ||
        new Set(esriKrovak.map(parameter => key(parameter['name']))).size !== 3 ||
        esriKrovak.some(parameter => {
          const name = key(parameter['name']);
          const factor =
            name === 'xyplanerotation'
              ? unit(parameter['unit'], angularUnit) / DEGREES_TO_RADIANS
              : unit(parameter['unit'], 1);
          return Math.abs(finite(parameter['value']) * factor - expected[name]) > 1e-10;
        })
      )
        unsupportedStage('Unsupported ESRI Krovak axis adjustment');
    }
    if (!projection || projection.startsWith('unsupported'))
      unsupportedStage(
        'Unsupported projection method: ' + String(object(conversion['method'])['name'])
      );
    parameters['proj'] = projection === 'webmerc' ? 'merc' : projection;
    let hasSemiMinor = false;
    for (const parameter of conversionParameters) {
      const parameterName = key(parameter['name']);
      if (esriKrovak.includes(parameter)) continue;
      if (
        parameterName === 'auxiliaryspheretype' &&
        projection === 'webmerc' &&
        parameter['value'] === 0
      )
        continue;
      if (parameterName === 'semiminor' && projection === 'webmerc') {
        if (hasSemiMinor) throw new Error('Duplicate conversion parameter: semi_minor');
        hasSemiMinor = true;
        // This legacy pseudo-Mercator hint may only confirm the projection sphere.
        // It must not override the geographic datum ellipsoid or choose another radius.
        const radius = finite(parameter['value']) * unit(parameter['unit'], 1);
        if (
          Math.abs(radius - Number(parameters['a'])) >
          4 * Number.EPSILON * Number(parameters['a'])
        )
          unsupportedStage('Pseudo-Mercator semi_minor must equal the semi-major axis');
        continue;
      }
      let name = METHOD_PARAMETERS[projection]?.[parameterName] || PARAMETERS[parameterName];
      if (!name) unsupportedStage('Unsupported conversion parameter: ' + String(parameter['name']));
      if (name === 'lat_1' && method === 'stereographicnorthpole' && !polarTrueScale)
        name = 'lat_0';
      else if (name === 'lat_1' && ['merc', 'webmerc', 'eqc', 'stere', 'cea'].includes(projection))
        name = 'lat_ts';
      if (parameters[name] !== undefined)
        throw new Error('Duplicate conversion parameter: ' + name);
      if (['merc', 'webmerc'].includes(projection) && name === 'lat_0' && parameter['value'] === 0)
        continue;
      const angle =
        name.startsWith('lat') || name.startsWith('lon') || name === 'alpha' || name === 'gamma';
      const length = name === 'x_0' || name === 'y_0';
      let converted =
        (finite(parameter['value']) *
          unit(parameter['unit'], angle ? angularUnit : length ? factor : 1)) /
        (angle ? DEGREES_TO_RADIANS : 1);
      // Decimal unit factors can put an exact pole a few ULPs outside ±90°.
      // Keep this tolerance local to structured latitude unit conversion.
      if (name.startsWith('lat') && Math.abs(Math.abs(converted) - 90) <= 4 * Number.EPSILON * 90)
        converted = Math.sign(converted) * 90;
      parameters[name] = String(converted);
    }
    if (
      projection === 'omerc' &&
      [
        'hotineobliquemercator',
        'hotineobliquemercatorvarianta',
        'hotineobliquemercatorazimuthnaturalorigin'
      ].includes(method)
    )
      parameters['no_uoff'] = undefined;
    if (
      projection === 'omerc' &&
      parameters['lon_0'] !== undefined &&
      parameters['lonc'] !== undefined
    ) {
      if (Math.abs(Number(parameters['lon_0']) - Number(parameters['lonc'])) > 1e-10)
        unsupportedStage('Oblique Mercator central meridian conflicts with projection centre');
      delete parameters['lon_0'];
    }
    // The legacy North_Pole alias uses the oblique alternative away from a pole.
    // At a pole use the equivalent polar kernel; sterea's inverse is singular there.
    if (method === 'stereographicnorthpole' && Math.abs(Number(parameters['lat_0'])) === 90)
      parameters['proj'] = 'stere';
    if (projection === 'lcc' && parameters['lat_1'] === undefined)
      parameters['lat_1'] = parameters['lat_0'];
    if (method === 'polarstereographic' && parameters['lat_0'] !== undefined) {
      // WKT1 latitude_of_origin is the latitude of true scale for this method.
      // WKT2 variant A keeps its actual pole origin and scale factor.
      if (parameters['lat_ts'] !== undefined)
        throw new Error('Duplicate polar stereographic latitude of true scale');
      parameters['lat_ts'] = parameters['lat_0'];
      delete parameters['lat_0'];
    }
    if (
      projection === 'stere' &&
      (method.includes('polar') || method === 'stereographicsouthpole' || polarTrueScale) &&
      parameters['lat_0'] === undefined
    )
      parameters['lat_0'] = Number(parameters['lat_ts'] || 90) < 0 ? '-90' : '90';
    if (projection === 'webmerc') {
      parameters['b'] = parameters['a'];
      delete parameters['rf'];
      parameters['nadgrids'] = '@null';
    }
  }
  let axis = axes
    .map(entry => readAxisDirection(entry, parameters, type === 'ProjectedCRS'))
    .join('');
  if (axis.length === 2) axis += 'u';
  if (!geocentric && /[ud]/.test(axis.slice(0, 2)))
    unsupportedStage('Structured CRS vertical-first axes require an explicit PROJ axis definition');
  if (axis) parameters['axis'] = axis;
  if (type === 'ProjectedCRS' || geocentric) parameters['to_meter'] = String(factor);
  return {
    parameters,
    angularUnit: type === 'ProjectedCRS' || geocentric ? angularUnit : factor,
    verticalUnit: geocentric ? 1 : unit(axes[2]?.['unit'], 1)
  };
}

/** Interpret polar axis meridians in the projection's central-meridian frame.
 * Original adapter following OGC WKT2 axis semantics, not a proj4js numerical port.
 * Only cardinal orientations are representable by the engine's signed axis order.
 */
function readAxisDirection(
  entry: RecordValue,
  parameters: Record<string, string | undefined>,
  projected: boolean
): string {
  let direction = String(entry['direction']);
  let meridian = entry['meridian'];
  // Legacy WKT1 exporters spell out the same WKT2 MERIDIAN metadata.
  const along = /^(north|south) along ([+-]?(?:\d+(?:\.\d*)?|\.\d+)) deg(?: (east|west))?$/i.exec(
    direction
  );
  if (along) {
    if (meridian !== undefined) throw new Error('Duplicate axis meridian');
    direction = along[1];
    meridian = {longitude: Number(along[2]) * (along[3]?.toLowerCase() === 'west' ? -1 : 1)};
  }
  if (meridian !== undefined) {
    const latitude = Number(parameters['lat_0']);
    const north = latitude === 90;
    if (
      !projected ||
      parameters['proj'] !== 'stere' ||
      Math.abs(latitude) !== 90 ||
      key(direction) !== (north ? 'south' : 'north')
    )
      unsupportedStage('Axis meridians require an outward-facing polar stereographic axis');
    const longitude = object(meridian)['longitude'];
    const degrees =
      typeof longitude === 'number'
        ? finite(longitude)
        : (finite(object(longitude)['value']) *
            unit(object(longitude)['unit'], DEGREES_TO_RADIANS)) /
          DEGREES_TO_RADIANS;
    // Axis meridians and lon_0 are relative to the same CRS prime meridian.
    const quarterTurns = finite((degrees - Number(parameters['lon_0'] || 0)) / 90);
    if (Math.abs(quarterTurns - Math.round(quarterTurns)) > 1e-12)
      unsupportedStage('Non-cardinal axis meridians require an orientation operation');
    const quadrant = ((Math.round(quarterTurns) % 4) + 4) % 4;
    return (north ? 'senw' : 'nesw')[quadrant];
  }
  const result = DIRECTIONS[key(direction)];
  if (!result) unsupportedStage('Unsupported axis direction: ' + direction);
  return result;
}
