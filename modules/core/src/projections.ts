// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from './types';

export type ProjectionDepthOptions = {
  depthRange?: 'negative-one-to-one' | 'zero-to-one';
  reversedDepth?: boolean;
};
export type FrustumProjectionOptions = ProjectionDepthOptions & {
  left: number;
  right: number;
  bottom: number;
  top: number;
  near: number;
  far: number;
};
export type PerspectiveProjectionOptions = ProjectionDepthOptions & {
  fovy: number;
  aspect: number;
  near: number;
  far: number;
};

/** NDC depths at the near and far planes. */
export function getProjectionDepthRange(options: ProjectionDepthOptions = {}): [number, number] {
  const range = options.depthRange ?? 'negative-one-to-one';
  if (range !== 'negative-one-to-one' && range !== 'zero-to-one')
    throw new RangeError('Unknown depth range');
  const low = range === 'zero-to-one' ? 0 : -1;
  return options.reversedDepth ? [1, low] : [low, 1];
}

function validate(out: NumericArray, o: FrustumProjectionOptions, perspective: boolean): void {
  if (
    out.length < 16 ||
    ![o.left, o.right, o.bottom, o.top, o.near].every(Number.isFinite) ||
    o.right <= o.left ||
    o.top <= o.bottom ||
    !(o.far > o.near) ||
    (perspective ? o.near <= 0 : !Number.isFinite(o.far))
  )
    throw new RangeError('Invalid projection bounds');
}

/** Right-handed off-center perspective, camera forward -Z; far may be Infinity. */
export function mat4FrustumProjection<T extends NumericArray>(
  out: T,
  o: FrustumProjectionOptions
): T {
  validate(out, o, true);
  const [nearZ, farZ] = getProjectionDepthRange(o);
  const {near: n, far: f, left: l, right: r, bottom: b, top: t} = o;
  const z = f === Infinity ? (nearZ - farZ) * n : (nearZ - farZ) * n * (f / (f - n));
  const values = [
    (2 * n) / (r - l),
    0,
    0,
    0,
    0,
    (2 * n) / (t - b),
    0,
    0,
    (r + l) / (r - l),
    (t + b) / (t - b),
    z / n - nearZ,
    -1,
    0,
    0,
    z,
    0
  ];
  for (let i = 0; i < 16; i++) out[i] = values[i];
  return out;
}

export function mat4PerspectiveProjection<T extends NumericArray>(
  out: T,
  o: PerspectiveProjectionOptions
): T {
  if (
    !Number.isFinite(o.fovy) ||
    o.fovy <= 0 ||
    o.fovy >= Math.PI ||
    !Number.isFinite(o.aspect) ||
    o.aspect <= 0
  ) {
    throw new RangeError('Invalid perspective field of view');
  }
  const top = o.near * Math.tan(o.fovy / 2);
  return mat4FrustumProjection(out, {
    ...o,
    top,
    bottom: -top,
    right: top * o.aspect,
    left: -top * o.aspect
  });
}

/** Right-handed orthographic projection; near and far must be finite. */
export function mat4OrthographicProjection<T extends NumericArray>(
  out: T,
  o: FrustumProjectionOptions
): T {
  validate(out, o, false);
  const [nearZ, farZ] = getProjectionDepthRange(o);
  const {near: n, far: f, left: l, right: r, bottom: b, top: t} = o;
  const a = (nearZ - farZ) / (f - n);
  const values = [
    2 / (r - l),
    0,
    0,
    0,
    0,
    2 / (t - b),
    0,
    0,
    0,
    0,
    a,
    0,
    -(r + l) / (r - l),
    -(t + b) / (t - b),
    nearZ + a * n,
    1
  ];
  for (let i = 0; i < 16; i++) out[i] = values[i];
  return out;
}
