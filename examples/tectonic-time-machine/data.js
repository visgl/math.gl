// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original GPML reader and runtime-only data adapter. Remote scientific data is not bundled or relicensed as MIT.
import {unitVector, regionFor} from './math.js';
export const MODEL = 'MULLER2022';
export const SERVICE = 'https://gws.gplates.org';
export const COASTLINES_URL =
  'https://raw.githubusercontent.com/GPlates/gplates-web-service/2b2bb1e25737668d4d3ec3d5d1c327279f30279e/django/GWS/data/deprecated/MODELS/MULLER2022/shapes_coastlines_Merdith_et_al_v2.gpmlz';
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
export function validateRotations(raw, pids) {
  const table = {};
  for (let time = 0; time <= 500; time += 10) {
    const row = raw[`${time}.0`] || raw[String(time)];
    if (!row) throw new Error(`Missing rotations at ${time} Ma`);
    table[String(time)] = {};
    for (const pid of pids) {
      const q = row[String(pid)];
      if (
        !Array.isArray(q) ||
        q.length !== 4 ||
        !q.every(Number.isFinite) ||
        Math.abs(Math.hypot(...q) - 1) > 1e-5
      )
        throw new Error(`Invalid rotation for plate ${pid}`);
      const length = Math.hypot(...q);
      table[String(time)][pid] = q.map(n => n / length);
    }
  }
  return table;
}
async function response(url, signal) {
  const r = await fetch(url, {signal: AbortSignal.any([signal, AbortSignal.timeout(45000)])});
  if (!r.ok) throw new Error(`Data service returned HTTP ${r.status}`);
  return r;
}
export async function loadModel({signal, onStatus}) {
  onStatus('Loading coastline templates…');
  const r = await response(COASTLINES_URL, signal);
  if (typeof DecompressionStream === 'undefined')
    throw new Error('This browser needs gzip DecompressionStream support');
  const xml = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const features = parseCoastlines(xml),
    pids = [...new Set(features.map(f => f.pid))];
  const rotations = {};
  // Limit URL length and service work per request; requests remain sequential and cancellable.
  for (let start = 0; start < pids.length; start += 40) {
    onStatus(`Loading published rotations… ${Math.round((start / pids.length) * 100)}%`);
    const ids = pids.slice(start, start + 40),
      url = new URL('/rotation/get_quaternions', SERVICE);
    url.searchParams.set('model', MODEL);
    url.searchParams.set('pids', ids.join(','));
    url.searchParams.set('times', Array.from({length: 51}, (_, i) => i * 10).join(','));
    const raw = await (await response(url, signal)).json();
    const batch = validateRotations(raw, ids);
    for (const [time, row] of Object.entries(batch)) rotations[time] = {...rotations[time], ...row};
  }
  return {features, rotations, pids};
}
