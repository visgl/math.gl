// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Display color calibration, not inferred historical biomes or source elevations.
export const DEFAULT_TERRAIN_PALETTE = [.28,.38,.19, .59,.48,.32, .73,.70,.63];
function smooth(value) {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);}
/** Ease imagery into the elevation material at its actual coverage boundaries. */
export function terrainImageryWeight(time) {
  if(!Number.isFinite(time)) return 0;
  return Math.max(smooth((time+30)/30),smooth((-time-520)/20));
}
export function textureReveal(now,loadedAt) {
  return Number.isFinite(loadedAt) ? smooth((now-loadedAt)/1500) : 0;
}
/** Reuse the output; exclude ocean, near-white ice/clouds and transparent pixels. */
export function calibrateTerrainPalette(pixels,result=new Float32Array(DEFAULT_TERRAIN_PALETTE)) {
  result.set(DEFAULT_TERRAIN_PALETTE);
  const sums=new Float64Array(12);
  const stride=4*Math.max(1,Math.floor(pixels.length/4/8192));
  for(let i=0;i+3<pixels.length;i+=stride) {
    const r=pixels[i]/255,g=pixels[i+1]/255,b=pixels[i+2]/255;
    const luminance=.2126*r+.7152*g+.0722*b;
    if(pixels[i+3]<200 || b>=g*.95 || luminance<.035 ||
       (Math.max(r,g,b)-Math.min(r,g,b)<.08 && luminance>.65)) continue;
    const bucket=g>=r*.98 ? 0 : luminance>.5 ? 2 : 1;
    const offset=bucket*4;
    sums[offset]+=r;sums[offset+1]+=g;sums[offset+2]+=b;sums[offset+3]++;
  }
  for(let bucket=0;bucket<3;bucket++) {
    const offset=bucket*4,count=sums[offset+3];
    if(count) for(let channel=0;channel<3;channel++) result[bucket*3+channel]=sums[offset+channel]/count;
  }
  return result;
}
export function paletteFromImage(image,result) {
  // A small sample is sufficient for color statistics; avoid reading a full raster.
  const width=Math.min(256,image.width), height=Math.max(1,Math.round(image.height*width/image.width));
  const canvas=new OffscreenCanvas(width,height);
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context) return result;
  context.drawImage(image,0,0,width,height);
  return calibrateTerrainPalette(context.getImageData(0,0,width,height).data,result);
}
