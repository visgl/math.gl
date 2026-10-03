// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Authored tests against the pinned proj4js 2.22.0 reference.
import {expect, test} from 'vitest';
import proj4 from 'proj4';
// These upstream kernels are intentionally absent from its default bundle.
// @ts-expect-error Upstream ships no declarations for individual kernels.
import upstreamOrtho from 'proj4/lib/projections/ortho';
// @ts-expect-error Upstream ships no declarations for individual kernels.
import upstreamGstmerc from 'proj4/lib/projections/gstmerc';
// @ts-expect-error Upstream ships no declarations for individual kernels.
import upstreamEqui from 'proj4/lib/projections/equi';
import * as native from '@math.gl/projection/experimental';
import independent from '../fixtures/native-proj-reference.json';
import {catalogueProjectionCases} from '../fixtures/catalogue-projections';
proj4.Proj.projections.add(upstreamOrtho);
proj4.Proj.projections.add(upstreamGstmerc);
proj4.Proj.projections.add(upstreamEqui);
const projections: native.ProjectionPlugin[] = [
  native.bonne,
  native.cassiniSoldner,
  native.cylindricalEqualArea,
  native.eckertVI,
  native.equalEarth,
  native.equirectangular,
  native.geostationary,
  native.gnomonic,
  native.gaussSchreiberTransverseMercator,
  native.krovak,
  native.millerCylindrical,
  native.mollweide,
  native.newZealandMapGrid,
  native.obliqueMercator,
  native.orthographic,
  native.polyconic,
  native.quadrilateralizedSphericalCube,
  native.robinson,
  native.sinusoidal,
  native.swissObliqueMercator,
  native.tiltedPerspective,
  native.vanDerGrinten
];
function close(actual: readonly number[], expected: readonly number[], tolerance: number): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) =>
    expect(
      Math.abs(value - expected[index]),
      JSON.stringify({actual, expected, index})
    ).toBeLessThanOrEqual(tolerance)
  );
}
for (const fixture of catalogueProjectionCases) {
  test('catalogue parity: ' + fixture.id, () => {
    const referenceDefinition = fixture.definition + ' +datum=none';
    // Upstream defaults can be undefined; Krovak has its own nonzero defaults.
    let ref = referenceDefinition;
    for (const key of ['lon_0', 'lat_0', 'x_0', 'y_0'])
      if (
        !ref.includes('+' + key + '=') &&
        !(fixture.id.startsWith('krovak') && ['lon_0', 'lat_0'].includes(key))
      )
        ref += ' +' + key + '=0';
    const reference = proj4('+proj=longlat +datum=none', ref);
    for (const [units, factor] of [
      ['', 1],
      [' +units=us-ft', 1200 / 3937],
      [' +to_meter=1000', 1000]
    ] as const) {
      const projection = new native.ProjectionEngine({
        from: '+proj=longlat +datum=none',
        to: referenceDefinition + ' +x_0=123 +y_0=-456' + units,
        projections
      });
      for (const dx of [-0.5, 0, 0.5])
        for (const dy of [-0.5, 0, 0.5]) {
          const coordinate = Object.freeze([
            fixture.center[0] + dx,
            fixture.center[1] + dy,
            123,
            7
          ]);
          // Cassini signs/refinement and Robinson coefficients intentionally improve
          // on proj4js. Keep their offset/unit checks tied to native PROJ references.
          const corrected = fixture.id.startsWith('cass') || fixture.id.startsWith('robin');
          const oracle = corrected
            ? independent.cases
                .find(row => row.id === fixture.id)!
                .results.find(
                  row => row.input[0] === coordinate[0] && row.input[1] === coordinate[1]
                )!
            : undefined;
          const expected = oracle
            ? [...oracle.forward, 123, 7]
            : reference.forward([...coordinate]);
          const result = projection.project(coordinate);
          close(
            result,
            [(expected[0] + 123) / factor, (expected[1] - 456) / factor, 123, 7],
            3e-5 / factor
          );
          close(projection.unproject(result), coordinate, fixture.tolerance || 1e-7);
          // equi's upstream inverse omits its return; gnom's origin inverse uses an undefined latitude.
          if (
            !corrected &&
            !fixture.id.startsWith('equi') &&
            !(fixture.id.startsWith('gnom') && dx === 0 && dy === 0) &&
            !(fixture.id.startsWith('tpers') && dx === 0 && dy === 0)
          ) {
            close(projection.unproject(result), reference.inverse(expected), 1e-8);
          }
        }
    }
  });
}
for (const parameters of [
  '+o_lat_p=45 +o_lon_p=-90',
  '+o_lat_p=0 +o_lon_p=0',
  '+o_alpha=30 +o_lon_c=10 +o_lat_c=40',
  '+o_lon_1=10 +o_lat_1=20 +o_lon_2=40 +o_lat_2=50'
]) {
  test('ob_tran explicit dependency: ' + parameters, () => {
    for (const wrapped of [native.mollweide, 'longlat'] as const) {
      const to =
        '+proj=ob_tran +o_proj=' +
        (wrapped === 'longlat' ? 'longlat' : 'moll') +
        ' ' +
        parameters +
        ' +lon_0=12 +datum=none';
      const projection = new native.ProjectionEngine({
        to,
        projections: [native.obliqueTransformation(wrapped)]
      });
      const reference = proj4('+proj=longlat +datum=none', to);
      for (const point of [
        [20, 30, 123, 7],
        [-40, -20, 123, 7],
        [80, 60, 123, 7]
      ]) {
        close(projection.project(point), reference.forward(point), 1e-6);
        close(projection.unproject(projection.project(point)), point, 1e-8);
      }
    }
  });
}
test('orthographic false easting and inverse domain; visible horizon', () => {
  const projection = new native.ProjectionEngine({
    to: '+proj=ortho +R=6371000 +lon_0=0 +lat_0=0 +x_0=123 +y_0=456',
    projections
  });
  close(projection.project([90, 0]), [6371123, 456], 1e-8);
  close(projection.unproject([123, 456]), [0, 0], 1e-12);
  expect(() => projection.project([100, 0])).toThrow();
  expect(() => projection.unproject([7000000, 0])).toThrow();
});
test('catalogue parameter validation and explicit wrapped dependencies', () => {
  for (const to of [
    '+proj=bonne',
    '+proj=geos +h=-1',
    '+proj=geos +h=1000 +sweep=z',
    '+proj=nzmg +lat_0=-41 +lon_0=173 +iterations=-1',
    '+proj=omerc +alpha=30',
    '+proj=tpers +tilt=90'
  ])
    expect(() => new native.ProjectionEngine({to, projections})).toThrow();
  expect(
    () =>
      new native.ProjectionEngine({
        to: '+proj=ob_tran +o_proj=robin +o_lat_p=45 +o_lon_p=0',
        projections: [native.obliqueTransformation(native.mollweide)]
      })
  ).toThrow();
  expect(
    () =>
      new native.ProjectionEngine({
        to: '+proj=ob_tran +o_lat_p=45',
        projections: [native.obliqueTransformation(native.mollweide)]
      })
  ).toThrow();
});
test('world projections cover both hemispheres and longitude wrapping', () => {
  for (const plugin of [
    native.cylindricalEqualArea,
    native.eckertVI,
    native.equalEarth,
    native.equirectangular,
    native.millerCylindrical,
    native.mollweide,
    native.robinson,
    native.sinusoidal,
    native.vanDerGrinten
  ]) {
    const to = '+proj=' + plugin.name + ' +lon_0=10 +x_0=0 +y_0=0 +datum=none';
    const projection = new native.ProjectionEngine({to, projections: [plugin]});
    const reference = proj4('+proj=longlat +datum=none', to + ' +lat_0=0');
    for (const lon of [-179, -120, 10, 100, 179])
      for (const lat of [-80, -45, 0, 45, 80]) {
        const point = [lon, lat, 123, 7];
        const expected =
          plugin.name === 'robin'
            ? [
                ...independent.cases
                  .find(row => row.id === 'robin-world-wrapping')!
                  .results.find(row => row.input[0] === lon && row.input[1] === lat)!.forward,
                123,
                7
              ]
            : reference.forward(point);
        close(projection.project(point), expected, 1e-5);
        close(
          projection.unproject(projection.project(point)),
          point,
          plugin.name === 'robin' ? 2e-5 : 1e-7
        );
      }
  }
});
test('catalogue aliases resolve to the same local plugin', () => {
  for (const plugin of projections) {
    const fixture = catalogueProjectionCases.find(entry =>
      entry.definition.startsWith('+proj=' + plugin.name + ' ')
    );
    expect(fixture, plugin.name).toBeDefined();
    if (!fixture) continue;
    const projection = new native.ProjectionEngine({
      to: fixture.definition,
      projections: [plugin]
    });
    for (const alias of plugin.aliases || []) {
      const aliased = new native.ProjectionEngine({
        to: fixture.definition.replace('+proj=' + plugin.name, '+proj="' + alias + '"'),
        projections: [plugin]
      });
      const expected =
        plugin.name === 'omerc' &&
        [
          'hotineobliquemercator',
          'hotineobliquemercatorvarianta',
          'hotineobliquemercatorazimuthnaturalorigin'
        ].includes(alias.toLowerCase().replace(/[^a-z]/g, ''))
          ? new native.ProjectionEngine({
              to: fixture.definition + ' +no_off',
              projections: [plugin]
            }).project(fixture.center)
          : projection.project(fixture.center);
      close(aliased.project(fixture.center), expected, 1e-8);
    }
  }
});
test('oblique Mercator and Robinson preserve height with enforced axes', () => {
  for (const definition of [
    '+proj=robin +lon_0=0',
    catalogueProjectionCases.find(entry => entry.id === 'omerc-alpha')!.definition
  ]) {
    const to = definition + ' +axis=neu +datum=none +x_0=0 +y_0=0';
    const projection = new native.ProjectionEngine({to, projections, enforceAxis: true});
    const reference = proj4('+proj=longlat +datum=none', to);
    const point = definition.includes('omerc') ? [115, 5, 123, 7] : [20, 30, 123, 7];
    const corrected = independent.cases.find(row => row.id === 'robin-axis-regression')!.results[0]
      .forward;
    close(
      projection.project(point),
      definition.includes('robin')
        ? [corrected[1], corrected[0], 123, 7]
        : reference.forward(point, true),
      1e-6
    );
    close(projection.unproject(projection.project(point)), point, 1e-7);
  }
});
test('Mollweide poles remain finite and hemisphere-correct', () => {
  const projection = new native.ProjectionEngine({to: '+proj=moll +R=6371000', projections});
  for (const sign of [-1, 1]) {
    close(projection.project([0, sign * 90]), [0, sign * Math.SQRT2 * 6371000], 1e-7);
    close(projection.unproject(projection.project([0, sign * 90])), [0, sign * 90], 1e-6);
  }
});
test('Van der Grinten equator, central meridian and poles', () => {
  const to = '+proj=vandg +lon_0=10 +R=6371000 +x_0=0 +y_0=0';
  const projection = new native.ProjectionEngine({to, projections});
  const reference = proj4(to);
  for (const point of [
    [10, 0],
    [40, 0],
    [10, 45],
    [10, -45],
    [10, 90],
    [10, -90]
  ]) {
    close(projection.project(point), reference.forward(point), 1e-8);
    close(projection.unproject(projection.project(point)), point, 1e-6);
  }
});
test('southern Bonne inverse retains the signed radius', () => {
  for (const geometry of ['+ellps=WGS84', '+R=6371000']) {
    const to = '+proj=bonne +lat_1=-45 +lon_0=10 +datum=none ' + geometry;
    const projection = new native.ProjectionEngine({to, projections});
    const reference = proj4('+proj=longlat +datum=none', to);
    for (const point of [
      [10, -45],
      [20, -30],
      [-20, -60]
    ]) {
      close(projection.project(point), reference.forward(point), 1e-8);
      close(projection.unproject(projection.project(point)), point, 1e-8);
    }
  }
});
test('perspective kernels reject coordinates behind the horizon', () => {
  for (const to of [
    '+proj=gnom +lat_0=0',
    '+proj=ortho +lat_0=0',
    '+proj=geos +h=35785831',
    '+proj=geos +h=35785831 +R=6371000',
    '+proj=tpers +h=1000000 +lat_0=0'
  ]) {
    const projection = new native.ProjectionEngine({to, projections});
    expect(() => projection.project([180, 0])).toThrow();
    close(projection.unproject(projection.project([0, 0])), [0, 0], 1e-8);
  }
});
test('catalogue methods share the math.gl/crs WKT and PROJJSON readers', () => {
  for (const [method, code] of [
    ['Equal Earth', 'eqearth'],
    ['Mollweide', 'moll'],
    ['Robinson', 'robin'],
    ['Sinusoidal', 'sinu'],
    ['Cassini-Soldner', 'cass'],
    ['Orthographic', 'ortho']
  ]) {
    const regional = ['cass', 'ortho'].includes(code);
    const parameters = [
      {name: 'Longitude of natural origin', value: 10, unit: 'degree'},
      {name: 'False easting', value: 123, unit: 'metre'},
      {name: 'False northing', value: 456, unit: 'metre'},
      ...(regional ? [{name: 'Latitude of natural origin', value: 40, unit: 'degree'}] : [])
    ];
    const geographic =
      'GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]]';
    const wkt =
      'PROJCS["catalogue",' +
      geographic +
      ',PROJECTION["' +
      method +
      '"],' +
      parameters.map(p => 'PARAMETER["' + p.name + '",' + p.value + ']').join(',') +
      ',UNIT["metre",1]]';
    const json = {
      type: 'ProjectedCRS' as const,
      name: 'catalogue',
      base_crs: {
        type: 'GeographicCRS' as const,
        name: 'WGS84',
        datum: {
          type: 'GeodeticReferenceFrame' as const,
          name: 'World Geodetic System 1984',
          ellipsoid: {name: 'WGS84', semi_major_axis: 6378137, inverse_flattening: 298.257223563}
        },
        coordinate_system: {
          subtype: 'ellipsoidal' as const,
          axis: [
            {
              name: 'Longitude',
              abbreviation: 'lon',
              direction: 'east' as const,
              unit: 'degree' as const
            },
            {
              name: 'Latitude',
              abbreviation: 'lat',
              direction: 'north' as const,
              unit: 'degree' as const
            }
          ]
        }
      },
      conversion: {name: 'catalogue', method: {name: method}, parameters},
      coordinate_system: {
        subtype: 'Cartesian' as const,
        axis: [
          {name: 'Easting', abbreviation: 'E', direction: 'east' as const, unit: 'metre' as const},
          {name: 'Northing', abbreviation: 'N', direction: 'north' as const, unit: 'metre' as const}
        ]
      }
    };
    const expected = new native.ProjectionEngine({
      to: '+proj=' + code + ' +lon_0=10 +x_0=123 +y_0=456' + (regional ? ' +lat_0=40' : ''),
      projections
    }).project([11, 41, 123]);
    for (const to of [wkt, json])
      close(
        new native.ProjectionEngine({
          to,
          projections,
          parsers: [native.wktCRSParser, native.projJSONCRSParser]
        }).project([11, 41, 123]),
        expected,
        1e-7
      );
  }
});
test('ob_tran preserves wrapped Hotine variant aliases and flags', () => {
  const base = '+proj=ob_tran +o_lat_p=45 +o_lon_p=0 +lat_0=4 +lonc=115 +alpha=53';
  const projections = [native.obliqueTransformation(native.obliqueMercator)];
  const variant = new native.ProjectionEngine({
    to: base + ' +o_proj=Hotine_Oblique_Mercator_variant_A',
    projections
  });
  const explicit = new native.ProjectionEngine({
    to: base + ' +o_proj=omerc +no_off',
    projections
  });
  close(variant.project([20, 30, 123]), explicit.project([20, 30, 123]), 1e-8);
  close(variant.unproject(variant.project([20, 30, 123])), [20, 30, 123], 1e-8);
});

test('Mollweide preserves unwrapped longitude only when over is enabled', () => {
  for (const geometry of ['+ellps=WGS84', '+R=6371000']) {
    for (const origin of [0, 30]) {
      const to = '+proj=moll ' + geometry + ' +lon_0=' + origin + ' +x_0=123 +y_0=-456';
      const unwrapped = new native.ProjectionEngine({
        to: to + ' +over',
        projections: [native.mollweide]
      });
      const wrapped = new native.ProjectionEngine({to, projections: [native.mollweide]});
      for (const point of [
        [200, 0, 123, 7],
        [-200, 30, 123, 7],
        [240, -45, 123, 7]
      ]) {
        close(unwrapped.unproject(unwrapped.project(point)), point, 1e-8);
        const longitude = ((((point[0] + 180) % 360) + 360) % 360) - 180;
        close(wrapped.unproject(wrapped.project(point)), [longitude, ...point.slice(1)], 1e-8);
      }
    }
  }
});
