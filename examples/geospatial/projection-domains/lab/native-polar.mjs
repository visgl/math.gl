// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import fixture from '../qualification/native-polar.json' with {type:'json'};
export {fixture as nativePolarFixture};

/** Assemble the two point-sampled native tiles onto the known Antarctic fixture
 * grid. Nearest resampling preserves alpha=0 nodata instead of blending it. */
export function nativePolarImage(){
  const nodes=new Uint8ClampedArray(65*65*4);
  for(const [tileIndex,tile] of fixture.tiles.entries()){
    const bytes=Uint8ClampedArray.from(atob(tile.rgbaBase64),c=>c.charCodeAt(0));
    for(let y=0;y<65;y++)for(let x=0;x<33;x++)nodes.set(bytes.subarray((y*33+x)*4,(y*33+x+1)*4),(y*65+x+tileIndex*32)*4);
  }
  const width=256,height=256,data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const nx=Math.round((x+.5)/width*64),ny=Math.round((y+.5)/height*64);
    data.set(nodes.subarray((ny*65+nx)*4,(ny*65+nx+1)*4),(y*width+x)*4);
  }
  return {width,height,data};
}
