// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createSource} from '../warp/fixtures.mjs';

/** Resample north-up geographic RGBA imagery into the fixture's UV grid.
 * Row zero corresponds to v=0 (source pixel y=0), not geographic north.
 * Longitude wraps at the antimeridian; latitude clamps at the poles.
 */
export async function resampleImagery(image, sourceName, {signal, yieldFrame=async()=>{}}={}) {
  const source=createSource(sourceName), {width,height}=source;
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++) {
    if(y%32===0){await yieldFrame();if(signal?.aborted)throw signal.reason;}
    for(let x=0;x<width;x++) {
      const [longitude,latitude]=source.pixelToGeographic([x+.5,y+.5]);
      if(!Number.isFinite(longitude)||!Number.isFinite(latitude))continue;
      const u=((longitude+180)%360+360)%360/360*image.width-.5;
      const v=Math.max(0,Math.min(image.height-1,(90-latitude)/180*image.height-.5));
      const x0=Math.floor(u),y0=Math.floor(v),fx=u-x0,fy=v-y0;
      for(let c=0;c<4;c++) {
        const pixel=(xx,yy)=>image.data[(yy*image.width+((xx%image.width+image.width)%image.width))*4+c];
        const a=pixel(x0,y0)*(1-fx)+pixel(x0+1,y0)*fx;
        const b=pixel(x0,Math.min(y0+1,image.height-1))*(1-fx)+pixel(x0+1,Math.min(y0+1,image.height-1))*fx;
        data[(y*width+x)*4+c]=a*(1-fy)+b*fy;
      }
    }
  }
  return {width,height,data};
}
