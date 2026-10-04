// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original cloud-sample visualization; no external artwork or runtime dependencies.
import {writeFile} from 'node:fs/promises';
import {getCloudLighting} from '../dist/index.js';

const output = process.argv[2];
if (!output) throw new Error('Usage: node modules/sun/scripts/create-cloud-demo.mjs /absolute/path/clouds.html');
const heights = [500, 2000, 5000, 10000];
const depths = [0, 2, 5];
const frames = Array.from({length: 121}, (_, i) => {
  const degrees = -10 + i * 0.25;
  return {degrees, depths: depths.map(sunOpticalDepth => heights.map(cloudAltitude =>
    getCloudLighting(degrees * Math.PI / 180, {cloudAltitude, sunOpticalDepth, sunSeparation: Math.PI / 3})))};
});
await writeFile(output, `<!doctype html>
<!-- SPDX-License-Identifier: MIT -->
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>math.gl dawn and dusk clouds</title>
<style>body{margin:0;background:#101827;color:#e7ecf3;font:16px system-ui}header{padding:24px}h1{font-size:26px;margin:0 0 12px}p{max-width:1100px;line-height:1.5}input{width:55%;vertical-align:middle}select{padding:8px;background:#202d45;color:white}main{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:0 24px}.card{background:#19253b;border-radius:12px;padding:18px}h2{font-size:20px;margin:0 0 12px}svg{width:100%;height:210px}.detail{font-size:14px;line-height:1.6;font-variant-numeric:tabular-nums}footer{padding:24px;color:#b2bfd3;font-size:14px}@media(max-width:850px){main{grid-template-columns:repeat(2,1fr)}}@media(max-width:450px){main{grid-template-columns:1fr}}</style>
<header><h1>Clouds through dawn and dusk</h1><p>One Sun angle, four cloud heights. Elevated clouds can remain sunlit while lower clouds enter Earth's shadow. Warm sunlight mixes with cooler ambient sky light. These are sample colors, not a volumetric cloud simulation.</p>
<label>Sun altitude <input id="sun" type="range" min="0" max="120" step="1" value="36"></label>
<select id="shade"><option value="0">Unshaded Sun ray</option><option value="1">Sun ray depth 2</option><option value="2">Sun ray depth 5</option></select>
<p id="readout"></p></header><main id="samples"></main>
<footer>Original MIT model and SVG shapes · fixed exposure and one viewing angle · no refraction, ozone or multiple scattering · slider works in either direction for dawn/dusk.</footer>
<script>
const frames=${JSON.stringify(frames)}, heights=${JSON.stringify(heights)};
const sun=document.getElementById('sun'), shade=document.getElementById('shade');
function encode(v){const t=1-Math.exp(-v*75);return Math.round(255*(t<=0.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-0.055));}
function draw(){const frame=frames[Number(sun.value)], clouds=frame.depths[Number(shade.value)];
 document.getElementById('readout').textContent='Sun center '+frame.degrees.toFixed(2)+'° above local horizontal • ground '+(frame.degrees>0?'daylight':'dawn/dusk or night');
 document.getElementById('samples').innerHTML=clouds.map((light,i)=>{
 const rgb=light.scattered.color.map(v=>encode(v*light.scattered.intensity));
 const paint='rgb('+rgb.join(',')+')';
 return '<section class="card"><h2>'+heights[i].toLocaleString()+' m MSL</h2><svg viewBox="0 0 300 180" aria-label="Approximate scattered cloud color">'+
 '<g fill="'+paint+'"><ellipse cx="150" cy="112" rx="113" ry="42"/><circle cx="95" cy="95" r="43"/><circle cx="146" cy="75" r="52"/><circle cx="205" cy="98" r="42"/></g></svg>'+
 '<div class="detail">Solar disk visible: '+(100*light.sunVisibleFraction).toFixed(0)+'%<br>Earth horizon: '+(light.horizonAltitude*180/Math.PI).toFixed(2)+'°<br>Direct intensity: '+light.direct.intensity.toFixed(4)+'<br>Scattered intensity: '+light.scattered.intensity.toFixed(5)+'</div></section>';
 }).join('');}
sun.oninput=draw;shade.onchange=draw;draw();
</script></html>`);
console.log(output);
