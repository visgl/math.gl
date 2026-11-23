// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {OrbitView} from '@deck.gl/core';
import {
  getAbsoluteSalinity,
  getConservativeTemperature,
  getSeaPressureFromHeight,
  getSeawaterSoundSpeed,
  getSoundAbsorptionFrancoisGarrison
} from '@math.gl/earth/ocean';
import {
  FRANCOIS_GARRISON_DOMAIN,
  computeSoundProfile,
  isInAbsorptionDomain,
  pickSeaLevelPoint,
  sampleHeight
} from '../../../../../examples/geospatial/bathymetry/src/sound-profile.js';
import {gzipSync} from 'node:zlib';
import {
  STANDARD_DEPTHS,
  WOA23_MANIFEST_URL,
  WOA23_PREVIEW_URL,
  createPreviewProfileSource,
  loadWoa23ProfileSource,
  syntheticProfileSource
} from '../../../../../examples/geospatial/bathymetry/src/profile-sources.js';
import {createSoundProfileMarkup} from '../../../../../examples/geospatial/bathymetry/src/profile-panel.js';
import {getMorphViewState} from '../../../../../examples/geospatial/bathymetry/src/camera.js';

const tropical = syntheticProfileSource.getProfile(-30, 10);

test('a low-latitude profile has a deep sound channel and stops at the seafloor', () => {
  const result = computeSoundProfile(tropical, {
    latitude: 10,
    seafloorDepth: 4321,
    frequency: 12000
  });
  assert.equal(result.levels.at(-1).depth, 4321);
  assert.equal(result.truncated, false);
  assert.ok(result.levels.every(level => level.depth <= 4321));
  assert.ok(result.minimum.depth >= 500 && result.minimum.depth <= 2000, `${result.minimum.depth}`);
  assert.ok(result.levels[0].soundSpeed > result.minimum.soundSpeed + 20);
  assert.ok(result.levels.at(-1).soundSpeed > result.minimum.soundSpeed);
  // The 1000 m level follows the documented TEOS-10 chain.
  const level = result.levels.find(entry => entry.depth === 1000);
  const index = STANDARD_DEPTHS.indexOf(1000);
  const seaPressure = getSeaPressureFromHeight(-1000, 10);
  const absoluteSalinity = getAbsoluteSalinity(tropical.practicalSalinity[index]);
  const conservativeTemperature = getConservativeTemperature(
    absoluteSalinity,
    tropical.temperature[index],
    seaPressure
  );
  assert.equal(level.seaPressure, seaPressure);
  assert.equal(
    level.soundSpeed,
    getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure)
  );
});

test('a polar profile has its minimum at the surface', () => {
  const polar = syntheticProfileSource.getProfile(0, 80);
  const result = computeSoundProfile(polar, {latitude: 80, seafloorDepth: 3000, frequency: 12000});
  assert.equal(result.minimum.depth, 0);
});

test('absorption and vertical loss grow with frequency', () => {
  const losses = [12000, 100000, 400000].map(
    frequency =>
      computeSoundProfile(tropical, {latitude: 10, seafloorDepth: 4000, frequency}).verticalLoss
  );
  assert.ok(losses[0] > 0 && losses[0] < losses[1] && losses[1] < losses[2], `${losses}`);
});

test('a seafloor below the profile data is reported as truncated', () => {
  const result = computeSoundProfile(tropical, {
    latitude: 10,
    seafloorDepth: 8000,
    frequency: 12000
  });
  assert.equal(result.levels.at(-1).depth, 5500);
  assert.equal(result.truncated, true);
});

test('ETOPO samples are bilinear in the south-to-north grid', () => {
  const width = 721,
    height = 361;
  const heights = Float64Array.from({length: width * height}, (_, i) => {
    const x = i % width,
      y = Math.floor(i / width);
    return 3 * x - 7 * y;
  });
  // Longitude 10.25° is column 380.5, latitude -45.1° is row 89.8.
  assert.ok(Math.abs(sampleHeight(heights, 10.25, -45.1) - (3 * 380.5 - 7 * 89.8)) < 1e-9);
  assert.equal(sampleHeight(heights, -180, 90), -7 * 360);
  // Longitude 180° wraps to the -180° seam column, which repeats it in ETOPO1.
  assert.equal(sampleHeight(heights, 180, 0), sampleHeight(heights, -180, 0));
});

