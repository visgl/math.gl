// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/** Canvas drawing and picking, independent of control markup. */
export function createScene(canvas) {
  const context = canvas.getContext('2d');
  let data,
    fitted,
    showGrid = true;
  const draw = () => {
    if (!data) return;
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    fitted = data.map.fit({width, height, padding: 24});
    const path = (points, close = false) => {
      points.forEach((p, i) => {
        const [x, y] = fitted.project(p);
        if (i) context.lineTo(x, y);
        else context.moveTo(x, y);
      });
      if (close) context.closePath();
    };
    context.fillStyle = '#e6f2f7';
    for (const region of fitted.regions) {
      context.beginPath();
      for (const outline of region.outlines) {
        outline.forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
        context.closePath();
      }
      context.fill();
    }
    const lines = (parts, color, width) => {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.beginPath();
      for (const part of parts) path(part.coordinates);
      context.stroke();
    };
    if (showGrid) lines(data.grid, '#b6cbd5', 0.6);
    lines(data.coast, '#24485a', 1);
    context.fillStyle = '#ed9b4599';
    context.strokeStyle = '#b45f0b';
    for (const part of data.polygon) {
      context.beginPath();
      for (const ring of part.coordinates) path(ring, true);
      context.fill('evenodd');
      context.stroke();
    }
    context.font = '12px system-ui';
    for (const city of data.cities) {
      const [x, y] = fitted.project(city.position);
      context.fillStyle = '#b43a34';
      context.beginPath();
      context.arc(x, y, 3, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = '#193747';
      if (width >= (data.minLabelWidth ?? 0)) context.fillText(city.label, x + 5, y - 5);
    }
  };
  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  return {
    setData(value) {
      data = value;
      draw();
    },
    setGrid(value) {
      showGrid = value;
      draw();
    },
    pick(event) {
      if (!fitted) return null;
      const box = canvas.getBoundingClientRect();
      return data.map.pick(fitted, [event.clientX - box.left, event.clientY - box.top])[0];
    },
    dispose() {
      resize.disconnect();
    }
  };
}
