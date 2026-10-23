// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Controls own events and animation timing; the scene owns map coordinates. */
export function bindControls(view, scene) {
  const {svg, readout, viewToggle, unfold, zoomControls, layers} = view;
  const abort = new AbortController();
  let frame = 0;
  let dragPoint;
  const listen = (element, event, handler, options = {}) =>
    element.addEventListener(event, handler, {...options, signal: abort.signal});
  const setAmount = value => {
    scene.setAmount(value);
    unfold.value = String(Math.round(scene.amount * 100));
    viewToggle.textContent = scene.amount > 0.5 ? 'View globe' : 'Unfold map';
  };
  function animateTo(target) {
    cancelAnimationFrame(frame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAmount(target);
      return;
    }
    const start = performance.now(),
      from = scene.amount;
    const tick = now => {
      const t = Math.min(1, (now - start) / 1100);
      setAmount(from + (target - from) * t * t * (3 - 2 * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  listen(viewToggle, 'click', () => animateTo(scene.amount > 0.5 ? 0 : 1));
  listen(unfold, 'input', () => {
    cancelAnimationFrame(frame);
    setAmount(Number(unfold.value) / 100);
  });
  for (const [name, input] of Object.entries(layers))
    listen(input, 'change', () => scene.setLayers({[name]: input.checked}));
  listen(zoomControls, 'click', event => {
    const action = event.target.closest('button')?.dataset.zoom;
    if (action === 'reset') scene.resetZoom();
    else if (action) scene.zoomBy(action === 'in' ? 1.5 : 1 / 1.5);
  });
  listen(
    svg,
    'wheel',
    event => {
      event.preventDefault();
      scene.zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2, scene.eventPoint(event));
    },
    {passive: false}
  );
  listen(svg, 'pointerdown', event => {
    if (scene.zoom === 1) return;
    dragPoint = {clientX: event.clientX, clientY: event.clientY};
    svg.setPointerCapture(event.pointerId);
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    listen(svg, event, () => {
      dragPoint = null;
    });
  listen(svg, 'pointermove', event => {
    if (dragPoint) {
      scene.pan(scene.eventPoint(dragPoint), scene.eventPoint(event));
      dragPoint = {clientX: event.clientX, clientY: event.clientY};
    }
    if (scene.amount > 0.001 && scene.amount < 0.999) {
      readout.textContent = 'Unfolding between globe and map';
      return;
    }
    const hit = scene.pick(scene.eventPoint(event));
    const state = event.target.closest?.('[data-state]')?.getAttribute('data-state');
    readout.textContent = hit
      ? `${state && state !== hit.label ? `${state} · ` : ''}${hit.label} · ${Math.abs(hit.position[1]).toFixed(2)}° ${hit.position[1] < 0 ? 'S' : 'N'}, ${Math.abs(hit.position[0]).toFixed(2)}° ${hit.position[0] < 0 ? 'W' : 'E'}`
      : 'Outside the map';
  });
  listen(svg, 'pointerleave', () => {
    readout.textContent = 'Move over the map to inspect coordinates';
  });
  return () => {
    abort.abort();
    cancelAnimationFrame(frame);
  };
}
