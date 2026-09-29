// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import proj4 from 'proj4';
import {
  createSpatialReference,
  parseWKTCRS,
  encodeWKTCRS,
  parsePROJString,
  encodePROJString
} from '@math.gl/crs';
import type {ReadonlyCRSDefinition, PROJJSONCRSByType} from '@math.gl/crs';
import {
  TypeScriptProjection,
  normalizeCRS,
  checkTypeScriptCRSCompatibility,
  mercator,
  geocentric,
  transverseMercator,
  wktCRSParser,
  projJSONCRSParser
} from '@math.gl/proj4/experimental';
import {
  datumDefinitions,
  geographicJSON,
  projectedJSON,
  geographicWKT,
  projectedWKT,
  projectedWKT2,
  esriWKT
} from '../fixtures/crs-datums';
const parsers = [wktCRSParser, projJSONCRSParser];
const projections = [mercator, transverseMercator, geocentric];
function close(actual: readonly number[], expected: readonly number[], tolerance = 1e-7): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((value, index) =>
    expect(Math.abs(value - expected[index]), 'ordinate ' + index).toBeLessThanOrEqual(tolerance)
  );
}
for (const definition of datumDefinitions) {
  test('Datum forward, inverse and heights: ' + definition, () => {
    const native = new TypeScriptProjection({from: definition});
    for (const point of [
      [2, 48, 0],
      [-120, 30, 1200],
      [15, -80, -20],
      [0, 90, 10]
    ]) {
      // enforceAxis=true asks proj4js to expose its computed height instead of restoring input Z.
      const expected = proj4(definition, 'WGS84').forward([...point], true);
      close(native.project(point), expected, 2e-7);
      close(
        native.unproject(expected),
        proj4('WGS84', definition).forward([...expected], true),
        2e-7
      );
      close(
        native.project(point.slice(0, 2)),
        proj4(definition, 'WGS84').forward(point.slice(0, 2), true),
        1e-7
      );
    }
  });
}
test('Datum-to-datum chains and Web Mercator use the datum ellipsoid', () => {
  for (const from of datumDefinitions.slice(0, 3)) {
    for (const to of [...datumDefinitions.slice(3), 'EPSG:3857']) {
      const native = new TypeScriptProjection({from, to, projections});
      close(native.project([3, 50, 250]), proj4(from, to).forward([3, 50, 250], true), 2e-6);
    }
  }
  const web = new TypeScriptProjection({from: 'EPSG:3857', to: datumDefinitions[0], projections});
  const input = proj4('EPSG:3857').forward([3, 50, 100], true);
  close(web.project(input), proj4('EPSG:3857', datumDefinitions[0]).forward(input, true), 2e-6);
});
test('Geocentric operations cover poles, height, units and dimension contract', () => {
  const native = new TypeScriptProjection({to: 'EPSG:4978', projections});
  close(native.project([0, 0]), [6378137, 0, 0]);
  close(native.project([90, 0, 100, 99]), [0, 6378237, 0, 99]);
  close(native.project([0, 90, 100]), [0, 0, 6356852.314245179]);
  close(native.unproject([0, 0, -6356752.314245179]), [0, -90, 0]);
  for (const point of [
    [12, 48, 100],
    [179, -70, -500],
    [-80, 10, 1e7]
  ]) {
    close(native.project(point), proj4('WGS84', '+proj=geocent +datum=WGS84').forward(point), 1e-7);
    close(native.unproject(native.project(point)), point, 1e-7);
  }
  const km = new TypeScriptProjection({to: '+proj=geocent +datum=WGS84 +units=km', projections});
  close(km.project([0, 90, 0]), [0, 0, 6356.752314245179], 1e-9);
  close(km.unproject(km.project([10, 50, 100])), [10, 50, 100]);
  expect(() => native.unproject([0, 0])).toThrow('requires');
  expect(() => native.unproject([0, 0, 0])).toThrow('Earth center');
  expect(() => native.project([0, 0, NaN])).toThrow('finite');
});
test('Declared axes support signs and vertical permutations', () => {
  for (const axis of ['neu', 'wsd', 'uen', 'dwn', 'sue']) {
    const native = new TypeScriptProjection({
      to: '+proj=longlat +datum=WGS84 +axis=' + axis,
      enforceAxis: true
    });
    const expected = proj4('WGS84', '+proj=longlat +datum=WGS84 +axis=' + axis).forward(
      [10, 20, 30],
      true
    );
    close(native.project([10, 20, 30, 40]), [...expected, 40]);
    close(native.unproject([...expected, 40]), [10, 20, 30, 40]);
  }
  expect(() =>
    new TypeScriptProjection({to: '+proj=longlat +axis=uen', enforceAxis: true}).project([10, 20])
  ).toThrow('three ordinates');
  close(new TypeScriptProjection({to: '+proj=longlat +axis=neu'}).project([10, 20]), [10, 20]);
});
test('Prime meridians, wrapping, angles, precedence and units', () => {
  for (const to of [
    '+proj=longlat +pm=paris',
    '+proj=longlat +lon_wrap=180',
    '+proj=merc +over',
    '+proj=merc +units=cm +to_meter=2'
  ]) {
    const native = new TypeScriptProjection({to, projections});
    close(native.project([210, 40]), proj4('WGS84', to).forward([210, 40]), 1e-6);
  }
  for (const [angle, degrees] of [
    ['0.2r', (0.2 * 180) / Math.PI],
    ['12d30\'0"E', 12.5]
  ] as const) {
    close(
      new TypeScriptProjection({to: '+proj=merc +lon_0=' + angle, projections}).project([20, 40]),
      proj4('+proj=merc +lon_0=' + degrees).forward([20, 40]),
      1e-6
    );
  }
  close(
    new TypeScriptProjection({to: '+proj=longlat +vunits=ft'}).project([1, 2, 30.48]),
    [1, 2, 100]
  );
  const wkt = encodeWKTCRS(parseWKTCRS(projectedWKT));
  const proj = encodePROJString(
    parsePROJString('+units=m +proj=tmerc +lon_0=3 +k_0=0.9996 +x_0=500000')
  );
  close(
    new TypeScriptProjection({to: wkt, parsers, projections}).project([4, 50]),
    new TypeScriptProjection({to: proj, projections}).project([4, 50])
  );
});
for (const [label, to] of [
  ['WKT1', projectedWKT],
  ['WKT2', projectedWKT2],
  ['PROJJSON', projectedJSON]
] as const) {
  test(label + ' uses shared CRS definitions and agrees with UTM', () => {
    const native = new TypeScriptProjection({to, parsers, projections});
    close(native.project([4, 50, 300]), proj4('WGS84', 'EPSG:32631').forward([4, 50, 300]), 1e-6);
    close(native.unproject(native.project([4, 50, 300])), [4, 50, 300]);
  });
}
test('ESRI WKT uses Web Mercator projection and WGS84 datum', () => {
  const native = new TypeScriptProjection({
    from: datumDefinitions[0],
    to: esriWKT,
    parsers,
    projections
  });
  close(
    native.project([4, 50, 300]),
    proj4(datumDefinitions[0], 'EPSG:3857').forward([4, 50, 300], true),
    1e-6
  );
});
test('Angular WKT units and prime meridian are converted independently', () => {
  const from =
    'GEOGCS["Paris",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Paris",2.5969212962963],UNIT["grad",0.015707963267948967],AXIS["lat",NORTH],AXIS["lon",EAST]]';
  const native = new TypeScriptProjection({from, parsers, enforceAxis: true});
  close(native.project([50, 0, 7]), [2.33722916666667, 45, 7]);
});
const bound: PROJJSONCRSByType<'BoundCRS'> = {
  type: 'BoundCRS',
  source_crs: {
    ...geographicJSON,
    datum: {
      name: 'Local',
      ellipsoid: {name: 'International', semi_major_axis: 6378388, inverse_flattening: 297}
    }
  },
  target_crs: geographicJSON,
  transformation: {
    name: 'Local to WGS84',
    method: {name: 'Position Vector transformation (geog2D domain)'},
    parameters: [
      'X-axis translation',
      'Y-axis translation',
      'Z-axis translation',
      'X-axis rotation',
      'Y-axis rotation',
      'Z-axis rotation',
      'Scale difference'
    ].map((name, i) => ({
      name,
      value: [12, -23, 34, 0.1, -0.2, 0.3, 2][i],
      unit: i < 3 ? 'metre' : i < 6 ? 'arc-second' : 'parts per million'
    }))
  }
};
test('BoundCRS implements Helmert operations and rejects other operations', () => {
  const native = new TypeScriptProjection({from: bound, parsers});
  close(
    native.project([4, 50, 250]),
    proj4('+proj=longlat +ellps=intl +towgs84=12,-23,34,0.1,-0.2,0.3,2', 'WGS84').forward(
      [4, 50, 250],
      true
    ),
    1e-7
  );
  expect(
    checkTypeScriptCRSCompatibility(
      {...bound, transformation: {...bound.transformation, method: {name: 'NTv2'}}},
      {parsers}
    ).reason
  ).toBe('missing-transform-stage');
});
test('Compound and vertical CRS preserve strict and explicit lossy boundaries', () => {
  const compound: PROJJSONCRSByType<'CompoundCRS'> = {
    type: 'CompoundCRS',
    name: 'WGS84 + vertical',
    components: [
      geographicJSON,
      {type: 'VerticalCRS', name: 'Height', datum: {name: 'Local vertical'}}
    ]
  };
  expect(() => new TypeScriptProjection({from: compound, parsers})).toThrow('horizontal');
  const native = new TypeScriptProjection({from: compound, parsers, mode: 'horizontal'});
  expect(native.lossy).toBe(true);
  close(native.project([1, 2, 3]), [1, 2, 3]);
  expect(checkTypeScriptCRSCompatibility(compound, {parsers, mode: 'horizontal'})).toEqual({
    status: 'supported',
    lossy: true
  });
  const wkt =
    'COMPD_CS["compound",' +
    geographicWKT +
    ',VERT_CS["height",VERT_DATUM["local",2005],UNIT["metre",1],AXIS["up",UP]]]';
  expect(new TypeScriptProjection({from: wkt, parsers, mode: 'horizontal'}).lossy).toBe(true);
  expect(() => new TypeScriptProjection({from: compound.components[1], parsers})).toThrow(
    'VerticalCRS'
  );
});
test('SpatialReference preserves unknown states, storage order and metadata', () => {
  const source = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: geographicJSON,
      representation: 'projjson',
      provenance: 'metadata'
    },
    coordinateFrame: 'geographic',
    coordinateOrder: ['latitude', 'longitude', 'height'],
    units: ['degree', 'degree', 'metre']
  });
  const before = JSON.stringify(source);
  const native = new TypeScriptProjection({from: source, to: 'EPSG:3857', parsers, projections});
  close(native.project([50, 4, 123, 99]), proj4('EPSG:3857').forward([4, 50, 123, 99]), 1e-6);
  close(native.unproject(native.project([50, 4, 123])), [50, 4, 123]);
  expect(JSON.stringify(source)).toBe(before);
  expect(() => new TypeScriptProjection({from: createSpatialReference()})).toThrow('absent');
  expect(
    () => new TypeScriptProjection({from: {...source, coordinateEpoch: 2020}, parsers})
  ).toThrow('epochs');
  expect(
    () =>
      new TypeScriptProjection({from: {...source, units: ['radian', 'radian', 'metre']}, parsers})
  ).toThrow('units disagree');
  close(new TypeScriptProjection({from: source.crs, parsers}).project([4, 50]), [4, 50]);
});
test('Capability checks distinguish syntax, readers, plugins and transformation stages', () => {
  const checks: [ReadonlyCRSDefinition, string][] = [
    ['nonsense', 'unknown-syntax'],
    [projectedWKT, 'missing-parser'],
    ['+proj=tmerc', 'missing-plugin'],
    ['+proj=longlat +nadgrids=required.gsb', 'missing-transform-stage'],
    ['+proj=longlat +axis=eee', 'invalid-definition']
  ];
  for (const [definition, reason] of checks)
    expect(checkTypeScriptCRSCompatibility(definition).reason).toBe(reason);
  expect(() =>
    new TypeScriptProjection({to: '+proj=longlat +datum=NAD27'}).project([-100, 40])
  ).toThrow('No datum grid covers');
  for (const to of [
    '+proj=longlat +towgs84=1,2',
    '+proj=longlat +towgs84=1,2,NaN',
    '+proj=merc +over=true',
    '+proj=longlat +pm=bogus'
  ])
    expect(() => new TypeScriptProjection({to, projections})).toThrow();
  const normalized = normalizeCRS(projectedJSON, {parsers});
  expect(Object.isFrozen(normalized)).toBe(true);
  expect(Object.isFrozen(normalized.parameters)).toBe(true);
});

