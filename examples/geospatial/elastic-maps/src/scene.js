// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createProjectedMapScene} from '../../../common/projected-map-scene.js';
import {coastlines, graticule, samplePolygon, ocean} from './map.js';

/** Prepare correspondence outside the animation loop; the renderer owns the clock. */
export function createScene(canvas) {
  const renderer = createProjectedMapScene(canvas);
  let pendingResolve,
    data,
    destination,
    generation = 0,
    raf = 0,
    moving = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const settle = () => {
    cancelAnimationFrame(raf);
    pendingResolve?.();
    pendingResolve = null;
    if (destination) data = destination;
    destination = null;
    moving = false;
    if (data) renderer.setData(data);
  };
  return {
    async setData(target, {strategy = 'auto', animate = true, onTransitionStart} = {}) {
      const token = ++generation;
      settle();
      if (!data || !animate || reduced.matches) {
        data = target;
        renderer.setData(data);
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
      onTransitionStart?.();
      const start = performance.now();
      await new Promise(resolve => {
        const tick = now => {
          if (token !== generation) {
            resolve();
            return;
          }
          const t = reduced.matches ? 1 : Math.min(1, (now - start) / 1400),
            amount = t * t * (3 - 2 * t);
          renderer.setTransition({target, geometry, amount});
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
      renderer.setGrid(value);
    },
    pick(event) {
      return moving ? null : renderer.pick(event);
    },
    dispose() {
      generation++;
      cancelAnimationFrame(raf);
      pendingResolve?.();
      renderer.dispose();
    }
  };
}
