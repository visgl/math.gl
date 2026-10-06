// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Authored method-normalization regressions against the proj4js 2.22.0 reference.
import {expect, test, vi} from 'vitest';
import {datumCatalog} from '@math.gl/projection/datums';
import {unshiftedStructuredDatums} from '../fixtures/unshifted-structured-datums';
import proj4 from 'proj4';
import type {PROJJSONCRSByType} from '@math.gl/crs';
import {
  ProjectionEngine,
  normalizeCRS,
  projJSONCRSParser,
  wktCRSParser,
  obliqueMercator,
  krovak,
  mercator,
  stereographic,
  obliqueStereographic
} from '@math.gl/projection/experimental';
import {geographicWKT, projectedJSON} from '../fixtures/crs-datums';
import corpus from '../fixtures/upstream-corpus-2.22.0.json';
const datumCatalogs = [datumCatalog, unshiftedStructuredDatums];
const parsers = [projJSONCRSParser, wktCRSParser];
const projections = [obliqueMercator, krovak, mercator, stereographic, obliqueStereographic];
function close(actual: readonly number[], expected: readonly number[], tolerance = 1e-7) {
  for (let i = 0; i < 2; i++)
    expect(
      Math.abs(actual[i] - expected[i]),
      JSON.stringify({actual, expected})
    ).toBeLessThanOrEqual(tolerance);
}
function hotine(variant: 'A' | 'B', gamma: number): PROJJSONCRSByType<'ProjectedCRS'> {
  return {
    ...projectedJSON,
    conversion: {
      name: 'Authored Hotine test',
      method: {name: 'Hotine Oblique Mercator (variant ' + variant + ')'},
      parameters: [
        {
          name: 'Latitude of projection centre',
          value: 40 / 0.9,
          unit: {
            type: 'AngularUnit',
            name: 'grad',
            conversion_factor: Math.PI / 200
          }
        },
        {name: 'Longitude of projection centre', value: 10, unit: 'degree'},
        {
          name: 'Azimuth at projection centre',
          value: 30 / 0.9,
          unit: {
            type: 'AngularUnit',
            name: 'grad',
            conversion_factor: Math.PI / 200
          }
        },
        {
          name: 'Angle from Rectified to Skew Grid',
          value: gamma / 0.9,
          unit: {
            type: 'AngularUnit',
            name: 'grad',
            conversion_factor: Math.PI / 200
          }
        },
        {
          name: 'Scale factor at projection centre',
          value: 0.9996,
          unit: 'unity'
        },
        {
          name: variant === 'A' ? 'False easting' : 'Easting at projection centre',
          value: 1000,
          unit: 'metre'
        },
        {
          name: variant === 'A' ? 'False northing' : 'Northing at projection centre',
          value: -2000,
          unit: 'metre'
        }
      ]
    },
    coordinate_system: {
      subtype: 'Cartesian',
      axis: [
        {
          name: 'Easting',
          abbreviation: 'E',
          direction: 'east',
          unit: {type: 'LinearUnit', name: 'foot', conversion_factor: 0.3048}
        },
        {
          name: 'Northing',
          abbreviation: 'N',
          direction: 'north',
          unit: {type: 'LinearUnit', name: 'foot', conversion_factor: 0.3048}
        }
      ]
    }
  };
}
for (const variant of ['A', 'B'] as const) {
  for (const gamma of [0, 30, -15]) {
    test(
      'Hotine ' + variant + ' normalizes angular/linear units and rectified angle ' + gamma,
      () => {
        const projection = new ProjectionEngine({
          datumCatalogs,
          to: hotine(variant, gamma),
          parsers,
          projections
        });
        const reference = proj4(
          '+proj=omerc +datum=WGS84 +lat_0=40 +lonc=10 +alpha=30 +gamma=' +
            gamma +
            ' +k_0=0.9996 +x_0=1000 +y_0=-2000 +units=ft' +
            (variant === 'A' ? ' +no_uoff' : '')
        );
        for (const point of [
          [10, 40],
          [11, 41],
          [9, 39]
        ]) {
          close(projection.project(point), reference.forward(point), 1e-6);
          close(projection.unproject(reference.forward(point)), point);
        }
        if (variant === 'B')
          close(projection.project([10, 40]), [1000 / 0.3048, -2000 / 0.3048], 1e-6);
      }
    );
  }
}
test('Method-specific names do not leak to other projections or hide duplicate/conflicting parameters', () => {
  const definition = hotine('B', 0);
  const invalidMethod = {
    ...definition,
    conversion: {
      ...definition.conversion,
      method: {name: 'Transverse Mercator'}
    }
  };
  expect(
    () =>
      new ProjectionEngine({
        datumCatalogs,
        to: invalidMethod,
        parsers,
        projections
      })
  ).toThrow('Unsupported conversion parameter');
  for (const parameter of [
    {name: 'rectified_grid_angle', value: 0},
    {name: 'central_meridian', value: 11}
  ]) {
    const duplicate = {
      ...definition,
      conversion: {
        ...definition.conversion,
        parameters: [...definition.conversion.parameters, parameter]
      }
    };
    expect(
      () =>
        new ProjectionEngine({
          datumCatalogs,
          to: duplicate,
          parsers,
          projections
        })
    ).toThrow(/Duplicate|conflicts/);
  }
});
test('Krovak accepts only its fixed angular constants, in PROJ and structured definitions', () => {
  for (const alpha of [30.28813972222222, 30.28813975277778]) {
    const projection = new ProjectionEngine({
      datumCatalogs,
      to: '+proj=krovak +ellps=bessel +alpha=' + alpha + ' +lat_ts=78.5',
      projections
    });
    close(
      projection.project([14.4, 50.1]),
      proj4('+proj=krovak +ellps=bessel').forward([14.4, 50.1]),
      1e-6
    );
  }
  for (const parameter of ['+alpha=30', '+lat_ts=78', '+alpha=NaN']) {
    expect(
      () =>
        new ProjectionEngine({
          datumCatalogs,
          to: '+proj=krovak ' + parameter,
          projections
        })
    ).toThrow();
  }
  // WKT2 uses a distinct EPSG spelling of the same fixed cone-axis angle.
  const definition = corpus.fixtures[143].code as string;
  expect(
    () =>
      new ProjectionEngine({
        datumCatalogs,
        to: definition.replace('30.2881397527781', '30'),
        parsers,
        projections
      })
  ).toThrow('fixed cone-axis');
  expect(
    () =>
      new ProjectionEngine({
        datumCatalogs,
        to: definition.replace('78.5000000000003', '78'),
        parsers,
        projections
      })
  ).toThrow('fixed 78.5');
});
test('North Pole stereographic alias selects the oblique alternative away from the pole', () => {
  for (const latitude of [46.5, 90]) {
    const definition =
      'PROJCS["legacy",' +
      geographicWKT +
      ',PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",' +
      latitude +
      '],PARAMETER["central_meridian",0],PARAMETER["scale_factor",0.994],UNIT["metre",1]]';
    const projection = new ProjectionEngine({
      datumCatalogs,
      to: definition,
      parsers,
      projections
    });
    const name = latitude === 90 ? 'stere' : 'sterea';
    expect(normalizeCRS(definition, {parsers}).projection).toBe(name);
    const reference = proj4(
      '+proj=' + name + ' +datum=WGS84 +lat_0=' + latitude + ' +lon_0=0 +k_0=0.994 +x_0=0 +y_0=0'
    );
    close(projection.project([2, 50]), reference.forward([2, 50]));
    close(projection.unproject(reference.forward([2, 50])), [2, 50]);
  }
});
test('Legacy pseudo-Mercator semi_minor only confirms the projection sphere', () => {
  const definition = corpus.fixtures[203].code as string;
  const projection = new ProjectionEngine({
    datumCatalogs,
    to: definition,
    parsers,
    projections
  });
  close(projection.project([10, 40]), proj4('EPSG:3857').forward([10, 40]));
  expect(
    () =>
      new ProjectionEngine({
        datumCatalogs,
        to: definition.replace('"semi_minor", 6378137.0', '"semi_minor", 6356752.0'),
        parsers,
        projections
      })
  ).toThrow('semi_minor must equal');
  expect(
    () =>
      new ProjectionEngine({
        datumCatalogs,
        to: definition.replace(
          'PARAMETER["semi_minor", 6378137.0]',
          'PARAMETER["semi_minor", 6378137.0],PARAMETER["semi_minor", 6378137.0]'
        ),
        parsers,
        projections
      })
  ).toThrow('Duplicate');
});
test('Right-angle Hotine azimuth stays finite through ellipsoid roundoff at the Swiss origin', () => {
  for (const latitude of [46.95240555555556, 46.9524055555556, 46.95240555555561]) {
    const to =
      '+proj=omerc +ellps=bessel +lat_0=' +
      latitude +
      ' +lonc=7.43958333333333 +alpha=90 +gamma=90';
    const projection = new ProjectionEngine({
      datumCatalogs,
      from: '+proj=longlat +datum=none',
      to,
      projections
    });
    const point = [7.43958333333333, latitude];
    const projected = projection.project(point);
    close(projected, [0, 0], 0.2);
    close(projection.unproject(projected), point, 1e-7);
  }
});

