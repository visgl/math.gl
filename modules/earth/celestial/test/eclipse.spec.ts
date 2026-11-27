// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  JulianDate,
  getApproximatePlanetPosition,
  getBodyFixedFrame,
  getBodyRadii,
  getDiscVisibleFraction,
  getRingTransmission,
  getSunVisibleFraction
} from '../../src/celestial';
import type {EclipseOccluder} from '../../src/celestial';

type Vector = [number, number, number];

const DEGREES = 180 / Math.PI;
const KM_PER_AU = 149597870.7;
const SUN_RADIUS_KM = getBodyRadii('sun').equatorialRadius / 1000;
const MOON_RADIUS_KM = getBodyRadii('moon').equatorialRadius / 1000;
const EARTH = getBodyRadii('earth');

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a: readonly number[], b: readonly number[]): Vector => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
];
const length = (a: readonly number[]) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: readonly number[]): Vector => [
  a[0] / length(a),
  a[1] / length(a),
  a[2] / length(a)
];
const cross = (a: readonly number[], b: readonly number[]): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

/** A TT Julian date from a Julian day number in TT. */
function ttFromJulianDay(julianDay: number): JulianDate {
  const day = Math.floor(julianDay);
  return new JulianDate(day, (julianDay - day) * 86400, 'TT');
}

/** Monte Carlo reference: the fraction of a unit disc outside a disc of radius r at distance d. */
function sampledFraction(r: number, d: number, n = 400): number {
  let inside = 0;
  let visible = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -1 + (2 * (i + 0.5)) / n;
      const y = -1 + (2 * (j + 0.5)) / n;
      if (x * x + y * y <= 1) {
        inside++;
        if ((x - d) ** 2 + y * y > r * r) {
          visible++;
        }
      }
    }
  }
  return visible / inside;
}

describe('celestial#getDiscVisibleFraction', () => {
  test('0 in the umbra, 1 − r² in the antumbra, 1 outside the penumbra, monotonic between', () => {
    expect(getDiscVisibleFraction(1.05, 0)).toBe(0);
    expect(getDiscVisibleFraction(1.05, 0.04)).toBe(0);
    expect(getDiscVisibleFraction(0.9, 0.05)).toBeCloseTo(1 - 0.81, 12);
    expect(getDiscVisibleFraction(1.05, 2.05)).toBe(1);
    expect(getDiscVisibleFraction(0.3, 1.31)).toBe(1);
    expect(getDiscVisibleFraction(0, 0)).toBe(1);
    for (const r of [0.3, 0.97, 1.03, 3.6]) {
      let last = -1;
      for (let k = 0; k <= 400; k++) {
        const v = getDiscVisibleFraction(r, (k / 400) * (1 + r + 0.2));
        expect(v).toBeGreaterThanOrEqual(last - 1e-12);
        expect(v >= 0 && v <= 1).toBe(true);
        last = v;
      }
      const middle = getDiscVisibleFraction(r, (Math.abs(1 - r) + 1 + r) / 2);
      expect(middle).toBeGreaterThan(r >= 1 ? 0 : 1 - r * r);
      expect(middle).toBeLessThan(1);
    }
  });

  test('the lens area matches a sampled overlap', () => {
    for (const [r, d] of [
      [1.03, 0.6],
      [0.27, 0.9],
      [3.6, 3.1],
      [0.97, 1.5]
    ]) {
      expect(Math.abs(getDiscVisibleFraction(r, d) - sampledFraction(r, d))).toBeLessThan(2e-3);
    }
  });

  test('two unit discs at distance 1: the exact lens area; bad inputs throw', () => {
    // Two unit discs at distance 1: lens area 2π/3 − √3/2.
    expect(getDiscVisibleFraction(1, 1)).toBeCloseTo(
      1 - (2 * Math.PI) / 3 / Math.PI + Math.sqrt(3) / 2 / Math.PI,
      12
    );
    expect(() => getDiscVisibleFraction(-1, 0)).toThrow(RangeError);
    expect(() => getDiscVisibleFraction(1, Number.NaN)).toThrow(RangeError);
  });
});

