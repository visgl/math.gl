// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {projectionEngine, projJSONCRSParser} from '@math.gl/projection';
import {lazyProjectionEngine} from '@math.gl/projection/projections/lazy';
import {geographicJSON, projectedJSON, projectedWKT2} from '../fixtures/crs-datums';
import inputs from '../fixtures/native-proj-cases.json';
import {sphericalExtremum} from '../../src/experimental/spherical-rendering-domain';
import {createProjectionEngine} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {equalAreaAzimuthalBounds} from '../../src/experimental/azimuthal-rendering-bounds';
import {kernelParameters} from '../../src/experimental/kernel';
import {createAngularRanges} from '../../src/experimental/geographic-bounds';

for (const fixture of inputs.cases) {
  test('finite rendering bounds and normalized containment: ' + fixture.id, async () => {
    const crs = await projectionEngine.getCRS(fixture.definition);
    const [minimum, maximum] = crs.renderingBounds;
    expect([...minimum, ...maximum].every(Number.isFinite)).toBe(true);
    for (let axis = 0; axis < 2; axis++) expect(maximum[axis]).toBeGreaterThan(minimum[axis]);
    for (let longitude = -180; longitude <= 180; longitude += 10) {
      for (let latitude = -90; latitude <= 90; latitude += 10) {
        const normalized = crs.converter.WGS84.normalize([longitude, latitude, 0]);
        const point = crs.converter.WGS84.from(normalized);
        for (let axis = 0; axis < 2; axis++) {
          const tolerance = Math.max(1, Math.abs(minimum[axis]), Math.abs(maximum[axis])) * 1e-8;
          expect(point[axis], `${longitude},${latitude} axis ${axis}`).toBeGreaterThanOrEqual(
            minimum[axis] - tolerance
          );
          expect(point[axis], `${longitude},${latitude} axis ${axis}`).toBeLessThanOrEqual(
            maximum[axis] + tolerance
          );
        }
      }
    }
  });
}

test('lazy retrieval includes rendering profiles for every projection algorithm', async () => {
  const definitions = new Map<string, string>();
  for (const fixture of inputs.cases)
    definitions.set(/\+proj=(\w+)/.exec(fixture.definition)![1], fixture.definition);
  for (const definition of definitions.values()) {
    const eager = await projectionEngine.getCRS(definition);
    const lazy = await lazyProjectionEngine.getCRS(definition);
    expect(lazy.renderingBounds).toEqual(eager.renderingBounds);
    expect(lazy.converter.WGS84.normalize([150, -80])).toEqual(
      eager.converter.WGS84.normalize([150, -80])
    );
  }
});

test('UTM bounds describe a zone while conversion remains available outside it', async () => {
  const north = await projectionEngine.getCRS('EPSG:32618');
  expect(north.renderingBounds[0][0]).toBeCloseTo(166021.44308054, 3);
  expect(north.renderingBounds[1][0]).toBeCloseTo(833978.55691946, 3);
  expect(north.renderingBounds[0][1]).toBeCloseTo(0, 3);
  expect(north.converter.WGS84.normalize([-100, -10])).toEqual([-78, 0]);
  const point = [-80, 40, 123];
  const restored = north.converter.WGS84.to(north.converter.WGS84.from(point));
  expect(restored[0]).toBeCloseTo(point[0], 7);
  expect(restored[1]).toBeCloseTo(point[1], 7);
  const south = await projectionEngine.getCRS('EPSG:32718');
  const normalized = south.converter.WGS84.normalize([-75, 10]);
  expect(normalized[0]).toBeCloseTo(-75, 12);
  expect(normalized[1]).toBe(0);
  expect(south.renderingBounds[1][1]).toBeCloseTo(10000000, 3);
});