test('Projection aliases are local, and identity has radians semantics', () => {
  for (const name of ['Transverse_Mercator', 'Gauss_Kruger', 'Fast_Transverse_Mercator']) {
    const to = '+proj=' + name + ' +lon_0=3 +lat_0=0 +x_0=0 +y_0=0';
    close(
      new TypeScriptProjection({to, projections}).project([4, 50]),
      proj4(to).forward([4, 50]),
      1e-6
    );
  }
  close(
    new TypeScriptProjection({to: '+proj=Geocentric +datum=WGS84', projections}).project([0, 0, 0]),
    [6378137, 0, 0]
  );
  const identity = new TypeScriptProjection({to: '+proj=identity'});
  close(identity.project([90, 45, 7]), [Math.PI / 2, Math.PI / 4, 7]);
  close(identity.unproject([Math.PI / 2, Math.PI / 4, 7]), [90, 45, 7]);
  expect(() => new TypeScriptProjection({to: '+proj=Transverse_Mercator'})).toThrow(
    'not registered'
  );
});

test('WKT1 TOWGS84, WKT2 BoundCRS, and coordinate-frame rotation', () => {
  const source =
    'GEOGCS["Local",DATUM["Local",SPHEROID["International",6378388,297],TOWGS84[12,-23,34,0.1,-0.2,0.3,2]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]]';
  const expected = new TypeScriptProjection({from: bound, parsers}).project([4, 50, 250]);
  close(new TypeScriptProjection({from: source, parsers}).project([4, 50, 250]), expected);
  const boundWKT =
    'BOUNDCRS[SOURCECRS[' +
    source.replace(',TOWGS84[12,-23,34,0.1,-0.2,0.3,2]', '') +
    '],TARGETCRS[' +
    geographicWKT +
    '],ABRIDGEDTRANSFORMATION["Local to WGS84",METHOD["Position Vector transformation (geog2D domain)"],PARAMETER["X-axis translation",12],PARAMETER["Y-axis translation",-23],PARAMETER["Z-axis translation",34],PARAMETER["X-axis rotation",0.1],PARAMETER["Y-axis rotation",-0.2],PARAMETER["Z-axis rotation",0.3],PARAMETER["Scale difference",1.000002]]]';
  close(new TypeScriptProjection({from: boundWKT, parsers}).project([4, 50, 250]), expected);
  const frame = {
    ...bound,
    transformation: {
      ...bound.transformation,
      method: {name: 'Coordinate Frame rotation (geog2D domain)'},
      parameters: bound.transformation.parameters.map((parameter, index) => ({
        ...parameter,
        value: index >= 3 && index < 6 ? -Number(parameter.value) : parameter.value
      }))
    }
  };
  close(new TypeScriptProjection({from: frame, parsers}).project([4, 50, 250]), expected);
});

