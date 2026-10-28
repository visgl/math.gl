// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4 from 'proj4';
import {geoEquirectangular,geoOrthographic} from 'd3-geo';
import {createRasterBatchEvaluator} from '../../proj-wasm-crs/raster.mjs';
export const engines={
  native:'Native math.gl',proj4:'proj4js source transform',d3:'D3 target projection',wasm:'proj-wasm source transform'
};
export function capability(engine,source,target,mode='inverse') {
  if(!Object.hasOwn(engines,engine))return 'Unknown projection engine';
  if(engine==='d3'&&!['world','orthographic'].includes(target))return 'D3 adapter supports equirectangular and orthographic targets; interrupted D3 streaming is demonstrated on the Projection domains page.';
  if(mode==='forward' && (target==='interrupted'||(target==='world'&&['antarctica','rotated-polar'].includes(source))))
    return 'This source-grid recipe has no continuous patch through the pole-to-line or interrupted cut. Use target-grid preparation.';
  if(mode==='forward'&&engine==='wasm')return 'This asynchronous PROJ recipe currently supplies inverse-mesh samples. Use target-grid preparation.';
  return null;
}
/** Engines own conversion only; charts retain domain and branch semantics. */
export async function createBackend(engine,chart,target,center,proj) {
  let inverse=chart.inverse,forward=chart.forward,dispose=async()=>{};
  if(engine==='proj4') {
    const operation=proj4('EPSG:4326',chart.source.definition);
    inverse=p=>chart.source.coordinateToPixel(operation.forward(Array.from(chart.toGeographic(p))));
    forward=p=>chart.fromGeographic(operation.inverse(chart.source.pixelToCoordinate(p)));
  } else if(engine==='d3') {
    const projection=target==='world' ? geoEquirectangular().scale(180/Math.PI).translate([0,0]).reflectY(true)
      : geoOrthographic().scale(1).translate([0,0]).rotate([-center[0],-center[1]]).reflectY(true);
    inverse=p=>chart.source.geographicToPixel(projection.invert(p));
    forward=p=>{const geographic=chart.source.pixelToGeographic(p),q=projection(geographic);if(target==='world')q[0]+=360*Math.round((chart.fromGeographic(geographic)[0]-q[0])/360);return q;};
  } else if(engine==='wasm') {
    if(!proj)throw new Error('proj-wasm has not initialized');
    const backend=await createRasterBatchEvaluator(proj,chart);
    return {evaluate:backend.evaluate,dispose:backend.dispose,label:engines[engine]};
  } else if(engine!=='native')throw new Error('Unknown projection engine');
  return {inverse,forward,dispose,label:engines[engine],async evaluate(points,{signal}={}) {
    const output=new Float64Array(points.length);
    for(let i=0;i<points.length;i+=2){if(signal?.aborted)throw signal.reason;output.set(inverse(points.slice(i,i+2)),i);}
    return output;
  }};
}
