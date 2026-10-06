// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original GPML reader and runtime-only data adapter. Remote scientific data is not bundled or relicensed as MIT.
import {unitVector, regionFor} from './math.js';
import {sourceFor, rotationBracket, rotationWindow, nextRotationTime, rotationPlaybackBuffer} from './sources.js';
import {modelXML} from './archive.js';
import {parseRotationBatches, responseChunks} from './rotation-stream.js';
export const SERVICE = 'https://gws.gplates.org';
const GML = 'http://www.opengis.net/gml',
  GPML = 'http://www.gplates.org/gplates';
const first = (node, ns, name) => node.getElementsByTagNameNS(ns, name)[0];
const text = (node, ns, name) => first(node, ns, name)?.textContent?.trim();
function timeValue(value, fallback) {
  if (value === 'http://gplates.org/times/distantPast') return Infinity;
  if (value === 'http://gplates.org/times/distantFuture') return -Infinity;
  return value && Number.isFinite(Number(value)) ? Number(value) : fallback;
}
/** Coastline rings are templates, not evolving ancient shorelines. GPML uses latitude,longitude order. */
export function parseCoastlines(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid coastline XML');
  const features = [];
  for (const member of doc.getElementsByTagNameNS(GML, 'featureMember')) {
    const idNode = first(member, GPML, 'reconstructionPlateId');
    const pid = Number(idNode && text(idNode, GPML, 'value'));
    if (!idNode || !Number.isSafeInteger(pid)) continue;
    const period = first(member, GML, 'TimePeriod');
    const begin = period && first(period, GML, 'begin'),
      end = period && first(period, GML, 'end');
    const beginAge = timeValue(begin && text(begin, GML, 'timePosition'), Infinity);
    const endAge = timeValue(end && text(end, GML, 'timePosition'), 0);
    const importTime = first(member, GPML, 'geometryImportTime');
    if (importTime && Number(text(importTime, GML, 'timePosition')) !== 0)
      throw new Error('Only present-day coastline templates are supported');
    const id = text(member, GPML, 'identity');
    const name = text(member, GML, 'name') || `Plate ${pid}`;
    for (const polygon of member.getElementsByTagNameNS(GML, 'Polygon')) {
      const rings = [];
      let outer = true,
        invalidOuter = false;
      for (const positions of polygon.getElementsByTagNameNS(GML, 'posList')) {
        const numbers = positions.textContent.trim().split(/\s+/).map(Number);
        if (numbers.length % 2 || !numbers.every(Number.isFinite))
          throw new Error('Invalid coastline coordinates');
        const ring = [];
        let lastLon = Infinity,
          lastLat = Infinity;
        for (let i = 0; i < numbers.length; i += 2) {
          const lat = numbers[i],
            lon = numbers[i + 1];
          if (Math.abs(lat) > 90 || Math.abs(lon) > 180)
            throw new Error('Coastline coordinate outside geographic bounds');
          // Coarse render detail; rotations remain rigid. Always preserve the closure vertex.
          if (
            i === 0 ||
            i === numbers.length - 2 ||
            Math.hypot((lon - lastLon) * Math.cos((lat * Math.PI) / 180), lat - lastLat) > 0.35
          ) {
            ring.push(lon, lat);
            lastLon = lon;
            lastLat = lat;
          }
        }
        if (ring.length < 8) {
          if (outer) invalidOuter = true;
          outer = false;
          continue;
        }
        outer = false;
        if (ring[0] !== ring[ring.length - 2] || ring[1] !== ring[ring.length - 1])
          ring.push(ring[0], ring[1]);
        rings.push(ring);
      }
      if (invalidOuter || !rings.length) continue;
      const total = rings.reduce((n, r) => n + r.length / 2, 0),
        xyz = new Float64Array(total * 3),
        positions = new Float64Array(total * 2),
        holes = [];
      let index = 0;
      for (let r = 0; r < rings.length; r++) {
        if (r) holes.push(index * 2);
        for (let i = 0; i < rings[r].length; i += 2) {
          unitVector(rings[r][i], rings[r][i + 1], xyz.subarray(index * 3, index * 3 + 3));
          index++;
        }
      }
      features.push({id, pid, name, beginAge, endAge, xyz, positions, holes});
    }
  }
  if (!features.length) throw new Error('No usable coastline polygons');
  // Group each plate once: all fragments on that plate share the same illustrative future rotation.
  const centers = new Map();
  for (const f of features) {
    let c = centers.get(f.pid);
    if (!c) {
      c = [0, 0, 0];
      centers.set(f.pid, c);
    }
    for (let i = 0; i < f.xyz.length; i += 3) {
      c[0] += f.xyz[i];
      c[1] += f.xyz[i + 1];
      c[2] += f.xyz[i + 2];
    }
  }
  for (const f of features) {
    const c = centers.get(f.pid);
    f.region = regionFor(
      (Math.atan2(c[1], c[0]) * 180) / Math.PI,
      (Math.atan2(c[2], Math.hypot(c[0], c[1])) * 180) / Math.PI
    );
  }
  return features;
}
async function response(url, signal) {
  const r = await fetch(url, {signal: AbortSignal.any([signal, AbortSignal.timeout(45000)])});
  if (!r.ok) throw new Error(`Data service returned HTTP ${r.status}`);
  return r;
}
/** Publish complete, validated time samples while streamed Arrow batches arrive. */
export function createRotationCache(pids, source, fetchBatches = async function* (url, signal) {
  const r = await response(url, signal);
  yield* parseRotationBatches(responseChunks(r.body, signal));
}) {
  const rotations = {}, loaded = new Set(), listeners = new Set();
  const indices = new Map(pids.map((pid, index) => [pid, index]));
  let tail = Promise.resolve(), background = null, history = null, retryAfter = 0, prefetchTarget = null, foreground = null;
  function enqueue(operation) {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  }
  function hasTime(time) {
    const [low, high] = rotationBracket(time, source.maxAge);
    return loaded.has(low) && loaded.has(high);
  }
  async function loadTimes(requested, {signal, onStatus = () => {}}) {
    signal.throwIfAborted();
    const times = requested.filter(t => !loaded.has(t));
    if (!times.length) return;
    const pending = new Map(times.map(age => [age, {
      values: new Float64Array(pids.length * 4), seen: new Uint8Array(pids.length), count: 0
    }]));
    // Keep URLs and server work bounded. A full window contains up to 5,376
    // records per request, yielding 4,096-row Arrow batches plus a final batch.
    for (let start = 0; start < pids.length; start += 256) {
      signal.throwIfAborted();
      onStatus(`Loading ${source.citation} rotations · ${times[0]}–${times.at(-1)} Ma`);
      const ids = pids.slice(start, start + 256), allowed = new Set(ids);
      const url = new URL('/rotation/get_quaternions', SERVICE);
      url.searchParams.set('model', source.id);
      url.searchParams.set('pids', ids.join(','));
      url.searchParams.set('times', times.join(','));
      for await (const batch of fetchBatches(url, signal)) {
        signal.throwIfAborted();
        const columns = ['age', 'plateId', 'w', 'x', 'y', 'z'].map(name => batch.data.getChild(name));
        for (let i = 0; i < batch.data.numRows; i++) {
          const age = columns[0].get(i), pid = columns[1].get(i);
          const sample = pending.get(age), index = indices.get(pid);
          if (!sample || !allowed.has(pid) || sample.seen[index])
            throw new Error('Unexpected or duplicate rotation sample');
          const w = columns[2].get(i), x = columns[3].get(i), y = columns[4].get(i), z = columns[5].get(i);
          const length = Math.hypot(w, x, y, z);
          if (!Number.isFinite(w) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || Math.abs(length - 1) > 1e-5)
            throw new Error(`Invalid rotation for plate ${pid}`);
          const offset = index * 4;
          sample.values[offset] = w / length;
          sample.values[offset + 1] = x / length;
          sample.values[offset + 2] = y / length;
          sample.values[offset + 3] = z / length;
          sample.seen[index] = 1;
          sample.count++;
          if (sample.count === pids.length && !loaded.has(age)) {
            rotations[age] = {values: sample.values, indices};
            loaded.add(age);
            for (const notify of listeners) notify();
          }
        }
        // Parsing a large response should not monopolize the render loop.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      for (const age of times) {
        const sample = pending.get(age);
        for (const pid of ids) {
          if (!sample.seen[indices.get(pid)]) throw new Error(`Missing rotations at ${age} Ma`);
        }
      }
    }
  }
  function ensureTime(time, options) {
    return enqueue(() => loadTimes(rotationWindow(time, source.maxAge), options));
  }
  function loadForeground(times, options) {
    options.signal.throwIfAborted();
    if (times.every(age => loaded.has(age))) return Promise.resolve();
    const key = times.join(',');
    if (foreground?.key === key && !foreground.signal.aborted) return foreground.promise;
    // One small foreground request runs independently of the background queue.
    // Rapid, distant seeks replace obsolete foreground work instead of piling up.
    foreground?.abort.abort(new DOMException('Superseded seek', 'AbortError'));
    const abort = new AbortController();
    const job = {key, abort, signal: AbortSignal.any([options.signal, abort.signal]), promise: null};
    foreground = job;
    job.promise = loadTimes(times, {...options, signal: job.signal}).finally(() => {
      if (foreground === job) foreground = null;
    });
    return job.promise;
  }
  return {
    rotations, hasTime, ensureTime,
    get loadedSamples() {return loaded.size;},
    totalSamples: source.maxAge / 10 + 1,
    waitForTime(time, {signal, lifetimeSignal = signal, onStatus}) {
      if (hasTime(time)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        function cleanup() {listeners.delete(check); signal.removeEventListener('abort', cancel);}
        function check() {if (hasTime(time)) {cleanup(); resolve();}}
        function cancel() {cleanup(); reject(signal.reason);}
        if (signal.aborted) {cancel(); return;}
        listeners.add(check);
        signal.addEventListener('abort', cancel, {once: true});
        // Cancelling a waiter alone preserves its download; a new distant seek
        // may replace it. Resolve as soon as the requested pose exists.
        loadForeground([...new Set(rotationBracket(time, source.maxAge))], {signal: lifetimeSignal, onStatus}).then(check, error => {
          cleanup(); reject(error);
        });
      });
    },
    ensurePose(time, options) {
      return loadForeground([...new Set(rotationBracket(time, source.maxAge))], options);
    },
    ensurePlayback(time, options) {
      return loadForeground(rotationPlaybackBuffer(time, source.maxAge), options);
    },
    ensureHistory(time, options) {
      if (history) return history;
      // Request all history without waiting for playback to advance. Foreground
      // pose requests use their own lane, even while this queue is busy.
      const current = rotationWindow(time, source.maxAge), windows = [current];
      for (let end = current[0]; end > 0; end -= 200)
        windows.push(rotationWindow(-end, source.maxAge));
      for (let end = current.at(-1) + 200; end <= source.maxAge; end += 200)
        windows.push(rotationWindow(-end, source.maxAge));
      history = (async () => {
        for (const times of windows) await enqueue(() => loadTimes(times, options));
      })().finally(() => {history = null;});
      return history;
    },
    prefetchTime(time, options) {
      prefetchTarget = time;
      if (background || Date.now() < retryAfter) return background;
      background = (async () => {
        do {
          const target = prefetchTarget;
          prefetchTarget = null;
          await ensureTime(target, options);
          const next = nextRotationTime(target, source.maxAge);
          if (next !== null) await ensureTime(next, options);
          // If playback crossed a window while we were downloading, prefetch
          // its next window too instead of waiting for another boundary miss.
        } while (prefetchTarget !== null);
      })().catch(() => {
        // A speculative failure leaves the valid pose playable. A foreground
        // miss retries and reports failures through the existing error UI.
        retryAfter = Date.now() + 30000;
      }).finally(() => {background = null;});
      return background;
    }
  };
}
export async function loadModel({sourceId, time, signal, onStatus, preloadHistory = false}) {
  const source = sourceFor(sourceId);
  onStatus(`Loading ${source.citation} ${source.geometry}…`);
  const r = await response(source.url, signal);
  const xml = await modelXML(await r.arrayBuffer(), source);
  signal.throwIfAborted();
  const features = parseCoastlines(xml),
    pids = [...new Set(features.map(f => f.pid))];
  const cache = createRotationCache(pids, source);
  await cache.ensurePlayback(time, {signal, onStatus});
  return Object.assign(cache, {features, pids, source, signal, preloadHistory});
}