test('the view ray meets sea level at the focus of the globe and of the flat map', () => {
  const view = new OrbitView({orbitAxis: 'Z', orthographic: true, fovy: 2});
  const base = {target: [0, 0, 0], rotationOrbit: 0, rotationX: 0, zoom: 0};
  for (const [focus, morph, projection] of [
    [{longitude: -30, latitude: 12}, 0, 'equirectangular'],
    [{longitude: 140, latitude: -35}, 0, 'equirectangular'],
    [{longitude: -30, latitude: 12}, 1, 'equirectangular'],
    [{longitude: 60, latitude: 50}, 1, 'mercator']
  ]) {
    const viewState = getMorphViewState(focus, morph, projection, base);
    const viewport = view.makeViewport({width: 1200, height: 800, viewState});
    const point = pickSeaLevelPoint(viewport, 600, 400, morph, projection);
    assert.ok(Math.abs(point.longitude - focus.longitude) < 1e-6, JSON.stringify(point));
    assert.ok(Math.abs(point.latitude - focus.latitude) < 1e-6, JSON.stringify(point));
  }
  const viewport = view.makeViewport({width: 1200, height: 800, viewState: base});
  assert.equal(pickSeaLevelPoint(viewport, 600, 400, 0.5, 'equirectangular'), null);
  // The Mercator mesh ends at ±85.051129°: the background above it selects nothing.
  const north = view.makeViewport({
    width: 1200,
    height: 800,
    viewState: getMorphViewState({longitude: 0, latitude: 84}, 1, 'mercator', base)
  });
  assert.ok(Math.abs(pickSeaLevelPoint(north, 600, 400, 1, 'mercator').latitude - 84) < 1e-6);
  assert.equal(pickSeaLevelPoint(north, 600, 5, 1, 'mercator'), null, 'Above the Mercator map');
  const south = pickSeaLevelPoint(north, 600, 600, 1, 'mercator');
  assert.ok(
    south.latitude < 84 && south.latitude > -85.051129,
    'Below the focus, still on the map'
  );
  const equirectangular = view.makeViewport({
    width: 1200,
    height: 800,
    viewState: getMorphViewState({longitude: 0, latitude: 84}, 1, 'equirectangular', base)
  });
  assert.equal(pickSeaLevelPoint(equirectangular, 600, 5, 1, 'equirectangular'), null);
  assert.equal(
    pickSeaLevelPoint(viewport, 5, 5, 0, 'equirectangular'),
    null,
    'Ray misses the globe'
  );
});

test('the WOA23 preview source reads the nearest cell and stops at the fill value', () => {
  const manifest = {
    latitudes: [-1, 1],
    longitudes: [-179, 179],
    depths: [0, 10, 20],
    temperature: {scale: 0.001, fill: -32768},
    salinity: {scale: 0.001, fill: 65535}
  };
  const cells = 2 * 2 * 3;
  const buffer = new ArrayBuffer(cells * 4);
  const temperature = new Int16Array(buffer, 0, cells);
  const salinity = new Uint16Array(buffer, cells * 2, cells).fill(65535);
  temperature.fill(-32768);
  temperature.set([25000, 24000, -32768], 3 * 3);
  salinity.set([35100, 35200, 65535], 3 * 3);
  const source = createPreviewProfileSource(manifest, buffer);
  assert.deepEqual(source.getProfile(170, 0.9), {
    depths: [0, 10],
    temperature: [25, 24],
    practicalSalinity: [35.1, 35.2]
  });
  assert.equal(source.getProfile(-170, -0.9), null, 'All-fill cell is land');
  assert.throws(() => createPreviewProfileSource(manifest, new ArrayBuffer(8)), /size/);
});

test('the panel marks the sound-channel axis and names the frequency', () => {
  const result = computeSoundProfile(tropical, {
    latitude: 10,
    seafloorDepth: 4000,
    frequency: 100000
  });
  const markup = createSoundProfileMarkup(result, {
    longitude: -30,
    latitude: 10,
    seafloorDepth: 4000,
    frequency: 100000
  });
  assert.match(markup, /data-role="minimum-marker"/);
  assert.match(markup, /deep sound channel axis/);
  assert.match(markup, /Absorption at 100 kHz/);
});