test('PROJJSON coverage narrows the rendering target without restricting conversion', async () => {
  const definition = {
    ...projectedJSON,
    bbox: {west_longitude: 2, south_latitude: 40, east_longitude: 4, north_latitude: 50}
  };
  const crs = await projectionEngine.getCRS(definition);
  expect(crs.areaOfUse).toEqual([2, 40, 4, 50]);
  expect(crs.converter.WGS84.normalize([10, 20, 123])).toEqual([4, 40, 123]);
  const outside = crs.converter.WGS84.from([3, 20]);
  expect(outside[1]).toBeLessThan(crs.renderingBounds[0][1]);
  const original = await projectionEngine.getCRS(projectedJSON);
  expect(original.signature).not.toBe(crs.signature);
  expect(crs.renderingBounds[1][1] - crs.renderingBounds[0][1]).toBeLessThan(
    original.renderingBounds[1][1] - original.renderingBounds[0][1]
  );
  const wkt =
    projectedWKT2.slice(0, -1) +
    ',USAGE[SCOPE["Rendering test"],AREA["Test area"],BBOX[40,2,50,4]]]';
  const fromWKT = await projectionEngine.getCRS(wkt);
  expect(fromWKT.areaOfUse).toEqual(crs.areaOfUse);
  expect(fromWKT.renderingBounds).toEqual(crs.renderingBounds);
});

test('declared coverage handles the antimeridian and prime meridian', async () => {
  const definition = {
    ...geographicJSON,
    bbox: {west_longitude: 170, south_latitude: -20, east_longitude: -170, north_latitude: 20}
  };
  const crs = await projectionEngine.getCRS(definition);
  const normalized = crs.converter.WGS84.normalize([-175, 30]);
  expect(normalized[0]).toBeCloseTo(-175, 12);
  expect(normalized[1]).toBe(20);
  expect(crs.renderingBounds[0][0]).toBeCloseTo(-180, 6);
  expect(crs.renderingBounds[1][0]).toBeCloseTo(180, 6);
  // Geographic storage follows its wrapping convention; the rendering rectangle
  // must use the same convention to contain converted normalized coordinates.
  expect(crs.converter.WGS84.from(crs.converter.WGS84.normalize([-175, 30]))[0]).toBeCloseTo(
    -175,
    6
  );
  const shifted = await projectionEngine.getCRS({
    ...geographicJSON,
    prime_meridian: {name: 'Test meridian', longitude: 10},
    bbox: {west_longitude: 20, south_latitude: -20, east_longitude: 30, north_latitude: 20}
  });
  expect(shifted.renderingBounds[0][0]).toBeCloseTo(10, 6);
  expect(shifted.renderingBounds[1][0]).toBeCloseTo(20, 6);
  expect(shifted.converter.WGS84.normalize([40, 0])[0]).toBeCloseTo(30, 12);
});

test('invalid declared geographic coverage fails with an actionable error', async () => {
  await expect(
    projectionEngine.getCRS({
      ...projectedJSON,
      bbox: {west_longitude: 2, south_latitude: 50, east_longitude: 4, north_latitude: 40}
    })
  ).rejects.toThrow('Invalid CRS geographic bounding box');
});

test.each([
  'Orthographic',
  'Gnomonic',
  'Stereographic',
  'Lambert Azimuthal Equal Area',
  'Azimuthal Equidistant'
])('declared coverage encloses normalized curved boundaries for %s', async method => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Test domain',
      method: {name: method},
      parameters: [
        {name: 'Latitude of natural origin', value: 40, unit: 'degree'},
        {name: 'Longitude of natural origin', value: 10, unit: 'degree'}
      ]
    },
    bbox: {west_longitude: -120, south_latitude: -70, east_longitude: 130, north_latitude: 80}
  });
  for (let longitude = -180; longitude <= 180; longitude += 5) {
    for (let latitude = -90; latitude <= 90; latitude += 5) {
      const point = crs.converter.WGS84.from(
        crs.converter.WGS84.normalize([longitude, latitude, 0])
      );
      for (let axis = 0; axis < 2; axis++) {
        expect(point[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.01);
        expect(point[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.01);
      }
    }
  }
});

