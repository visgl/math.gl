// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {Buffer} from '@luma.gl/core';
import {Model,GPUGeometry} from '@luma.gl/engine';

/** Explicit separate GPU attributes avoid the default CPU geometry interleaving.
 * The model owns their lifetime; only the UV buffer is written after creation. */
export class PersistentUVLayer extends SimpleMeshLayer {
  static layerName='PersistentUVLayer';
  static defaultProps={...SimpleMeshLayer.defaultProps,uvValues:{type:'object',value:null},onUVUpload:{type:'function',value:null}};
  getModel(mesh) {
    const device=this.context.device,count=mesh.attributes.positions.value.length/3;
    const data={positions:mesh.attributes.positions.value,texCoords:new Float32Array(count*2),normals:new Float32Array(count*3),colors:new Float32Array(count*3).fill(1)};
    const attributes=Object.fromEntries(Object.entries(data).map(([name,value])=>[name,device.createBuffer({data:value,usage:Buffer.VERTEX|Buffer.COPY_DST})]));
    const geometry=new GPUGeometry({topology:'triangle-list',vertexCount:mesh.indices.value.length,
      indices:device.createBuffer({data:mesh.indices.value,usage:Buffer.INDEX}),attributes,
      bufferLayout:Object.keys(data).map(name=>({name,stepMode:'vertex',byteStride:name==='texCoords'?8:12,attributes:[{attribute:name,format:name==='texCoords'?'float32x2':'float32x3',byteOffset:0}]}))});
    const model=new Model(device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry,isInstanced:true});
    const texture=this.props.texture||this.state.emptyTexture;
    model.shaderInputs.setProps({simpleMesh:{...(device.type==='webgpu'?{simpleMeshTexture:texture}:{sampler:texture}),hasTexture:Boolean(this.props.texture)}});
    this.setState({uvBuffer:attributes.texCoords});return model;
  }
  updateState(params) {
    super.updateState(params);
    const {props,oldProps}=params;
    if(props.uvValues&&props.uvValues!==oldProps.uvValues&&this.state.model) {
      const buffer=this.state.uvBuffer;
      if(buffer.byteLength!==props.uvValues.byteLength)throw new RangeError('UV length requires a new persistent mesh');
      const begin=performance.now();buffer.write(props.uvValues);this.state.model.setNeedsRedraw('UV update');
      props.onUVUpload?.({bytes:props.uvValues.byteLength,submitMs:performance.now()-begin,model:this.state.model,buffer});
    }
  }
}

/** Comparator deliberately replaces the mesh; report model preparation submission,
 * not GPU completion time. No readback or GPU timer query is implied. */
export class ReplacementMeshLayer extends SimpleMeshLayer {
  static layerName='ReplacementMeshLayer';
  static defaultProps={...SimpleMeshLayer.defaultProps,onMeshUpload:{type:'function',value:null}};
  getModel(mesh) {
    // Materialize the same defaults SimpleMeshLayer would otherwise generate.
    // Count this normalized input, including colors/normals, before interleaving.
    const count=mesh.attributes.positions.value.length/3;
    const normalized={...mesh,attributes:{
      positions:mesh.attributes.positions,
      texCoords:mesh.attributes.texCoords,
      normals:mesh.attributes.normals??{value:new Float32Array(count*3),size:3},
      colors:mesh.attributes.colors??{value:new Float32Array(count*3).fill(1),size:3}
    }};
    this.setState({geometryUploadBytes:normalized.indices.value.byteLength+Object.values(normalized.attributes).reduce((n,a)=>n+a.value.byteLength,0)});
    return super.getModel(normalized);
  }
  updateState(params){const begin=performance.now();super.updateState(params);if(params.props.mesh!==params.oldProps.mesh&&this.state.model){params.props.onMeshUpload?.({bytes:this.state.geometryUploadBytes,submitMs:performance.now()-begin,model:this.state.model});}}
}