test('Geocentric PROJJSON and WKT2 use shared definitions', () => {
  const json: PROJJSONCRSByType<'GeodeticCRS'> = {
    ...geographicJSON,
    type: 'GeodeticCRS',
    coordinate_system: {
      subtype: 'Cartesian',
      axis: [
        {name: 'X', abbreviation: 'X', direction: 'geocentricX', unit: 'metre'},
        {name: 'Y', abbreviation: 'Y', direction: 'geocentricY', unit: 'metre'},
        {name: 'Z', abbreviation: 'Z', direction: 'geocentricZ', unit: 'metre'}
      ]
    }
  };
  const wkt =
    'GEODCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],CS[Cartesian,3],AXIS["X",geocentricX,ORDER[1]],AXIS["Y",geocentricY,ORDER[2]],AXIS["Z",geocentricZ,ORDER[3]],LENGTHUNIT["metre",1]]';
  for (const to of [json, wkt])
    close(new TypeScriptProjection({to, parsers, projections}).project([0, 0, 0]), [6378137, 0, 0]);
});

test('Horizontal extraction preserves vertical values without treating them as ellipsoidal height', () => {
  const from = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: '+proj=longlat +datum=OSGB36',
      representation: 'proj-string',
      provenance: 'metadata'
    },
    vertical: {
      state: 'explicit',
      definition: 'VERTICAL:LOCAL',
      representation: 'identifier',
      provenance: 'metadata'
    }
  });
  const native = new TypeScriptProjection({from, mode: 'horizontal'});
  const low = native.project([4, 50, 10]),
    high = native.project([4, 50, 2000]);
  close(low.slice(0, 2), high.slice(0, 2));
  expect(low[2]).toBe(10);
  expect(high[2]).toBe(2000);
  expect(
    () => new TypeScriptProjection({from, to: 'EPSG:4978', mode: 'horizontal', projections})
  ).toThrow('ellipsoidal height');
});

