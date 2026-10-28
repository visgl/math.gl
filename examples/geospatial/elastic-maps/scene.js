// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createScene as createStaticScene} from '../quincuncial-star/scene.js';
import {coastlines, graticule, samplePolygon, ocean} from './map.js';

/** Prepare correspondence outside the animation loop; the renderer owns the clock. */
export function createScene(canvas) {
  const still = createStaticScene(canvas),
    context = canvas.getContext('2d');
  let pendingResolve,
    data,
    destination,
    generation = 0,
    raf = 0,
    grid = true,
    moving = false,
    frame;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const drawFrame = () => {
    if (!frame) return;
    const {source, target, geometry, amount} = frame;
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const a = source.map.fit({width, height, padding: 24}),
      b = target.map.fit({width, height, padding: 24});
    const pixel = p => {
      const x = a.project(p),
        y = b.project(p);
      return [x[0] * (1 - amount) + y[0] * amount, x[1] * (1 - amount) + y[1] * amount];
    };
    const path = (rings, closed) => {
      context.beginPath();
      for (const ring of rings) {
        ring.forEach((p, i) => {
          const [x, y] = pixel(p);
          if (i) context.lineTo(x, y);
          else context.moveTo(x, y);
        });
        if (closed) context.closePath();
      }
    };
    for (const item of geometry) {
      if (item.kind === 'grid' && !grid) continue;
      for (const part of item.geometry.evaluate(amount)) {
        context.globalAlpha = part.opacity;
        path(part.coordinates, part.kind === 'polygon');
        if (item.kind === 'ocean') {
          context.fillStyle = '#e6f2f7';
          context.fill('evenodd');
        } else if (item.kind === 'polygon') {
          context.fillStyle = '#ed9b4599';
          context.fill('evenodd');
        } else {
          context.strokeStyle =
            item.kind === 'grid'
              ? '#b6cbd5'
              : item.kind === 'polygon-outline'
                ? '#b45f0b'
                : '#24485a';
          context.lineWidth = item.kind === 'grid' ? 0.6 : 1;
          context.stroke();
        }
      }
    }
    context.globalAlpha = 1;
  };
  const resize = new ResizeObserver(() => {
    if (moving) drawFrame();
  });
  resize.observe(canvas);
  const settle = () => {
    cancelAnimationFrame(raf);
    pendingResolve?.();
    pendingResolve = null;
    if (destination) data = destination;
    destination = null;
    frame = null;
    moving = false;
    if (data) still.setData(data);
  };
  return {
    async setData(target, {strategy = 'auto', animate = true} = {}) {
      const token = ++generation;
      settle();
      if (!data || !animate || reduced.matches) {
        data = target;
        still.setData(data);
        return true;
      }
      const source = data,
        transition = source.map.createTransitionTo(target.map, {strategy}),
        geometry = [];
      // Yield between source features so controls and cancellation stay responsive.
      const jobs = [
        ...ocean.map(r => ['ocean', r]),
        ...graticule.map(r => ['grid', r]),
        ...coastlines.map(r => ['coast', r]),
        ['polygon', samplePolygon],
        ...samplePolygon.map(r => ['polygon-outline', [...r, r[0]]])
      ];
      for (let i = 0; i < jobs.length; i++) {
        const [kind, input] = jobs[i];
        geometry.push({
          kind,
          geometry:
            kind === 'coast' || kind === 'grid' || kind === 'polygon-outline'
              ? transition.prepareLine(input)
              : transition.preparePolygon(input)
        });
        if (i % 8 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
          if (token !== generation) return false;
        }
      }
      if (token !== generation) return false;
      destination = target;
      moving = true;
      const start = performance.now();
      await new Promise(resolve => {
        const tick = now => {
          if (token !== generation) {
            resolve();
            return;
          }
          const t = reduced.matches ? 1 : Math.min(1, (now - start) / 1400),
            amount = t * t * (3 - 2 * t);
          frame = {source, target, geometry, amount};
          drawFrame();
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            settle();
            resolve();
          }
        };
        raf = requestAnimationFrame(tick);
        // Cancellation must resolve this request even when its RAF was removed.
        pendingResolve = resolve;
      });
      return token === generation;
    },
    setGrid(value) {
      grid = value;
      still.setGrid(value);
      if (moving) drawFrame();
    },
    pick(event) {
      return moving ? null : still.pick(event);
    },
    dispose() {
      generation++;
      cancelAnimationFrame(raf);
      pendingResolve?.();
      resize.disconnect();
      still.dispose();
    }
  };
}