test.each(['bound', 'compound'] as const)(
  'outer %s CRS coverage takes precedence over inherited coverage',
  async kind => {
    const inherited = {
      ...geographicJSON,
      bbox: {west_longitude: -10, south_latitude: -20, east_longitude: 10, north_latitude: 20}
    };
    const base =
      kind === 'bound'
        ? {
            type: 'BoundCRS' as const,
            source_crs: inherited,
            target_crs: geographicJSON,
            transformation: {
              name: 'Identity translation',
              method: {name: 'Geocentric translations'},
              parameters: ['X-axis translation', 'Y-axis translation', 'Z-axis translation'].map(
                name => ({name, value: 0, unit: 'metre' as const})
              )
            }
          }
        : {
            type: 'CompoundCRS' as const,
            name: 'WGS84 and height',
            components: [
              inherited,
              {type: 'VerticalCRS' as const, name: 'Height', datum: {name: 'Local vertical'}}
            ]
          };
    const options = kind === 'compound' ? {mode: 'horizontal' as const} : {};
    const inheritedDescriptor = await projectionEngine.getCRS(base, options);
    expect(inheritedDescriptor.areaOfUse).toEqual([-10, -20, 10, 20]);
    const bbox = {west_longitude: 2, south_latitude: 40, east_longitude: 4, north_latitude: 50};
    const descriptor = await projectionEngine.getCRS({...base, bbox}, options);
    expect(descriptor.areaOfUse).toEqual([2, 40, 4, 50]);
    expect(descriptor.converter.WGS84.normalize([10, 20])).toEqual([4, 40]);
    const expectedBounds = [
      [2, 40, 0],
      [4, 50, 0]
    ];
    for (let corner = 0; corner < 2; corner++) {
      for (let axis = 0; axis < 3; axis++) {
        expect(descriptor.renderingBounds[corner][axis]).toBeCloseTo(
          expectedBounds[corner][axis],
          9
        );
      }
    }
    expect(descriptor.signature).not.toBe(inheritedDescriptor.signature);
    await expect(
      projectionEngine.getCRS({...base, bbox: {...bbox, south_latitude: 60}}, options)
    ).rejects.toThrow('Invalid CRS geographic bounding box');
  }
);

test('explicit coverage expands the default UTM rendering domain', async () => {
  const bbox = {west_longitude: 0, south_latitude: -10, east_longitude: 10, north_latitude: 85};
  const descriptor = await projectionEngine.getCRS({...projectedJSON, bbox});
  expect(descriptor.converter.WGS84.normalize([9, -5])).toEqual([9, -5]);
  expect(descriptor.converter.WGS84.normalize([20, -20])).toEqual([10, -10]);
  for (const coordinate of [
    [0, -10],
    [10, 0],
    [3, 85]
  ]) {
    const point = descriptor.converter.WGS84.from(coordinate);
    for (let axis = 0; axis < 2; axis++) {
      expect(point[axis]).toBeGreaterThanOrEqual(descriptor.renderingBounds[0][axis] - 1e-6);
      expect(point[axis]).toBeLessThanOrEqual(descriptor.renderingBounds[1][axis] + 1e-6);
    }
  }
});

test('convertible Gnomonic coverage can extend past its default finite rendering cap', async () => {
  const descriptor = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Gnomonic',
      method: {name: 'Gnomonic'},
      parameters: [
        {name: 'Latitude of natural origin', value: 0, unit: 'degree'},
        {name: 'Longitude of natural origin', value: 0, unit: 'degree'}
      ]
    },
    bbox: {west_longitude: 81, south_latitude: -1, east_longitude: 85, north_latitude: 1}
  });
  expect(descriptor.converter.WGS84.normalize([84, 0])).toEqual([84, 0]);
  expect(descriptor.renderingBounds.flat().every(Number.isFinite)).toBe(true);
});

test('coverage clipping is resolved before normalization even when bounds were not requested', async () => {
  const projection = await projectionEngine.createProjectionAsync({
    from: 'WGS84',
    to: {
      ...projectedJSON,
      conversion: {
        name: 'Gnomonic',
        method: {name: 'Gnomonic'},
        parameters: [
          {name: 'Latitude of natural origin', value: 0, unit: 'degree'},
          {name: 'Longitude of natural origin', value: 0, unit: 'degree'}
        ]
      },
      bbox: {west_longitude: -180, south_latitude: -80, east_longitude: 180, north_latitude: 80}
    }
  });
  const point = {x: Math.PI, y: 0, z: 0};
  projection.targetProfile!.normalize!(point);
  const distance = Math.acos(Math.cos(point.x) * Math.cos(point.y));
  expect(distance).toBeCloseTo((Math.PI * 80) / 180, 10);
  expect(projection.targetProfile!.bounds.flat().every(Number.isFinite)).toBe(true);
});