test('Explicit datum-none disables shifts and custom linear units apply to all geocentric components', () => {
  close(
    new TypeScriptProjection({
      from: '+proj=longlat +ellps=airy +datum=none +towgs84=1,2,3'
    }).project([4, 50, 100]),
    [4, 50, 100]
  );
  const native = new TypeScriptProjection({
    to: '+proj=geocent +datum=WGS84 +to_meter=2',
    projections
  });
  close(native.project([0, 90, 0]), [0, 0, 6356752.314245179 / 2]);
});

for (const ellipsoid of ['WGS84', 'clrk66', 'airy']) {
  for (const flattening of ['+f=0', '+rf=0']) {
    test(`Explicit zero flattening makes ${ellipsoid} spherical (${flattening})`, () => {
      const geometry = `+ellps=${ellipsoid} ${flattening}`;
      const normalized = normalizeCRS(`+proj=longlat ${geometry}`);
      const radius = normalized.ellipsoid.semiMajorAxis;
      expect(normalized.ellipsoid.semiMinorAxis).toBe(radius);
      expect(normalized.ellipsoid.eccentricitySquared).toBe(0);
      const native = new TypeScriptProjection({to: `+proj=merc ${geometry}`, projections});
      const sphere = new TypeScriptProjection({to: `+proj=merc +R=${radius}`, projections});
      close(native.project([20, 45]), sphere.project([20, 45]));
      close(native.unproject(sphere.project([20, 45])), [20, 45]);
      const cartesian = new TypeScriptProjection({to: `+proj=geocent ${geometry}`, projections});
      close(cartesian.project([0, 90, 100]), [0, 0, radius + 100]);
      close(cartesian.unproject([0, 0, radius + 100]), [0, 90, 100]);
    });
  }
}