describe('celestial#getSunVisibleFraction', () => {
  test('a point on the axis behind the Moon is in the umbra; a far point is lit', () => {
    // Earth radii; the Sun on +x at 1 au; the Moon at 56 Earth radii on the same line. The Moon's
    // umbra is about 58.6 Earth radii long, so at 61 radii the point is in the antumbra.
    const re = EARTH.equatorialRadius / 1000;
    const sun: Vector = [KM_PER_AU / re, 0, 0];
    const rs = SUN_RADIUS_KM / re;
    const moon: EclipseOccluder = {center: [56, 0, 0], radius: MOON_RADIUS_KM / re};
    expect(getSunVisibleFraction([1, 0, 0], sun, rs, moon)).toBe(0);
    expect(getSunVisibleFraction([0, 1, 0], sun, rs, moon)).toBe(1);
    const annular = getSunVisibleFraction([1, 0, 0], sun, rs, {...moon, center: [61, 0, 0]});
    expect(annular > 0 && annular < 0.1).toBe(true);
    let last = -1;
    for (let y = 0; y <= 0.8; y += 0.01) {
      const v = getSunVisibleFraction([1, y, 0], sun, rs, moon);
      expect(v).toBeGreaterThanOrEqual(last - 1e-9);
      last = v;
    }
    expect(last).toBe(1);
    // An occluder beyond the Sun hides nothing, even when its disc is centered on the Sun.
    expect(
      getSunVisibleFraction([1, 0, 0], sun, rs, {center: [2 * sun[0], 0, 0], radius: 11})
    ).toBe(1);
    // A point inside the occluder.
    expect(getSunVisibleFraction([56, 0, 0], sun, rs, moon)).toBe(0);
    expect(() => getSunVisibleFraction([1, 0, 0], sun, 0, moon)).toThrow(RangeError);
    expect(() => getSunVisibleFraction([1, 0, 0], sun, rs, {...moon, polarScale: 0.5})).toThrow(
      RangeError
    );
  });

  test("an oblate planet's shadow edge on its rings is at the grazing ray", () => {
    // Saturn, units of its equatorial radius, z along its pole. The Sun 26 degrees above the ring
    // plane (as in mid-2017) at 9.5 au, toward +x.
    const {equatorialRadius, polarRadius} = getBodyRadii('saturn');
    const polarScale = equatorialRadius / polarRadius;
    const elevation = 26 / DEGREES;
    const sunDistance = (9.5 * KM_PER_AU * 1000) / equatorialRadius;
    const sun: Vector = [sunDistance * Math.cos(elevation), 0, sunDistance * Math.sin(elevation)];
    const sunRadius = (SUN_RADIUS_KM * 1000) / equatorialRadius;
    const saturn: EclipseOccluder = {center: [0, 0, 0], radius: 1, polarScale};
    const lightAt = (r: number) => getSunVisibleFraction([-r, 0, 0], sun, sunRadius, saturn);
    let low = 1;
    let high = 6;
    for (let i = 0; i < 60; i++) {
      const middle = (low + high) / 2;
      if (lightAt(middle) >= 0.5) {
        high = middle;
      } else {
        low = middle;
      }
    }
    // A ray tangent to the unit sphere in z-scaled space.
    const s = Math.sin(elevation) * polarScale;
    const c = Math.cos(elevation);
    const expected = Math.hypot(c, s) / s;
    expect(Math.abs(high - expected)).toBeLessThan(0.003);
    expect(lightAt(1.05 * expected)).toBe(1);
    expect(lightAt(0.95 * expected)).toBe(0);
    // Beside the planet the rings are lit.
    expect(getSunVisibleFraction([0, 1.8, 0], sun, sunRadius, saturn)).toBe(1);
  });
});