test('Mercator polar coverage uses its finite latitude policy without restricting conversion', async () => {
  const definition = {
    ...projectedJSON,
    conversion: {
      name: 'Mercator',
      method: {name: 'Mercator (variant A)'},
      parameters: []
    }
  };
  const crs = await projectionEngine.getCRS({
    ...definition,
    bbox: {
      west_longitude: -180,
      south_latitude: -90,
      east_longitude: 180,
      north_latitude: 90
    }
  });
  const cap = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI;
  for (const latitude of [-90, 90]) {
    const normalized = crs.converter.WGS84.normalize([0, latitude, 123]);
    expect(normalized[1]).toBeCloseTo(Math.sign(latitude) * cap, 10);
    expect(normalized[2]).toBe(123);
    const point = crs.converter.WGS84.from(normalized);
    expect(point[1]).toBeGreaterThanOrEqual(crs.renderingBounds[0][1]);
    expect(point[1]).toBeLessThanOrEqual(crs.renderingBounds[1][1]);
    expect(() => crs.converter.WGS84.from([0, latitude])).toThrow('undefined at the poles');
  }
  const extended = await projectionEngine.getCRS({
    ...definition,
    bbox: {
      west_longitude: -10,
      south_latitude: -89,
      east_longitude: 10,
      north_latitude: 89
    }
  });
  expect(extended.converter.WGS84.normalize([0, 88])[1]).toBeCloseTo(88, 10);
  expect(extended.renderingBounds[1][1]).toBeGreaterThan(crs.renderingBounds[1][1]);
});

test('stereographic coverage enclosing an interior antipode clips to a finite rendering target', async () => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Stereographic',
      method: {name: 'Stereographic'},
      parameters: [
        {name: 'Longitude of natural origin', value: 180, unit: 'degree'},
        {name: 'Latitude of natural origin', value: 20, unit: 'degree'}
      ]
    },
    bbox: {
      west_longitude: -170,
      south_latitude: -80,
      east_longitude: 170,
      north_latitude: 80
    }
  });
  expect(crs.converter.WGS84.normalize([0, -20])).not.toEqual([0, -20]);
  expect(() => crs.converter.WGS84.from([0, -20])).toThrow('undefined at the antipode');
  for (let longitude = -180; longitude <= 180; longitude += 5) {
    for (let latitude = -90; latitude <= 90; latitude += 5) {
      const normalized = crs.converter.WGS84.normalize([longitude, latitude]);
      const point = crs.converter.WGS84.from(normalized);
      for (let axis = 0; axis < 2; axis++) {
        expect(point[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.01);
        expect(point[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.01);
      }
    }
  }
});

test('Mercator latitude clipping preserves regional longitude and latitude bounds', async () => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {name: 'Mercator', method: {name: 'Mercator (variant A)'}, parameters: []},
    bbox: {west_longitude: 2, south_latitude: 80, east_longitude: 4, north_latitude: 90}
  });
  const cap = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI;
  const minimum = crs.converter.WGS84.from([2, 80]);
  const maximum = crs.converter.WGS84.from([4, cap]);
  for (let axis = 0; axis < 2; axis++) {
    expect(crs.renderingBounds[0][axis]).toBeCloseTo(minimum[axis], 3);
    expect(crs.renderingBounds[1][axis]).toBeCloseTo(maximum[axis], 3);
  }
  const normalized = crs.converter.WGS84.normalize([10, 90, 123]);
  expect(normalized[0]).toBeCloseTo(4, 10);
  expect(normalized[1]).toBeCloseTo(cap, 10);
  expect(normalized[2]).toBe(123);
});

