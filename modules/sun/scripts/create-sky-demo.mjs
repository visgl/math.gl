// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original comparison demo; runtime deck.gl CDN dependency is MIT.
import {writeFile} from 'node:fs/promises';
import {createSkyContext} from '../dist/astronomy.js';
import {createSkyObserver, getSkyGlobePosition} from '../dist/index.js';

const output = process.argv[2];
if (!output) throw new Error('Usage: node modules/sun/scripts/create-sky-demo.mjs /absolute/path/sky.html');
const observer = createSkyObserver({latitude: 37.8, longitude: -122.4});
const context = createSkyContext(observer, {cacheSize: 0});
const frames = context.getSnapshots(Array.from({length: 73}, (_, i) => Date.UTC(2024, 0, 18) + i * 3600000));
for (const frame of frames) frame.starAnchors = [0, 3, 6].map((offset, i) => {
  const direction = frame.starfieldRotation.slice(offset, offset + 3);
  return {name: 'J2000 ' + ['X', 'Y', 'Z'][i], direction, altitude: Math.asin(direction[2]), globePosition: getSkyGlobePosition(direction, observer, 10000000), angularDiameter: 0, fade: 0.7, color: [220, 130, 240]};
});
await writeFile(output, `<!doctype html>
<!-- SPDX-License-Identifier: MIT -->
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>math.gl sky — local and globe</title>
<style>body{margin:0;background:#111827;color:#e5e7eb;font:16px system-ui}header{padding:20px}h1{font-size:24px;margin:0 0 12px}main{display:grid;grid-template-columns:1fr 1fr;height:65vh}.panel{position:relative;min-width:0}canvas{width:100%;height:100%}#globe{position:absolute;inset:0}p{max-width:900px;line-height:1.5}input{width:60%}#readout{font-variant-numeric:tabular-nums}@media(max-width:700px){main{grid-template-columns:1fr;height:100vh}.panel{min-height:45vh}}</style>
<header><h1>One sky, two coordinate systems</h1><p>San Francisco observer • Sun, Moon, planets and Galilean moons. Local horizon plot beside deck.gl GlobeView render shell. Drag the time slider to compare daylight Moon contrast.</p><label>Time <input id="time" type="range" min="0" max="72" value="0"></label><p id="readout"></p></header>
<main><section class="panel"><canvas id="local"></canvas></section><section class="panel"><div id="globe"></div></section></main>
<header><p>Disk markers have a minimum size for readability. Magenta J2000 axes show star-field orientation, not a star catalog. Galilean moon opacity uses eclipse/occultation fractions; naked-eye Jupiter glare is not modeled. Globe rotation is interactive; calculations stay tied to the San Francisco observer. The globe view needs network access for the MIT deck.gl 9.1.9 CDN bundle.</p></header>
<script src="https://unpkg.com/deck.gl@9.1.9/dist.min.js"></script>
<script>
const frames = ${JSON.stringify(frames)};
const input = document.getElementById('time'), canvas = document.getElementById('local');
const globe = window.deck ? new deck.Deck({parent: document.getElementById('globe'), views: new deck._GlobeView({farZMultiplier: 8}), initialViewState: {longitude: -122.4, latitude: 37.8, zoom: -1}, controller: true}) : null;
function draw() {
  const sky = frames[Number(input.value)], moon = sky.moon.appearance;
  document.getElementById('readout').textContent = new Date(sky.timestamp).toISOString() + ' • Moon fade ' + moon.fade.toFixed(2) + ' • direct ' + moon.illuminance.toFixed(4) + ' lux • sky ' + moon.backgroundLuminance.toFixed(3) + ' cd/m²';
  const data = [{...sky.sun,name:'Sun',fade:1,color:[255,205,70]}, {...sky.moon,name:'Moon',fade:moon.fade,color:[240,240,240]}, ...sky.planets.map(p=>({...p,fade:p.parent ? p.sunlitFraction*p.visibleDiskFraction : p.visibility.fade,color:[150,200,255]})), ...sky.starAnchors];
  const width=canvas.clientWidth,height=canvas.clientHeight;canvas.width=width*devicePixelRatio;canvas.height=height*devicePixelRatio;
  const ctx=canvas.getContext('2d');ctx.scale(devicePixelRatio,devicePixelRatio);const r=Math.min(width,height)*0.4,x=width/2,y=height/2;
  ctx.strokeStyle='#64748b';ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.stroke();ctx.fillStyle='#e5e7eb';ctx.fillText('North',x-18,y-r-12);ctx.fillText('East',x+r+5,y);
  for(const body of data){if(body.altitude<0)continue;const k=(1-2*body.altitude/Math.PI)*r,h=Math.hypot(body.direction[0],body.direction[1])||1,px=x+k*body.direction[0]/h,py=y-k*body.direction[1]/h;ctx.globalAlpha=body.fade;ctx.fillStyle='rgb('+body.color.join(',')+')';ctx.beginPath();ctx.arc(px,py,body.name==='Sun'||body.name==='Moon'?7:3,0,2*Math.PI);ctx.fill();ctx.fillText(body.name,px+9,py);ctx.globalAlpha=1;}
  if(globe)globe.setProps({layers:[new deck.SolidPolygonLayer({id:'earth',data:[[[ -180,90],[0,90],[180,90],[180,-90],[0,-90],[-180,-90]]],getPolygon:d=>d,getFillColor:[20,65,90]}),new deck.ScatterplotLayer({id:'sky',data,getPosition:d=>d.globePosition,getRadius:d=>10000000*Math.tan(d.angularDiameter/2),radiusMinPixels:3,billboard:true,getFillColor:d=>[...d.color,Math.round(255*d.fade)]})]});
}
input.addEventListener('input',draw);window.addEventListener('resize',draw);draw();
</script></html>`);
process.stdout.write(output + '\n');