test('Explicit dimensions retain precedence over named ellipsoid defaults', () => {
  const named = normalizeCRS('+proj=longlat +ellps=clrk66').ellipsoid;
  expect(named.semiMinorAxis).toBe(6356583.8);
  expect(named.eccentricitySquared).toBeGreaterThan(0);
  for (const flattening of ['+f=0', '+rf=0', '+f=0.01 +rf=0']) {
    const custom = normalizeCRS(`+proj=longlat +ellps=clrk66 ${flattening} +a=7000000`).ellipsoid;
    expect(custom.semiMinorAxis).toBe(7000000);
    const explicitB = normalizeCRS(
      `+proj=longlat +ellps=clrk66 ${flattening} +b=6300000`
    ).ellipsoid;
    expect(explicitB.semiMinorAxis).toBe(6300000);
  }
});

test('WGS72 resolves its standard lookup name and numeric dimensions', () => {
  const numeric = new TypeScriptProjection({
    to: '+proj=geocent +a=6378135 +rf=298.26',
    projections
  });
  for (const name of ['WGS72', 'wgs72', 'WGS_72']) {
    const native = new TypeScriptProjection({to: `+proj=geocent +ellps=${name}`, projections});
    const normalized = normalizeCRS(`+proj=longlat +ellps=${name}`).ellipsoid;
    expect(normalized.semiMajorAxis).toBe(6378135);
    expect(normalized.semiMinorAxis).toBe(6378135 * (1 - 1 / 298.26));
    for (const point of [
      [0, 0, 0],
      [12, 48, 250],
      [0, 90, 0]
    ]) {
      close(native.project(point), numeric.project(point));
      close(native.unproject(numeric.project(point)), point);
    }
  }
});

test('datum=none suppresses both endpoints of a Helmert chain, in both directions', () => {
  for (const definition of datumDefinitions) {
    for (const [from, to] of [
      [definition, '+proj=longlat +datum=none'],
      ['+proj=longlat +datum=none', definition]
    ]) {
      const projection = new TypeScriptProjection({from, to});
      const point = [3, 50, 250, 7];
      close(projection.project(point), point, 1e-12);
      close(projection.unproject(point), point, 1e-12);
      const flat = new Float64Array(point);
      projection.projectFlat(flat, 4);
      close(Array.from(flat), point, 1e-12);
    }
  }
});