test('Orthographic coverage intersects the curved horizon without expanding to a full hemisphere', async () => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {
      name: 'Orthographic',
      method: {name: 'Orthographic'},
      parameters: [
        {name: 'Longitude of natural origin', value: 0, unit: 'degree'},
        {name: 'Latitude of natural origin', value: 0, unit: 'degree'}
      ]
    },
    bbox: {west_longitude: 60, south_latitude: -10, east_longitude: 120, north_latitude: 10}
  });
  const minimum = crs.converter.WGS84.from([60, -10]);
  const maximum = crs.converter.WGS84.from([90, 0]);
  const upperCorner = crs.converter.WGS84.from([90, 10]);
  expect(crs.renderingBounds[0][0]).toBeCloseTo(minimum[0], 3);
  expect(crs.renderingBounds[1][0]).toBeCloseTo(maximum[0], 3);
  expect(crs.renderingBounds[0][1]).toBeCloseTo(-upperCorner[1], 3);
  expect(crs.renderingBounds[1][1]).toBeCloseTo(upperCorner[1], 3);
  for (let longitude = 60; longitude <= 120; longitude += 5) {
    for (let latitude = -90; latitude <= 90; latitude += 5) {
      const normalized = crs.converter.WGS84.normalize([longitude, latitude, 123]);
      expect(normalized[0]).toBeGreaterThanOrEqual(60 - 1e-8);
      expect(normalized[0]).toBeLessThanOrEqual(90 + 1e-8);
      expect(normalized[1]).toBeGreaterThanOrEqual(-10 - 1e-8);
      expect(normalized[1]).toBeLessThanOrEqual(10 + 1e-8);
      expect(normalized[2]).toBe(123);
      const projected = crs.converter.WGS84.from(normalized);
      for (let axis = 0; axis < 2; axis++) {
        expect(projected[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.01);
        expect(projected[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.01);
      }
    }
  }
});

test('analytical cap intersections retain a narrow meridian strip', () => {
  const west = 0.4,
    east = west + 1e-8;
  const region = createAngularRanges(west, -0.8, east, 0.8);
  const cap = {latitude: 0, distance: 0.5};
  const longitude = (west + east) / 2;
  const latitude = Math.acos(Math.cos(cap.distance) / Math.cos(longitude));
  const result = sphericalExtremum(
    [0, Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude)],
    region,
    cap
  );
  expect(result.value).toBeCloseTo(Math.sin(cap.distance) ** 2, 12);
  expect(result.point[0]).toBeCloseTo(longitude, 12);
  expect(result.point[1]).toBeCloseTo(latitude, 12);
});

test('linear-fractional horizon extrema include cap tangencies between coverage corners', async () => {
  const radius = 6371000;
  const crs = await projectionEngine.getCRS('+proj=gnom +R=6371000 +lat_0=37 +lon_0=123');
  const extent = radius * Math.tan((80 * Math.PI) / 180);
  for (let axis = 0; axis < 2; axis++) {
    expect(crs.renderingBounds[0][axis]).toBeCloseTo(-extent, 3);
    expect(crs.renderingBounds[1][axis]).toBeCloseTo(extent, 3);
  }
});

test('Mercator coverage bounds do not evaluate a coordinate-conversion sampling grid', async () => {
  let calls = 0;
  const engine = createProjectionEngine({
    parsers: [projJSONCRSParser],
    projections: [
      {
        ...mercator,
        create(context) {
          const projection = mercator.create(context);
          return {
            ...projection,
            forward(x, y) {
              calls++;
              return projection.forward(x, y);
            }
          };
        }
      }
    ]
  });
  const crs = await engine.getCRS({
    ...projectedJSON,
    conversion: {name: 'Mercator', method: {name: 'Mercator (variant A)'}, parameters: []},
    bbox: {west_longitude: 2, south_latitude: 80, east_longitude: 4, north_latitude: 90}
  });
  expect(crs.renderingBounds[1][0]).toBeGreaterThan(crs.renderingBounds[0][0]);
  expect(calls).toBe(0);
});

for (const fixture of inputs.cases) {
  // UTM supplies its standardized false offsets rather than accepting overrides.
  if (/\+proj=(geocent|longlat|ob_tran|utm)/.test(fixture.definition)) continue;
  test('analytical rendering bounds preserve false offsets: ' + fixture.id, async () => {
    const definition = fixture.definition.replace(/\+x_0=\S+|\+y_0=\S+/g, '');
    const original = await projectionEngine.getCRS(definition);
    const shifted = await projectionEngine.getCRS(definition + ' +x_0=1234 +y_0=-5678');
    for (let corner = 0; corner < 2; corner++) {
      expect(shifted.renderingBounds[corner][0] - original.renderingBounds[corner][0]).toBeCloseTo(
        1234,
        2
      );
      expect(shifted.renderingBounds[corner][1] - original.renderingBounds[corner][1]).toBeCloseTo(
        -5678,
        2
      );
    }
  });
}

