// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadImageryTile, releaseImageryTile} from '../imagery.js';

function mockImages(t, fail = false) {
  const requests = [];
  const images = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({url, signal: options.signal});
    return {ok: !fail || !url.includes('VIIRS'), status: 503, blob: async () => ({})};
  });
  const original = globalThis.createImageBitmap;
  globalThis.createImageBitmap = async () => {
    const image = {
      closed: false,
      close() {
        this.closed = true;
      }
    };
    images.push(image);
    return image;
  };
  t.after(() => {
    if (original) globalThis.createImageBitmap = original;
    else delete globalThis.createImageBitmap;
  });
  return {requests, images};
}

test('day and night are fetched as one paired tile with the correct z/y/x', async t => {
  const {requests, images} = mockImages(t);
  const signal = new AbortController().signal;
  const pair = await loadImageryTile({index: {x: 2, y: 1, z: 3}, signal});
  assert.equal(requests.length, 2);
  assert.ok(requests.every(r => r.url.includes('/3/1/2.') && r.signal === signal));
  assert.equal(pair.day, images[0]);
  assert.equal(pair.night, images[1]);
  releaseImageryTile({content: pair});
  assert.ok(images.every(image => image.closed));
});

test('a failed half-pair is never rendered and releases the other image', async t => {
  const {images} = mockImages(t, true);
  await assert.rejects(loadImageryTile({index: {x: 0, y: 0, z: 3}}), /HTTP 503/);
  assert.equal(images.length, 1);
  assert.ok(images[0].closed);
});

test('abort after decoding releases both images', async t => {
  const {images} = mockImages(t);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadImageryTile({index: {x: 0, y: 0, z: 3}, signal: controller.signal}), {
    name: 'AbortError'
  });
  assert.equal(images.length, 2);
  assert.ok(images.every(image => image.closed));
});
