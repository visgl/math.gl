// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, OrthographicView} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer, SolidPolygonLayer, TextLayer} from '@deck.gl/layers';

const styles = {
  ocean: [230, 242, 247],
  grid: [182, 203, 213],
  coast: [36, 72, 90],
  polygon: [237, 155, 69, 153],
  'polygon-outline': [180, 95, 11]
};

function color(kind, opacity = 1) {
  const [r, g, b, alpha = 255] = styles[kind];
  return [r, g, b, Math.round(alpha * opacity)];
}

export function createProjectedMapScene(canvas) {
  const deck = new Deck({
    canvas,
    width: null,
    height: null,
    views: new OrthographicView({flipY: true}),
    controller: false,
    useDevicePixels: Math.min(devicePixelRatio, 2)
  });
  let data, fitted, transition;
  let showGrid = true;

  function draw() {
    if (!data) return;
    const {width, height} = canvas.getBoundingClientRect();
    if (!width || !height) return;
    fitted = data.map.fit({width, height, padding: 24});
    const parameters = {depthCompare: 'always', depthWriteEnabled: false};
    const polygon = (id, parts) =>
      new SolidPolygonLayer({
        id,
        data: parts,
        getPolygon: part => part.coordinates,
        getFillColor: part => color(id, part.opacity),
        parameters
      });
    const paths = (id, parts) =>
      new PathLayer({
        id,
        data: parts,
        getPath: part => part.coordinates,
        getColor: part => color(id, part.opacity),
        widthUnits: 'pixels',
        getWidth: id === 'grid' ? 0.6 : 1,
        parameters
      });
    const layers = [];
    if (transition) {
      const {target, geometry, amount} = transition;
      const end = target.map.fit({width, height, padding: 24});
      const project = point => {
        const a = fitted.project(point);
        const b = end.project(point);
        return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];
      };
      const parts = new Map();
      for (const item of geometry) {
        if (item.kind === 'grid' && !showGrid) continue;
        const group = parts.get(item.kind) ?? [];
        for (const part of item.geometry.evaluate(amount)) {
          const rings = part.coordinates.map(ring => ring.map(project));
          if (part.kind === 'polygon') group.push({opacity: part.opacity, coordinates: rings});
          else for (const ring of rings) group.push({opacity: part.opacity, coordinates: ring});
        }
        parts.set(item.kind, group);
      }
      for (const [kind, group] of parts) {
        layers.push(
          kind === 'ocean' || kind === 'polygon' ? polygon(kind, group) : paths(kind, group)
        );
      }
    } else {
      const lineParts = parts =>
        parts.map(part => ({
          coordinates: part.coordinates.map(point => fitted.project(point))
        }));
      layers.push(
        polygon(
          'ocean',
          fitted.regions.flatMap(region =>
            region.outlines.map(outline => ({coordinates: [outline]}))
          )
        )
      );
      if (showGrid) layers.push(paths('grid', lineParts(data.grid)));
      layers.push(paths('coast', lineParts(data.coast)));
      layers.push(
        polygon(
          'polygon',
          data.polygon.map(part => ({
            coordinates: part.coordinates.map(ring => ring.map(point => fitted.project(point)))
          }))
        )
      );
      const outlines =
        data.polygonOutlines ??
        data.polygon.flatMap(part =>
          part.coordinates.map(ring => ({coordinates: [...ring, ring[0]]}))
        );
      layers.push(paths('polygon-outline', lineParts(outlines)));
      const cities = data.cities.map(city => ({...city, position: fitted.project(city.position)}));
      layers.push(
        new ScatterplotLayer({
          id: 'cities',
          data: cities,
          getPosition: city => city.position,
          getFillColor: [180, 58, 52],
          getRadius: 3,
          radiusUnits: 'pixels',
          parameters
        })
      );
      if (width >= (data.minLabelWidth ?? 0)) {
        layers.push(
          new TextLayer({
            id: 'labels',
            data: cities,
            getPosition: city => city.position,
            getText: city => city.label,
            getSize: 12,
            getColor: [25, 55, 71],
            getTextAnchor: 'start',
            getPixelOffset: [5, -5],
            parameters
          })
        );
      }
    }
    deck.setProps({
      viewState: {target: [width / 2, height / 2, 0], zoom: 0},
      layers
    });
  }

  const resize = new ResizeObserver(draw);
  resize.observe(canvas);
  return {
    setData(value) {
      data = value;
      transition = null;
      draw();
    },
    setTransition(value) {
      transition = value;
      draw();
    },
    setGrid(value) {
      showGrid = value;
      draw();
    },
    pick(event) {
      if (!fitted || transition) return null;
      const box = canvas.getBoundingClientRect();
      return data.map.pick(fitted, [event.clientX - box.left, event.clientY - box.top])[0];
    },
    dispose() {
      resize.disconnect();
      deck.finalize();
    }
  };
}