test.each([
  ['+proj=lcc +lat_1=30 +lat_2=60 +lat_0=40', 0, -Math.PI / 2, 0, -Math.PI / 3],
  ['+proj=tmerc +datum=WGS84', Math.PI / 2, 0, Math.PI / 6, 0]
])(
  'analytical singularity extrema clip declared world coverage for %s',
  async (definition, x, y, expectedX, expectedY) => {
    const projection = await projectionEngine.createProjectionAsync({to: definition as string});
    const profile = projection.getTargetRenderingProfile([-180, -90, 180, 90])!;
    expect(profile.bounds.flat().every(Number.isFinite)).toBe(true);
    const point = {x: x as number, y: y as number, z: 123};
    profile.normalize!(point);
    expect(point.x).toBeCloseTo(expectedX as number, 10);
    expect(point.y).toBeCloseTo(expectedY as number, 10);
    expect(point.z).toBe(123);
  }
);

test.each([
  ['sphere', {name: 'Sphere', semi_major_axis: 6371000, semi_minor_axis: 6371000}],
  ['WGS84', geographicJSON.datum!.ellipsoid],
  ['flattened', {name: 'Flattened', semi_major_axis: 6371000, inverse_flattening: 4}]
])(
  'LAEA coverage outside its cap falls back with usable normalization: %s',
  async (_name, ellipsoid) => {
    const definition = {
      ...projectedJSON,
      base_crs: {...geographicJSON, datum: {...geographicJSON.datum!, ellipsoid}},
      conversion: {name: 'LAEA', method: {name: 'Lambert Azimuthal Equal Area'}, parameters: []},
      bbox: {west_longitude: 179.5, south_latitude: -0.1, east_longitude: 180, north_latitude: 0.1}
    };
    const crs = await projectionEngine.getCRS(definition);
    const fallback = await projectionEngine.getCRS({...definition, bbox: undefined});
    expect(crs.areaOfUse).toEqual([179.5, -0.1, 180, 0.1]);
    expect(crs.renderingBounds).toEqual(fallback.renderingBounds);
    const normalized = crs.converter.WGS84.normalize([180, 0, 123]);
    expect(normalized[1]).toBeCloseTo(1, 10);
    expect(normalized[2]).toBe(123);
    const projected = crs.converter.WGS84.from(normalized);
    for (let axis = 0; axis < 2; axis++) {
      expect(projected[axis]).toBeGreaterThanOrEqual(crs.renderingBounds[0][axis] - 0.001);
      expect(projected[axis]).toBeLessThanOrEqual(crs.renderingBounds[1][axis] + 0.001);
    }
  }
);

test('spherical LAEA bounds use the cap in their analytical extrema', () => {
  const radius = 6371000;
  const base = kernelParameters({semiMajorAxis: radius, eccentricitySquared: 0, parameters: {}});
  const coverage = createAngularRanges(-Math.PI, -Math.PI / 2, Math.PI, Math.PI / 2);
  const cap = {latitude: 0, distance: Math.PI / 3};
  const bounds = equalAreaAzimuthalBounds(base, 1, 1, coverage, cap, 0, latitude => latitude);
  const unclipped = equalAreaAzimuthalBounds(
    base,
    1,
    1,
    coverage,
    undefined,
    0,
    latitude => latitude
  );
  for (let axis = 0; axis < 2; axis++) {
    expect(bounds[0][axis]).toBeCloseTo(-radius, 4);
    expect(bounds[1][axis]).toBeCloseTo(radius, 4);
    expect(bounds[1][axis]).toBeLessThan(unclipped[1][axis]);
  }
});

