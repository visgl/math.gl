// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fixtures} from './fixtures.mjs';
import {preparePatch} from './prepare.mjs';
const cases = fixtures(), select = document.querySelector('select'), input = document.querySelector('input');
const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d'), status = document.querySelector('output');
const texture = document.createElement('canvas'); texture.width = texture.height = 256;
const tex = texture.getContext('2d');
for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
  tex.fillStyle = (x + y) % 2 ? '#197f98' : '#ffd18b'; tex.fillRect(x * 16, y * 16, 16, 16);
}
for (const f of cases) select.add(new Option(f.label, f.id));
function draw() {
  try {
    const fixture = cases.find(f => f.id === select.value);
    const meshes = fixture.patches.map(p => preparePatch(p, {...fixture, pixelTolerance: Number(input.value)}));
    const points = meshes.flatMap(m => Array.from({length: m.positions.length / 2}, (_, i) => Array.from(m.positions.slice(i * 2, i * 2 + 2))));
    let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity;
    for (const [x, y] of points) {left = Math.min(left, x); right = Math.max(right, x); bottom = Math.min(bottom, y); top = Math.max(top, y);}
    const scale = Math.min((canvas.width - 40) / (right - left), (canvas.height - 40) / (top - bottom));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const mesh of meshes) for (let i = 0; i < mesh.indices.length; i += 3) {
      const ids = Array.from(mesh.indices.slice(i, i + 3));
      const p = ids.map(j => [20 + (mesh.positions[j * 2] - left) * scale, canvas.height - 20 - (mesh.positions[j * 2 + 1] - bottom) * scale]);
      const uv = ids.map(j => [mesh.attributes[j * 5 + 2] * 256, mesh.attributes[j * 5 + 3] * 256]);
      const u1 = uv[1][0] - uv[0][0], v1 = uv[1][1] - uv[0][1], u2 = uv[2][0] - uv[0][0], v2 = uv[2][1] - uv[0][1];
      const det = u1 * v2 - u2 * v1; if (Math.abs(det) < 1e-14) continue;
      const x1 = p[1][0] - p[0][0], y1 = p[1][1] - p[0][1], x2 = p[2][0] - p[0][0], y2 = p[2][1] - p[0][1];
      const a = (x1 * v2 - x2 * v1) / det, c = (x2 * u1 - x1 * u2) / det;
      const b = (y1 * v2 - y2 * v1) / det, d = (y2 * u1 - y1 * u2) / det;
      ctx.save(); ctx.beginPath(); ctx.moveTo(...p[0]); ctx.lineTo(...p[1]); ctx.lineTo(...p[2]); ctx.closePath(); ctx.clip();
      ctx.setTransform(a, b, c, d, p[0][0] - a * uv[0][0] - c * uv[0][1], p[0][1] - b * uv[0][0] - d * uv[0][1]);
      ctx.drawImage(texture, 0, 0); ctx.restore();
    }
    status.textContent = `${fixture.patches.length} source patches; ${meshes.reduce((n, m) => n + m.indices.length / 3, 0)} clipped triangles. Sampling policy: ${input.value} pixels at ${fixture.pixelsPerUnit} pixels per target unit (display is fit separately).`;
    globalThis.exampleReady = fixture.id;
  } catch (error) {status.textContent = error.message; globalThis.exampleError = error.message;}
}
select.addEventListener('change', draw); input.addEventListener('change', draw); draw();
