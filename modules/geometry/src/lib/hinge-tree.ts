// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core';

/** A rigid panel attached to its parent by a revolute joint. */
export type HingePanel = {
  /** Parent index in the input array; -1 for a root. Input order is arbitrary. */
  parent: number;
  /** Child-local to parent-local transform at zero angle; defaults to identity. */
  restTransform?: Readonly<NumericArray>;
  /** Hinge pivot in parent-local coordinates. Required for nonroots. */
  pivot?: readonly [number, number, number];
  /** Right-handed rotation axis in parent-local coordinates; normalized internally. */
  axis?: readonly [number, number, number];
};

type Joint = {
  parent: number;
  rest: Matrix4;
  pivot: number[];
  negativePivot: number[];
  axis: number[];
};

/** Experimental rigid-panel kinematics, independent of mesh topology and rendering.
 * Snapshots its inputs. Does not infer shared edges, solve closed loops or detect collisions.
 */
export class HingeTree {
  readonly panelCount: number;
  private readonly joints: Joint[];
  private readonly order: number[];
  private readonly angles: Float64Array;
  private readonly local = new Matrix4();
  private readonly world = new Matrix4();
  private readonly root = new Matrix4();

  constructor(panels: readonly HingePanel[]) {
    this.panelCount = panels.length;
    const children: number[][] = panels.map(() => []);
    const order: number[] = [];
    this.joints = panels.map((panel, index) => {
      const {parent} = panel;
      if (!Number.isInteger(parent) || parent < -1 || parent >= panels.length || parent === index) {
        throw new RangeError('Invalid hinge parent index');
      }
      if (parent === -1) order.push(index);
      else children[parent].push(index);
      const rest = new Matrix4();
      if (panel.restTransform !== undefined) {
        validateRigidTransform(panel.restTransform);
        rest.copy(panel.restTransform);
      }
      const pivot = parent === -1 ? [0, 0, 0] : copyVector(panel.pivot);
      const axis = parent === -1 ? [1, 0, 0] : copyVector(panel.axis);
      const length = Math.hypot(...axis);
      if (!Number.isFinite(length) || length === 0) throw new RangeError('Invalid hinge axis');
      for (let i = 0; i < 3; i++) axis[i] /= length;
      return {
        parent,
        rest,
        pivot,
        negativePivot: pivot.map(value => -value),
        axis
      };
    });
    // Iterative traversal supports deep trees without consuming the call stack.
    for (let i = 0; i < order.length; i++) {
      for (const child of children[order[i]]) order.push(child);
    }
    if (order.length !== panels.length) throw new RangeError('Hinge parents contain a cycle');
    this.order = order;
    this.angles = new Float64Array(panels.length);
  }

  /** Evaluate one angle per panel in radians (root angles must be zero).
   * Returns column-major matrices in input-panel order, 16 doubles per panel.
   * rootTransform places the whole forest; omitted means identity.
   * Output may alias the inputs: angles and root transform are snapshotted first.
   * Finite inputs that overflow during composition throw; output may then be partial.
   */
  evaluate(
    angles: Readonly<NumericArray>,
    output = new Float64Array(this.panelCount * 16),
    rootTransform?: Readonly<NumericArray>
  ): Float64Array {
    if (angles.length !== this.panelCount) throw new RangeError('Expected one angle per panel');
    if (!(output instanceof Float64Array) || output.length !== this.panelCount * 16) {
      throw new RangeError('Expected 16 Float64 values per panel');
    }
    for (let i = 0; i < angles.length; i++) {
      if (!Number.isFinite(angles[i]) || (this.joints[i].parent === -1 && angles[i] !== 0)) {
        throw new RangeError('Expected finite angles and zero root angles');
      }
      this.angles[i] = angles[i];
    }
    this.root.identity();
    if (rootTransform !== undefined) {
      validateRigidTransform(rootTransform);
      this.root.copy(rootTransform);
    }
    for (const index of this.order) {
      const joint = this.joints[index];
      this.local.identity();
      if (joint.parent !== -1) {
        this.local
          .translate(joint.pivot)
          .rotateAxis(this.angles[index], joint.axis)
          .translate(joint.negativePivot);
      }
      this.local.multiplyRight(joint.rest);
      if (joint.parent === -1) this.world.copy(this.root);
      else {
        for (let i = 0; i < 16; i++) this.world[i] = output[joint.parent * 16 + i];
      }
      this.world.multiplyRight(this.local);
      for (let i = 0; i < 16; i++) {
        if (!Number.isFinite(this.world[i])) throw new RangeError('Hinge transform overflow');
        output[index * 16 + i] = this.world[i];
      }
    }
    return output;
  }
}

function copyVector(vector?: readonly number[]): number[] {
  if (
    !vector ||
    vector.length !== 3 ||
    !Number.isFinite(vector[0]) ||
    !Number.isFinite(vector[1]) ||
    !Number.isFinite(vector[2])
  ) {
    throw new RangeError('Expected a finite hinge pivot and axis');
  }
  return [...vector];
}

/** Accept proper rigid affine transforms, allowing numerical roundoff. */
function validateRigidTransform(matrix: Readonly<NumericArray>): void {
  if (matrix.length !== 16) throw new RangeError('Expected a 4x4 rigid transform');
  for (let i = 0; i < 16; i++) {
    if (!Number.isFinite(matrix[i])) throw new RangeError('Expected a finite rigid transform');
  }
  const tolerance = 1e-6;
  if (
    Math.abs(matrix[3]) > tolerance ||
    Math.abs(matrix[7]) > tolerance ||
    Math.abs(matrix[11]) > tolerance ||
    Math.abs(matrix[15] - 1) > tolerance
  )
    throw new RangeError('Expected an affine rigid transform');
  for (let a = 0; a < 3; a++) {
    for (let b = a; b < 3; b++) {
      let dot = 0;
      for (let row = 0; row < 3; row++) dot += matrix[a * 4 + row] * matrix[b * 4 + row];
      if (Math.abs(dot - (a === b ? 1 : 0)) > tolerance) {
        throw new RangeError('Rigid transforms cannot scale or shear');
      }
    }
  }
  const determinant =
    matrix[0] * (matrix[5] * matrix[10] - matrix[6] * matrix[9]) -
    matrix[4] * (matrix[1] * matrix[10] - matrix[2] * matrix[9]) +
    matrix[8] * (matrix[1] * matrix[6] - matrix[2] * matrix[5]);
  if (Math.abs(determinant - 1) > tolerance)
    throw new RangeError('Rigid transforms cannot reflect');
}