for (const [projection, distance] of [
  ['stere', 150],
  ['laea', 179],
  ['aeqd', 179],
  ['ortho', 90],
  ['gnom', 80]
] as const) {
  test.each([-20, 0, 37])(
    `${projection} exact antipodes normalize northward at latitude %s`,
    async latitude => {
      const longitude = 30;
      const crs = await projectionEngine.getCRS(
        `+proj=${projection} +R=6371000 +lon_0=${longitude} +lat_0=${latitude}`
      );
      const angle = ((latitude + distance) * Math.PI) / 180;
      const expectedLongitude = longitude + (Math.cos(angle) < 0 ? 180 : 0);
      const expectedLatitude =
        (Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle))) * 180) / Math.PI;
      const normalized = crs.converter.WGS84.normalize([longitude - 180, -latitude, 456]);
      expect(Math.sin(((normalized[0] - expectedLongitude) * Math.PI) / 180)).toBeCloseTo(0, 12);
      expect(Math.cos(((normalized[0] - expectedLongitude) * Math.PI) / 180)).toBeCloseTo(1, 12);
      expect(normalized[1]).toBeCloseTo(expectedLatitude, 10);
      expect(normalized[2]).toBe(456);
    }
  );
}

test('antipode preference retains declared coverage when the northward point is excluded', async () => {
  const crs = await projectionEngine.getCRS({
    ...projectedJSON,
    conversion: {name: 'Stereographic', method: {name: 'Stereographic'}, parameters: []},
    bbox: {west_longitude: -180, south_latitude: -80, east_longitude: 180, north_latitude: 0}
  });
  const normalized = crs.converter.WGS84.normalize([180, 0, 456]);
  expect(normalized[1]).toBeCloseTo(-30, 10);
  expect(normalized[2]).toBe(456);
});

test.each([0, 170, -170])(
  'satellite world coverage includes both sides of longitude %s',
  async longitude => {
    const projection = await projectionEngine.createProjectionAsync({
      to: `+proj=geos +h=35785831 +lon_0=${longitude} +ellps=WGS84`
    });
    const profile = projection.getTargetRenderingProfile([-180, -90, 180, 90])!;
    for (const offset of [-60, -30, 0, 30, 60]) {
      const point = {x: ((longitude + offset) * Math.PI) / 180, y: 0, z: 123};
      profile.normalize!(point);
      expect(Math.sin(point.x - ((longitude + offset) * Math.PI) / 180)).toBeCloseTo(0, 12);
      expect(Math.cos(point.x - ((longitude + offset) * Math.PI) / 180)).toBeCloseTo(1, 12);
      expect(point.z).toBe(123);
      const projected = projection.project([longitude + offset, 0, 123]);
      for (let axis = 0; axis < 2; axis++) {
        expect(projected[axis]).toBeGreaterThanOrEqual(profile.bounds[0][axis] - 0.001);
        expect(projected[axis]).toBeLessThanOrEqual(profile.bounds[1][axis] + 0.001);
      }
    }
  }
);

test.each([
  [160, -10, -160, 10],
  [-160, -10, 160, 10]
] as const)(
  'satellite respects periodic and disconnected coverage %s,%s,%s,%s',
  async (west, south, east, north) => {
    const projection = await projectionEngine.createProjectionAsync({
      to: '+proj=geos +h=35785831 +lon_0=170 +ellps=WGS84'
    });
    const profile = projection.getTargetRenderingProfile([west, south, east, north])!;
    const points = west > east ? [175, 185] : [140, 230];
    for (const longitude of points) {
      const point = {x: (longitude * Math.PI) / 180, y: 0, z: 0};
      profile.normalize!(point);
      expect(Math.cos(point.x - (longitude * Math.PI) / 180)).toBeCloseTo(1, 12);
      const projected = projection.project([longitude, 0]);
      expect(projected[0]).toBeGreaterThanOrEqual(profile.bounds[0][0] - 0.001);
      expect(projected[0]).toBeLessThanOrEqual(profile.bounds[1][0] + 0.001);
    }
  }
);

