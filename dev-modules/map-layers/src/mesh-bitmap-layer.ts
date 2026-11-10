// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {BitmapLayer} from '@deck.gl/layers';
import type {DefaultProps, UpdateParameters} from '@deck.gl/core';

type NativeBitmapMesh = ReturnType<BitmapLayer['_createMesh']>;
export type BitmapMesh = Omit<NativeBitmapMesh, 'positions'> & {
  positions: Float32Array | Float64Array;
};

/** BitmapLayer rendering with caller-owned, indexed geometry and UVs. */
export class MeshBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<
  {mesh?: BitmapMesh} & ExtraPropsT
> {
  static override layerName = 'MeshBitmapLayer';
  static override defaultProps: DefaultProps = {
    mesh: {type: 'object', value: null, compare: false}
  };

  override updateState(params: UpdateParameters<this>): void {
    super.updateState(params);
    // BitmapLayer refreshes geometry for bounds changes, but not custom meshes.
    if (
      params.props.mesh !== params.oldProps.mesh &&
      params.props.bounds === params.oldProps.bounds
    ) {
      const mesh = this._createMesh();
      this.state.model?.setVertexCount(mesh.vertexCount);
      this.setState({mesh});
      this.getAttributeManager()?.invalidateAll();
    }
  }

  protected override _createMesh(): NativeBitmapMesh {
    // BitmapLayer's position attribute accepts both float precisions.
    return (this.props.mesh as NativeBitmapMesh | undefined) ?? super._createMesh();
  }
}