describe('celestial#getRingTransmission', () => {
  const bands = [
    {innerRadius: 1.24, outerRadius: 1.53, opticalDepth: 0.1},
    {innerRadius: 1.53, outerRadius: 1.95, opticalDepth: 1.8},
    {innerRadius: 1.95, outerRadius: 2.03, opticalDepth: 0.12},
    {innerRadius: 2.03, outerRadius: 2.27, opticalDepth: 0.5}
  ];

  test('exp(−τ / |μ|) for a ray that crosses a band, 1 otherwise', () => {
    const elevation = 20 / DEGREES;
    const sun: Vector = [1e5 * Math.cos(elevation), 0, -1e5 * Math.sin(elevation)];
    let shaded = 0;
    // Points on the northern (winter) hemisphere of a unit sphere, on the subsolar meridian.
    for (let latitude = 0.5; latitude < 60; latitude += 0.5) {
      const p: Vector = [Math.cos(latitude / DEGREES), 0, Math.sin(latitude / DEGREES)];
      const d = unit(subtract(sun, p));
      const t = -p[2] / d[2];
      const r = Math.hypot(p[0] + t * d[0], p[1] + t * d[1]);
      const band = bands.find(b => r >= b.innerRadius && r < b.outerRadius);
      const transmission = getRingTransmission(p, sun, bands);
      if (band) {
        shaded++;
        expect(transmission).toBeCloseTo(Math.exp(-band.opticalDepth / Math.abs(d[2])), 12);
      } else {
        expect(transmission).toBe(1);
      }
      // The southern (summer) hemisphere sees the Sun below the plane, away from the rings.
      expect(getRingTransmission([p[0], 0, -p[2]], sun, bands)).toBe(1);
    }
    expect(shaded).toBeGreaterThan(5);
    // The Sun in the ring plane.
    expect(getRingTransmission([0, 0, 0.5], [1e5, 0, 0.5], bands)).toBe(1);
    expect(() =>
      getRingTransmission([0, 0, 1], [1, 0, 0], [{innerRadius: 2, outerRadius: 1, opticalDepth: 1}])
    ).toThrow(RangeError);
  });
});

// References. Positions: JPL Horizons (DE441), geocentric or selenocentric, ICRF axes, light-time
// corrected (VEC_CORR = 'LT'), no aberration, km, queried 2026-11-24. NASA eclipse data: F. Espenak,
// NASA GSFC, https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2024Apr08Tpath.html and
// https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html.

/** 2024-04-08 greatest eclipse: 18:17:18.3 UT with ΔT = 70.6 s (NASA), 18:18:28.9 TT. */
const SOLAR_2024 = {
  julianDayTT: 2460409.262834491,
  sun: [1.416043022131566e8, 4.490414448564388e7, 1.946447048947819e7] as Vector,
  moon: [3.401292785571814e5, 1.06784875116922e5, 4.865570693870261e4] as Vector,
  // 25°17.2'N, 104°08.3'W.
  latitude: 25 + 17.2 / 60,
  longitude: -(104 + 8.3 / 60)
};

/**
 * Where the shadow axis meets the ellipsoid, geodetic degrees. The vectors are body-fixed and
 * geocentric, km. z is scaled so that the ellipsoid is a sphere.
 */
function shadowAxisPoint(
  sun: Vector,
  moon: Vector
): {latitude: number; longitude: number; point: Vector} {
  const a = EARTH.equatorialRadius / 1000;
  const k = EARTH.polarRadius / EARTH.equatorialRadius;
  const scaled = (v: Vector): Vector => [v[0] / a, v[1] / a, v[2] / (a * k)];
  const o = scaled(moon);
  const direction = unit(subtract(o, scaled(sun)));
  const b = dot(o, direction);
  const t = -b - Math.sqrt(b * b - (dot(o, o) - 1));
  const p: Vector = [
    (o[0] + t * direction[0]) * a,
    (o[1] + t * direction[1]) * a,
    (o[2] + t * direction[2]) * a * k
  ];
  const e2 = 1 - k * k;
  return {
    latitude: Math.atan(p[2] / (Math.hypot(p[0], p[1]) * (1 - e2))) * DEGREES,
    longitude: Math.atan2(p[1], p[0]) * DEGREES,
    point: p
  };
}

