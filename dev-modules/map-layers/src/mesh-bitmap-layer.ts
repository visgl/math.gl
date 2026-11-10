// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {BitmapLayer} from '@deck.gl/layers';
import type {DefaultProps, UpdateParameters} from '@deck.gl/core';

export type BitmapMesh = ReturnType<BitmapLayer['_createMesh']>;

/** BitmapLayer rendering with caller-owned, indexed geometry and UVs. */
export class MeshBitmapLayer extends BitmapLayer<{mesh: BitmapMesh}> {
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

  protected override _createMesh(): BitmapMesh {
    if (!this.props.mesh) throw new Error('MeshBitmapLayer requires a mesh');
    return this.props.mesh;
  }
}
