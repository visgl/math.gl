// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Polyhedron, edgeKey} from './polyhedra';
import {BLUE_MARBLE_WORLD_URL} from '../common/blue-marble';

/** Positions move with the hinges; source positions always stay on the original sphere. */
export function surfaceVertices(mesh: Polyhedron, positions: number[][][]): Float32Array {
  const data: number[] = [];
  mesh.faces.forEach((ids, face) => {
    const color = [0.35 + (face % 3) * 0.12, 0.6, 0.7 + (face % 2) * 0.15];
    for (let j = 1; j < ids.length - 1; j++) {
      for (const k of [0, j, j + 1])
        data.push(...positions[face][k], ...mesh.vertices[ids[k]], ...color);
    }
  });
  return new Float32Array(data);
}

export function createRenderer(canvas: HTMLCanvasElement, status: HTMLElement) {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('This example requires WebGL 2.');
  const program = gl.createProgram()!;
  const sources = [
    `#version 300 es
    layout(location=0) in vec3 position;
    layout(location=1) in vec3 source;
    layout(location=2) in vec3 color;
    out vec3 spherePosition;
    out vec3 panelColor;
    void main() {
      gl_Position = vec4(position, 1.0);
      spherePosition = source;
      panelColor = color;
    }`,
    `#version 300 es
    precision highp float;
    in vec3 spherePosition;
    in vec3 panelColor;
    uniform sampler2D earth;
    uniform bool textured;
    out vec4 fragmentColor;
    void main() {
      if (!textured) { fragmentColor = vec4(panelColor * (gl_FrontFacing ? 1.0 : 0.28), 1.0); return; }
      vec3 p = normalize(spherePosition);
      // Z is north; +X is Greenwich and +Y is 90 degrees east.
      float longitude = dot(p.xy, p.xy) < 1e-14 ? 0.0 : atan(p.y, p.x);
      vec2 uv = vec2(0.5 + longitude / 6.28318530718,
                     0.5 - asin(clamp(p.z, -1.0, 1.0)) / 3.14159265359);
      // Wrap longitude derivatives to avoid a spurious coarse mip at the date line.
      vec2 dx = dFdx(uv), dy = dFdy(uv);
      dx.x -= round(dx.x); dy.x -= round(dy.x);
      fragmentColor = textureGrad(earth, uv, dx, dy);
      fragmentColor.rgb *= gl_FrontFacing ? 1.0 : 0.28;
    }`
  ];
  sources.forEach((source, i) => {
    const shader = gl.createShader(i ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader)!);
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program)!);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (let i = 0; i < 3; i++) {
    gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 36, i * 12);
  }
  const textured = gl.getUniformLocation(program, 'textured');
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([80, 140, 170, 255])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  let ready = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  status.textContent = 'Loading NASA Blue Marble…';
  image.onload = () => {
    // No Y flip: row zero is north and the shader maps north to v=0.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    ready = true;
    status.textContent = 'Earth imagery: NASA Blue Marble';
  };
  image.onerror = () => {
    status.textContent = 'Earth imagery unavailable. Showing panel colors; reload to retry.';
  };
  image.src = BLUE_MARBLE_WORLD_URL;
  return {
    get ready() {
      return ready;
    },
    draw(
      mesh: Polyhedron,
      positions: number[][][],
      hinges: Set<string>,
      earth: boolean,
      edges: boolean
    ) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1, 1);
      gl.uniform1i(textured, Number(earth && ready));
      const vertices = surfaceVertices(mesh, positions);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 9);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      if (!edges) return;
      const lines: number[] = [];
      mesh.faces.forEach((ids, face) => {
        ids.forEach((id, j) => {
          const next = (j + 1) % ids.length;
          const color = hinges.has(edgeKey(id, ids[next])) ? [1, 0.86, 0.57] : [0.09, 0.19, 0.24];
          for (const k of [j, next]) lines.push(...positions[face][k], 0, 0, 1, ...color);
        });
      });
      gl.uniform1i(textured, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.LINES, 0, lines.length / 9);
    }
  };
}