/** A point on the IAU ellipsoid at geodetic latitude and longitude, km. */
function surfacePoint(latitude: number, longitude: number): Vector {
  const a = EARTH.equatorialRadius / 1000;
  const e2 = 1 - (EARTH.polarRadius / EARTH.equatorialRadius) ** 2;
  const [phi, lambda] = [latitude / DEGREES, longitude / DEGREES];
  const n = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  return [
    n * Math.cos(phi) * Math.cos(lambda),
    n * Math.cos(phi) * Math.sin(lambda),
    n * (1 - e2) * Math.sin(phi)
  ];
}

describe('celestial eclipses against NASA and DE441', () => {
  test('total solar eclipse of 2024-04-08: greatest eclipse point and the shadow on the ground', () => {
    const frame = getBodyFixedFrame('earth', ttFromJulianDay(SOLAR_2024.julianDayTT));
    const sun = frame.transformPosition(SOLAR_2024.sun) as Vector;
    const moon = frame.transformPosition(SOLAR_2024.moon) as Vector;
    const axis = shadowAxisPoint(sun, moon);
    const latitudeError = axis.latitude - SOLAR_2024.latitude;
    const longitudeError = axis.longitude - SOLAR_2024.longitude;
    // The IAU Earth model is linear in TT: it has no nutation and no UT1. NASA used ΔT = 70.6 s.
    // Measured: 0.003 degrees in latitude and 0.075 degrees (7.6 km) in longitude.
    expect(Math.abs(latitudeError)).toBeLessThan(0.03);
    expect(Math.abs(longitudeError)).toBeLessThan(0.1);
    const moonOccluder: EclipseOccluder = {center: moon, radius: MOON_RADIUS_KM};
    const at = (latitude: number, longitude: number) =>
      getSunVisibleFraction(surfacePoint(latitude, longitude), sun, SUN_RADIUS_KM, moonOccluder);
    // Total on the axis and at the NASA point; partial 10 degrees north; lit 45 degrees south.
    expect(at(axis.latitude, axis.longitude)).toBe(0);
    expect(at(SOLAR_2024.latitude, SOLAR_2024.longitude)).toBe(0);
    const partial = at(axis.latitude + 10, axis.longitude);
    expect(partial > 0 && partial < 1).toBe(true);
    expect(at(axis.latitude - 45, axis.longitude)).toBe(1);
    // The path is 198 km wide at greatest eclipse (NASA): total 60 km off the axis across the
    // path, partial 160 km off it.
    const along = unit(cross(axis.point, unit(subtract(moon, sun))));
    const offset = (km: number) => {
      const p = axis.point.map((value, i) => value + km * along[i]) as Vector;
      return getSunVisibleFraction(p, sun, SUN_RADIUS_KM, moonOccluder);
    };
    expect(offset(60)).toBe(0);
    expect(offset(-60)).toBe(0);
    expect(offset(160)).toBeGreaterThan(0);
    expect(offset(-160)).toBeGreaterThan(0);
  });

  test('total lunar eclipse of 2025-03-14: umbral contacts within 2 minutes of NASA', () => {
    // NASA: greatest eclipse 06:59:56 TD; partial phase 218.3 min and total phase 65.4 min, so U1
    // at 05:10:47 TD and U2 at 06:27:17 TD; penumbral phase 362.6 min, P1 at 03:58:38 TD. NASA
    // enlarges the shadow by Danjon's method: the Earth radius times 1.01. With DE441 vectors every
    // 10 s, these functions put U1 and U2 within 10 s of the NASA times.
    // Selenocentric vectors of the Sun and the Earth, km, at the given TT minutes from U1 or U2.
    const instants = {
      beforeP1: {
        sun: [1.4815660711324e8, -1.55683420774987e7, -6.753050417160896e6],
        earth: [3.973597886523008e5, -4.952376255437545e4, -2.498033305346221e4]
      },
      beforeU1: {
        sun: [1.481747045059059e8, -1.54416422278283e7, -6.697689951987525e6],
        earth: [3.980672875298262e5, -4.568129023669846e4, -2.28711665268112e4]
      },
      afterU1: {
        sun: [1.48175662996034e8, -1.543489787256842e7, -6.694743051435796e6],
        earth: [3.981035481209755e5, -4.547660223401524e4, -2.275881907538511e4]
      },
      beforeU2: {
        sun: [1.481929400513422e8, -1.53127318627592e7, -6.641363287751675e6],
        earth: [3.987358579648435e5, -4.176646374929324e4, -2.07225614567101e4]
      },
      afterU2: {
        sun: [1.481938893101816e8, -1.530598653287396e7, -6.638415945360455e6],
        earth: [3.98769417273432e5, -4.156147940301709e4, -2.061006596717332e4]
      },
      greatest: {
        sun: [1.482011587887095e8, -1.525421447271872e7, -6.615794345619457e6],
        earth: [3.990222775230706e5, -3.998773914037272e4, -1.974642210906837e4]
      }
    };
    const earthRadius = (1.01 * EARTH.equatorialRadius) / 1000;
    /** Lowest and highest visible fraction on the Moon's limb as the Sun sees it. */
    const limb = ({sun, earth}: {sun: number[]; earth: number[]}) => {
      const s = unit(sun);
      const a = unit(cross(s, [0, 0, 1]));
      const b = cross(s, a);
      let minimum = 1;
      let maximum = 0;
      for (let k = 0; k < 1440; k++) {
        const angle = (2 * Math.PI * k) / 1440;
        const p = [0, 1, 2].map(
          i => MOON_RADIUS_KM * (a[i] * Math.cos(angle) + b[i] * Math.sin(angle))
        ) as Vector;
        const v = getSunVisibleFraction(p, sun, SUN_RADIUS_KM, {
          center: earth,
          radius: earthRadius
        });
        minimum = Math.min(minimum, v);
        maximum = Math.max(maximum, v);
      }
      return {minimum, maximum};
    };
    expect(limb(instants.beforeP1).minimum).toBe(1);
    expect(limb(instants.beforeU1).minimum).toBeGreaterThan(0);
    expect(limb(instants.beforeU1).minimum).toBeLessThan(0.05);
    expect(limb(instants.afterU1).minimum).toBe(0);
    expect(limb(instants.afterU1).maximum).toBeGreaterThan(0);
    expect(limb(instants.beforeU2).maximum).toBeGreaterThan(0);
    expect(limb(instants.afterU2).maximum).toBe(0);
    expect(limb(instants.greatest).maximum).toBe(0);
  });

  test('accuracy of getApproximatePlanetPosition for eclipse geometry', () => {
    // Heliocentric Earth-Moon barycenter, ICRF, km, geometric (JPL Horizons, DE441).
    const references = [
      {
        julianDayTT: 2460409.262834491,
        position: [-1.416001741593932e8, -4.490284238186617e7, -1.946387723124192e7]
      },
      {
        julianDayTT: 2460748.7916203705,
        position: [-1.478069961506909e8, 1.521467869729987e7, 6.596273272013427e6]
      }
    ];
    for (const {julianDayTT, position} of references) {
      const approximate = getApproximatePlanetPosition(
        'earth-moon-barycenter',
        ttFromJulianDay(julianDayTT)
      ).map(value => value * KM_PER_AU);
      const angle =
        Math.atan2(length(cross(approximate, position)), dot(approximate, position)) *
        DEGREES *
        3600;
      // Measured: 7.4 and 14.9 arcseconds, 1594 km and 3301 km. JPL states 20 arcseconds and
      // 6000 km (Table 1, nominal).
      expect(angle).toBeLessThan(25);
      // At the distance of the Moon, 20 arcseconds moves a shadow by about 37 km, or about 40 s
      // of eclipse time. The module has no lunar ephemeris, so eclipse times need another source.
      expect(Math.abs(length(approximate) - length(position))).toBeLessThan(10000);
    }
  });
});

test('a ring beyond the light source transmits all light', () => {
  const bands = [{innerRadius: 0.5, outerRadius: 1.5, opticalDepth: 1}];
  expect(getRingTransmission([1, 0, 2], [1, 0, 1], bands)).toBe(1);
  expect(getRingTransmission([1, 0, 2], [1, 0, -1], bands)).toBeCloseTo(Math.exp(-1));
});
