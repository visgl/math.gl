// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import globalLand from '../unfolding-polyhedron/data/land.json' with {type: 'json'};
import {geoOrthographic, geoPath} from 'd3-geo';

let nextSceneId = 0;

const namespace = 'http://www.w3.org/2000/svg';
const element = (name, attributes = {}) => {
  const node = document.createElementNS(namespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
};

/** SVG rendering, viewport transforms and picking; no application controls. */
export function createAlbersScene(svg, {map, features, graticule}) {
  const clipPrefix = `albers-${nextSceneId++}`;
  const globeFrame = map.evaluate({type: 'globe'});
  let layers = {states: true, grid: false, frames: false};
  const shortLabels = {
    puertoRico: 'PR',
    virginIslands: 'VI',
    guam: 'GU',
    northernMariana: 'MP',
    americanSamoa: 'AS'
  };
  let fitted;
  let globeLandCache;
  let amount = 1;
  let zoom = 1;
  let viewCenter;
  const radians = Math.PI / 180;
  const centerLongitude = -96 * radians;
  const centerLatitude = 38 * radians;
  function globePoint(source, width, height) {
    const [x, y, z] = globeFrame.projectPoint(source).position;
    const east = -Math.sin(centerLongitude) * x + Math.cos(centerLongitude) * y;
    const meridian = Math.cos(centerLongitude) * x + Math.sin(centerLongitude) * y;
    const north = Math.cos(centerLatitude) * z - Math.sin(centerLatitude) * meridian;
    const front = Math.sin(centerLatitude) * z + Math.cos(centerLatitude) * meridian;
    const radius = Math.min(width, height) * 0.41;
    return [width / 2 + east * radius, height / 2 - north * radius, front];
  }
  function draw() {
    const width = Math.max(320, svg.clientWidth);
    const height = Math.max(300, svg.clientHeight);
    const centerOnMap = viewCenter && fitted ? fitted.unproject(viewCenter) : null;
    fitted = map.fit({
      width,
      height,
      padding: {left: width * 0.035, right: width * 0.035, top: 24, bottom: 36}
    });
    viewCenter = centerOnMap ? fitted.project(centerOnMap) : [width / 2, height / 2];
    svg.classList.toggle('is-zoomed', zoom > 1);
    const visibleWidth = width / zoom;
    const visibleHeight = height / zoom;
    svg.setAttribute(
      'viewBox',
      `${viewCenter[0] - visibleWidth / 2} ${viewCenter[1] - visibleHeight / 2} ${visibleWidth} ${visibleHeight}`
    );
    svg.replaceChildren();
    const definitions = element('defs');
    svg.append(definitions);
    if (amount < 1) {
      const radius = Math.min(width, height) * 0.41;
      svg.append(
        element('circle', {
          cx: width / 2,
          cy: height / 2,
          r: radius,
          class: 'globe-disc',
          opacity: (1 - amount).toFixed(3)
        })
      );
      if (!globeLandCache || globeLandCache.width !== width || globeLandCache.height !== height) {
        const projection = geoOrthographic()
          .rotate([96, -38])
          .translate([width / 2, height / 2])
          .scale(radius)
          .clipAngle(90);
        const projectPath = geoPath(projection);
        globeLandCache = {
          width,
          height,
          paths: globalLand
            .map(coordinates => projectPath({type: 'Polygon', coordinates}))
            .filter(Boolean)
        };
      }
      const world = element('g', {opacity: (1 - amount).toFixed(3), class: 'world-land'});
      for (const d of globeLandCache.paths) world.append(element('path', {d}));
      svg.append(world);
    }
    for (const region of fitted.regions) {
      const group = element('g', {
        'data-region': region.id,
        class: !['lower48', 'alaska', 'hawaii'].includes(region.id) ? 'territory' : ''
      });
      const mixed = (flat, source) => {
        const [x, y] = fitted.project(flat);
        if (amount === 1) return [x, y];
        const globe = globePoint(source, width, height);
        return [globe[0] * (1 - amount) + x * amount, globe[1] * (1 - amount) + y * amount];
      };
      const mixedPath = (flatRings, sourceRings, close) =>
        flatRings
          .map(
            (ring, ringIndex) =>
              ring
                .map((flat, i) => {
                  const [x, y] = mixed(flat, sourceRings[ringIndex][i]);
                  return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
                })
                .join('') + (close ? 'Z' : '')
          )
          .join('');
      if (region.kind === 'inset' && region.frame) {
        const [left, top, right, bottom] = region.frame;
        const clip = element('clipPath', {id: `${clipPrefix}-${region.id}`});
        clip.append(element('rect', {x: left, y: top, width: right - left, height: bottom - top}));
        definitions.append(clip);
      }
      for (const part of features.filter(part => part.regionId === region.id)) {
        const source = part.sourceCoordinates[0];
        const meanFront =
          source.reduce((sum, point) => sum + globePoint(point, width, height)[2], 0) /
          source.length;
        const shape = element('path', {
          d: mixedPath(part.coordinates, part.sourceCoordinates, true),
          class: `state ${layers.states ? '' : 'no-borders'}`,
          'data-state': part.state,
          opacity: meanFront >= 0 ? 1 : amount.toFixed(3),
          'pointer-events': meanFront < 0 && amount < 0.001 ? 'none' : 'auto'
        });
        group.append(shape);
      }
      if (layers.grid) {
        const grid = element(
          'g',
          region.kind === 'inset' && region.frame
            ? {'clip-path': `url(#${clipPrefix}-${region.id})`}
            : {}
        );
        grid.setAttribute('opacity', amount.toFixed(3));
        for (const line of graticule.filter(line => line.regionId === region.id))
          grid.append(
            element('path', {
              d: mixedPath([line.coordinates], [line.sourceCoordinates], false),
              class: 'graticule'
            })
          );
        group.append(grid);
      }
      if (region.kind === 'inset') {
        const [left, top, right, bottom] = region.frame || region.bounds;
        const visibility = Math.max(0, (amount - 0.65) / 0.35);
        if (layers.frames)
          group.append(
            element('rect', {
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
              class: 'frame',
              opacity: visibility.toFixed(3)
            })
          );
        const text = shortLabels[region.id] || region.label;
        const fontSize = Math.max(7, Math.min(13, (right - left - 8) / (text.length * 0.62)));
        const label = element('text', {
          x: left + 4,
          y: top + fontSize + 3,
          'font-size': fontSize.toFixed(1),
          opacity: visibility.toFixed(3),
          class: 'inset-label'
        });
        label.textContent = text;
        group.append(label);
      }
      svg.append(group);
    }
  }
  function setZoom(next, anchor) {
    const old = zoom;
    zoom = Math.max(1, Math.min(8, next));
    if (zoom === 1) {
      viewCenter = [fitted.width / 2, fitted.height / 2];
      draw();
      return;
    }
    if (anchor && zoom !== old) {
      viewCenter = [
        anchor[0] + ((viewCenter[0] - anchor[0]) * old) / zoom,
        anchor[1] + ((viewCenter[1] - anchor[1]) * old) / zoom
      ];
    }
    draw();
  }
  function eventPoint(event) {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      svg.getScreenCTM().inverse()
    );
    return [point.x, point.y];
  }
  function pick(pixel) {
    if (amount > 0.001 && amount < 0.999) return null;
    let hit;
    if (amount < 0.001) {
      const radius = Math.min(fitted.width, fitted.height) * 0.41;
      const east = (pixel[0] - fitted.width / 2) / radius;
      const north = (fitted.height / 2 - pixel[1]) / radius;
      const length2 = east * east + north * north;
      if (length2 <= 1) {
        const front = Math.sqrt(1 - length2);
        const lat = Math.asin(north * Math.cos(centerLatitude) + front * Math.sin(centerLatitude));
        const lon =
          centerLongitude +
          Math.atan2(east, front * Math.cos(centerLatitude) - north * Math.sin(centerLatitude));
        hit = {regionId: 'globe', position: [((lon / radians + 540) % 360) - 180, lat / radians]};
      }
    } else hit = map.pick(fitted, pixel)[0];
    if (!hit) return null;
    return {
      ...hit,
      label: fitted.regions.find(region => region.id === hit.regionId)?.label || 'Globe'
    };
  }
  const resize = new ResizeObserver(draw);
  resize.observe(svg);
  draw();
  return {
    get amount() {
      return amount;
    },
    get zoom() {
      return zoom;
    },
    setAmount(value) {
      amount = Math.max(0, Math.min(1, value));
      draw();
    },
    setLayers(value) {
      layers = {...layers, ...value};
      draw();
    },
    zoomBy(factor, anchor) {
      setZoom(zoom * factor, anchor);
    },
    resetZoom() {
      zoom = 1;
      viewCenter = null;
      draw();
    },
    pan(previous, current) {
      viewCenter = [
        viewCenter[0] - (current[0] - previous[0]),
        viewCenter[1] - (current[1] - previous[1])
      ];
      draw();
    },
    eventPoint,
    pick,
    dispose() {
      resize.disconnect();
      svg.replaceChildren();
    }
  };
}