test('rotated geographic bounds contain both sides of the output seam', async () => {
  const projection = await projectionEngine.createProjectionAsync({
    to: '+proj=ob_tran +o_proj=longlat +o_lat_p=90 +o_lon_p=180'
  });
  const profile = projection.getTargetRenderingProfile([-10, -10, 10, 10])!;
  for (const longitude of [-5, 0, 5]) {
    const point = {x: (longitude * Math.PI) / 180, y: 0, z: 123};
    profile.normalize!(point);
    const projected = projection.project([
      (point.x * 180) / Math.PI,
      (point.y * 180) / Math.PI,
      point.z
    ]);
    expect(projected[0]).toBeGreaterThanOrEqual(profile.bounds[0][0] - 1e-10);
    expect(projected[0]).toBeLessThanOrEqual(profile.bounds[1][0] + 1e-10);
    expect(projected[2]).toBe(123);
  }
});

test('spherical Polyconic coverage preserves large false northing across the latitude branch', async () => {
  const projection = await projectionEngine.createProjectionAsync({
    to: '+proj=poly +R=6371000 +lat_0=30 +y_0=100000000'
  });
  const profile = projection.getTargetRenderingProfile([-180, -80, 180, 80])!;
  const origin = projection.project([0, 30]);
  expect(origin[1]).toBe(100000000);
  expect(origin[1]).toBeGreaterThanOrEqual(profile.bounds[0][1]);
  expect(origin[1]).toBeLessThanOrEqual(profile.bounds[1][1]);
});

test('UTM uses its derived meridian for rendering scale at the dateline', async () => {
  for (const code of ['EPSG:32601', 'EPSG:32660']) {
    const crs = await projectionEngine.getCRS(code);
    const point = crs.converter.WGS84.from([180, 40]);
    const scale = crs.getRenderingScale(point);
    expect(scale).not.toBeNull();
    expect(scale!.every(value => Number.isFinite(value) && value > 0)).toBe(true);
  }
});

for (const definition of [
  'WGS84',
  '+proj=merc +R=6371000',
  '+proj=eqc +R=6371000',
  '+proj=eqearth +R=6371000'
]) {
  test.each([
    [170, -10, 180, 10],
    [-180, -10, -170, 10],
    [180, -10, 180, 10],
    [-180, -10, -180, 10]
  ] as const)(
    `covered dateline aliases stay within ${definition} bounds %s,%s,%s,%s`,
    async (west, south, east, north) => {
      const projection = await projectionEngine.createProjectionAsync({to: definition});
      const profile = projection.getTargetRenderingProfile([west, south, east, north])!;
      for (const longitude of [-180, 180]) {
        const point = {x: (longitude * Math.PI) / 180, y: 0, z: 0};
        profile.normalize!(point);
        const projected = projection.project([
          (point.x * 180) / Math.PI,
          (point.y * 180) / Math.PI
        ]);
        // Geographic profiles use native radians; the public converter stores degrees.
        const x = definition === 'WGS84' ? (projected[0] * Math.PI) / 180 : projected[0];
        expect(x).toBeGreaterThanOrEqual(profile.bounds[0][0] - 0.001);
        expect(x).toBeLessThanOrEqual(profile.bounds[1][0] + 0.001);
      }
    }
  );
}

for (const definition of [
  '+proj=merc +R=6371000 +lon_0=100 +over',
  '+proj=eqc +R=6371000 +lon_0=100 +over',
  '+proj=eqearth +R=6371000 +lon_0=100 +over'
]) {
  test(`unwrapped conversion shares its declared coverage interval: ${definition}`, async () => {
    const projection = await projectionEngine.createProjectionAsync({to: definition});
    const profile = projection.getTargetRenderingProfile([-170, -10, 170, 10])!;
    for (const longitude of [-170, -100, 0, 100, 170, 190]) {
      const point = {x: (longitude * Math.PI) / 180, y: 0, z: 0};
      profile.normalize!(point);
      const normalizedLongitude = (point.x * 180) / Math.PI;
      expect(normalizedLongitude).toBeGreaterThanOrEqual(-170 - 1e-10);
      expect(normalizedLongitude).toBeLessThanOrEqual(170 + 1e-10);
      const projected = projection.project([normalizedLongitude, 0]);
      expect(projected[0]).toBeGreaterThanOrEqual(profile.bounds[0][0] - 0.001);
      expect(projected[0]).toBeLessThanOrEqual(profile.bounds[1][0] + 0.001);
    }
  });
}
