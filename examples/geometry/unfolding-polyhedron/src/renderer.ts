// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {MeshBitmapLayer, type BitmapMesh} from '@deck.gl/map-layers';
import {type Polyhedron, edgeKey} from './polyhedra';
import {BLUE_MARBLE_WORLD_URL} from '../../../common/blue-marble';

import {surfaceVertices} from './surface-vertices';

const surfaceUniforms = {
  name: 'unfolding',
  fs: `layout(std140) uniform unfoldingUniforms {
    float textured;
    float cartographic;
  } unfolding;`,
  uniformTypes: {textured: 'f32', cartographic: 'f32'} as const
};

type PanelMesh = BitmapMesh & {directions: Float32Array; colors: Float32Array};
type PanelProps = {
  mesh: PanelMesh;
  textured: boolean;
  cartographic: boolean;
};

class UnfoldingSurfaceLayer extends MeshBitmapLayer<PanelProps> {
  static layerName = 'UnfoldingSurfaceLayer';

  initializeState() {
    super.initializeState();
    this.getAttributeManager()!.add({
      directions: {
        size: 3,
        noAlloc: true,
        update: attribute => {
          attribute.value = this.props.mesh.directions;
        }
      },
      colors: {
        size: 3,
        noAlloc: true,
        update: attribute => {
          attribute.value = this.props.mesh.colors;
        }
      }
    });
  }

  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      modules: [...shaders.modules, surfaceUniforms],
      fs: shaders.fs.replace(
        'vec4 bitmapColor = texture(bitmapTexture, uv);',
        `
        vec3 p = normalize(spherePosition);
        float longitude = dot(p.xy, p.xy) < 1e-14 ? 0.0 : atan(p.y, p.x);
        uv = vec2(0.5 + longitude / (2.0 * PI), 0.5 - asin(clamp(p.z, -1.0, 1.0)) / PI);
        vec2 dx = dFdx(uv), dy = dFdy(uv);
        dx.x -= round(dx.x);
        dy.x -= round(dy.x);
        vec4 bitmapColor = unfolding.textured > 0.5
          ? textureGrad(bitmapTexture, uv, dx, dy) : vec4(panelColor, 1.0);
        if (unfolding.cartographic > 0.5) {
          vec3 normal = normalize(cross(dFdx(renderPosition), dFdy(renderPosition)));
          bitmapColor.rgb *= 0.45 + 0.55 * abs(normal.z);
        }
        bitmapColor.rgb *= gl_FrontFacing ? 1.0 : 0.28;
      `
      ),
      inject: {
        ...shaders.inject,
        'vs:#decl': `
          in vec3 directions;
          in vec3 colors;
          out vec3 spherePosition;
          out vec3 panelColor;
          out vec3 renderPosition;
        `,
        'vs:#main-end': `
          spherePosition = directions;
          panelColor = colors;
          renderPosition = vec3(gl_Position.xy / gl_Position.w, -positions.z);
        `,
        'fs:#decl': `
          in vec3 spherePosition;
          in vec3 panelColor;
          in vec3 renderPosition;
        `
      }
    };
  }

  draw(options: Parameters<MeshBitmapLayer<PanelProps>['draw']>[0]) {
    this.state.model?.shaderInputs.setProps({
      unfolding: {
        textured: Number(this.props.textured),
        cartographic: Number(this.props.cartographic)
      }
    });
    super.draw(options);
  }
}

const bounds: [number, number, number, number] = [0, 0, 1, 1];

export function createRenderer(
  canvas: HTMLCanvasElement,
  onStatus: (message: string) => void,
  landSource?: HTMLCanvasElement
) {
  const deck = new Deck({
    canvas,
    width: null,
    height: null,
    views: new OrthographicView({flipY: false, near: 0.1, far: 3}),
    viewState: {target: [0, 0, 0], zoom: 0},
    controller: false,
    useDevicePixels: Math.min(devicePixelRatio, 2)
  });
  const fallback = new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1);
  let ready = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  onStatus('Loading NASA Blue Marble…');
  image.onload = () => {
    ready = true;
    onStatus('Earth imagery: NASA Blue Marble');
  };
  image.onerror = () => {
    onStatus('Earth imagery unavailable. Showing panel colors; reload to retry.');
  };
  image.src = BLUE_MARBLE_WORLD_URL;

  return {
    dispose() {
      image.onload = null;
      image.onerror = null;
      image.src = '';
      deck.finalize();
    },
    get ready() {
      return ready;
    },
    draw(
      mesh: Polyhedron,
      positions: number[][][],
      hinges: Set<string>,
      earth: boolean,
      edges: boolean,
      cartographic = false
    ) {
      const {width, height} = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const toWorld = ([x, y, z]: number[]): [number, number, number] => [
        (x * width) / 2,
        (y * height) / 2,
        -z
      ];
      const vertices = surfaceVertices(mesh, positions);
      const count = vertices.length / 9;
      const panelMesh: PanelMesh = {
        positions: new Float64Array(count * 3),
        directions: new Float32Array(count * 3),
        colors: new Float32Array(count * 3),
        texCoords: new Float32Array(count * 2),
        indices: Uint32Array.from({length: count}, (_, i) => i),
        vertexCount: count
      };
      for (let i = 0; i < count; i++) {
        const offset = i * 9;
        panelMesh.positions.set(toWorld(Array.from(vertices.subarray(offset, offset + 3))), i * 3);
        panelMesh.directions.set(vertices.subarray(offset + 3, offset + 6), i * 3);
        panelMesh.colors.set(vertices.subarray(offset + 6, offset + 9), i * 3);
      }
      const land = Boolean(cartographic && landSource);
      const textured = land || (earth && ready);
      const surface = new UnfoldingSurfaceLayer({
        id: 'panels',
        mesh: panelMesh,
        image: land ? landSource : textured ? image : fallback,
        bounds,
        textured,
        cartographic,
        textureParameters: {addressModeU: 'repeat', mipmapFilter: 'linear'},
        parameters: {cullMode: 'none', depthCompare: 'less-equal'}
      });
      const lines = edges
        ? mesh.faces.flatMap((ids, face) =>
            ids.map((id, index) => {
              const next = (index + 1) % ids.length;
              const path = [toWorld(positions[face][index]), toWorld(positions[face][next])];
              for (const point of path) point[2] += 0.0001;
              const color: [number, number, number] = cartographic
                ? [38, 59, 71]
                : hinges.has(edgeKey(id, ids[next]))
                  ? [255, 219, 145]
                  : [23, 48, 61];
              return {path, color};
            })
          )
        : [];
      deck.setProps({
        layers: [
          surface,
          new PathLayer({
            id: 'edges',
            data: lines,
            getPath: line => line.path,
            getColor: line => line.color,
            widthUnits: 'pixels',
            getWidth: 1,
            parameters: {depthCompare: 'less-equal', depthWriteEnabled: false}
          })
        ]
      });
    }
  };
}