test('the WOA23 loader fetches the pinned manifest and gunzips the preview', async () => {
  const commit = /\/visgl\/deck\.gl-data\/([0-9a-f]{40})\/earth\/oceanography\/v1\/woa23\//;
  assert.match(WOA23_PREVIEW_URL, /^https:\/\/media\.githubusercontent\.com\/media\//);
  assert.match(WOA23_MANIFEST_URL, /^https:\/\/raw\.githubusercontent\.com\//);
  assert.equal(WOA23_PREVIEW_URL.match(commit)[1], WOA23_MANIFEST_URL.match(commit)[1]);
  const manifest = {
    latitudes: [0],
    longitudes: [178.5, -179.5],
    depths: [0, 10],
    temperature: {scale: 0.01, fill: -32768},
    salinity: {scale: 0.01, fill: 65535}
  };
  const bytes = Buffer.concat([
    Buffer.from(new Int16Array([1000, 900, 2500, 2400]).buffer),
    Buffer.from(new Uint16Array([3400, 3410, 3500, 3510]).buffer)
  ]);
  const requested = [];
  const original = globalThis.fetch;
  globalThis.fetch = async url => {
    requested.push(url);
    return url.endsWith('.json')
      ? new Response(JSON.stringify(manifest))
      : new Response(gzipSync(bytes));
  };
  try {
    const source = await loadWoa23ProfileSource({
      manifestUrl: 'https://example.test/woa23/preview-manifest.json',
      previewUrl: 'https://example.test/woa23/preview.bin.gz'
    });
    assert.deepEqual(requested.sort(), [
      'https://example.test/woa23/preview-manifest.json',
      'https://example.test/woa23/preview.bin.gz'
    ]);
    // 179.9° E is nearer to -179.5° across the antimeridian than to 178.5°.
    assert.deepEqual(source.getProfile(179.9, 0).temperature, [25, 24]);
    assert.deepEqual(source.getProfile(178, 0).practicalSalinity, [34, 34.1]);
    assert.match(source.name, /Locarnini et al\. 2023; Reagan et al\. 2023/);
  } finally {
    globalThis.fetch = original;
  }
});

test('the absorption domain matches getSoundAbsorptionFrancoisGarrison at each bound', () => {
  const inside = {frequency: 12000, temperature: 10, salinity: 35, depth: 100};
  for (const [name, bounds] of Object.entries(FRANCOIS_GARRISON_DOMAIN)) {
    for (const [bound, outward] of [
      [bounds[0], -1e-6],
      [bounds[1], 1e-6]
    ]) {
      const edge = {...inside, [name]: bound};
      const outside = {...inside, [name]: bound + outward};
      assert.ok(Number.isFinite(getSoundAbsorptionFrancoisGarrison(edge)), `${name} ${bound}`);
      assert.equal(isInAbsorptionDomain(edge), true, `${name} ${bound}`);
      assert.throws(() => getSoundAbsorptionFrancoisGarrison(outside), RangeError);
      assert.equal(isInAbsorptionDomain(outside), false, `${name} ${bound + outward}`);
    }
  }
});

// Red Sea-like: warm, salty surface water and a salty layer at 500 m.
const redSea = {
  depths: [0, 10, 20, 50, 100, 200, 500, 1000],
  temperature: [31, 30.4, 29.5, 27, 24, 22, 21.7, 21.5],
  practicalSalinity: [40.5, 40.2, 39.9, 39.8, 39.9, 39.95, 40.3, 39.9]
};

test('levels outside the absorption domain keep their sound speed and have no absorption', () => {
  const result = computeSoundProfile(redSea, {latitude: 20, seafloorDepth: 1000, frequency: 12000});
  assert.equal(result.levels.length, redSea.depths.length);
  assert.ok(result.levels.every(level => Number.isFinite(level.soundSpeed)));
  assert.deepEqual(
    result.levels.flatMap((level, i) => (level.absorption === null ? [i] : [])),
    [0, 1, 6]
  );
  assert.equal(result.levelsWithoutAbsorption, 3);
  // The intervals next to levels 0, 1 and 6 (0-20 m and 200-1000 m) do not count.
  const [, , a20, a50, a100, a200] = result.levels.map(level => level.absorption);
  const expected = ((a20 + a50) / 2) * 0.03 + ((a50 + a100) / 2) * 0.05 + ((a100 + a200) / 2) * 0.1;
  assert.ok(Math.abs(result.verticalLoss - expected) < 1e-12, `${result.verticalLoss}`);
  const markup = createSoundProfileMarkup(result, {
    longitude: 38,
    latitude: 20,
    seafloorDepth: 1000,
    frequency: 12000
  });
  assert.match(markup, /no value at the surface/);
  assert.match(markup, /partial/);
  assert.match(markup, /outside the Francois–Garrison range at 3 levels/);
});

test('a profile with no absorption interval has no vertical loss', () => {
  const salty = {depths: [0, 10], temperature: [31, 31], practicalSalinity: [41, 41]};
  const result = computeSoundProfile(salty, {latitude: 20, seafloorDepth: 10, frequency: 12000});
  assert.equal(result.verticalLoss, null);
  const markup = createSoundProfileMarkup(result, {
    longitude: 50,
    latitude: 26,
    seafloorDepth: 10,
    frequency: 12000
  });
  assert.match(markup, /One-way vertical loss: no value/);
  assert.match(markup, /at 2 levels/);
});