// Reproduce libm/V8 rounding on either side of the right-angle asin boundary.
test('Hotine right-angle origin is stable across machine-precision changes in gamma', () => {
  const asin = Math.asin;
  for (const delta of [-Number.EPSILON, 0, Number.EPSILON]) {
    const mock = vi.spyOn(Math, 'asin').mockImplementationOnce(value => asin(value) + delta);
    let projection: ProjectionEngine;
    try {
      projection = new ProjectionEngine({
        datumCatalogs,
        from: '+proj=longlat +datum=none',
        to: '+proj=omerc +ellps=bessel +lat_0=46.95240555555556 +lonc=7.43958333333333 +alpha=90 +gamma=90',
        projections
      });
    } finally {
      mock.mockRestore();
    }
    const point = [7.43958333333333, 46.95240555555556];
    close(projection.project(point), [0, 0], 1e-7);
    close(projection.unproject(projection.project(point)), point, 1e-7);
  }
});

test('Right-angle Hotine origins stay accurate at low latitudes in both hemispheres', () => {
  for (const latitude of [5, 10, -5, -10, 0, 1, -1, 45, -45, 80, -80]) {
    const definitions = [
      '+proj=omerc +datum=WGS84 +lat_0=' + latitude + ' +lonc=10 +alpha=90 +gamma=90',
      'PROJCS["Right-angle Hotine",' +
        geographicWKT +
        ',PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],' +
        'PARAMETER["latitude_of_center",' +
        latitude +
        '],' +
        'PARAMETER["longitude_of_center",10],PARAMETER["azimuth",90],' +
        'PARAMETER["rectified_grid_angle",90],PARAMETER["scale_factor",1],' +
        'PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1]]'
    ];
    for (const to of definitions) {
      const projection = new ProjectionEngine({
        datumCatalogs,
        to,
        parsers,
        projections
      });
      close(projection.project([10, latitude]), [0, 0], 1e-7);
      for (const point of [
        [10, latitude],
        [10.1, latitude + 0.1],
        [9.9, latitude - 0.1]
      ]) {
        close(projection.unproject(projection.project(point)), point, 1e-7);
      }
    }
  }
});
