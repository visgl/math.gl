// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original cinematic art, not an orbital or atmospheric simulation.
import {ScatterplotLayer} from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';

class CelestialBodyLayer extends ScatterplotLayer {
  static layerName = 'TectonicCelestialBodyLayer';
  getShaders() {
    const shaders = super.getShaders();
    return {...shaders, inject: {...shaders.inject,
      'fs:DECKGL_FILTER_COLOR': `
        vec3 n=vec3(geometry.uv,sqrt(max(0.,1.-dot(geometry.uv,geometry.uv))));
        float light=.16+.84*max(dot(n,normalize(vec3(-.5,.6,1.))),0.);
        float texture=.92+.08*sin(geometry.uv.x*47.)*sin(geometry.uv.y*39.);
        color.rgb*=light*texture;
      `}};
  }
}
const position = d => d.position;
const color = d => d.color;
const radius = d => d.radius;
export function createFormationEffects() {
  const debris = Array.from({length:192}, () => ({position:[0,0,0],color:[255,150,60,0],radius:0}));
  const bodies = [{position:[0,0,0],color:[255,130,45,255],radius:0}];
  return (time, globeWeight) => {
    const age=-time, elapsed=4500-age;
    if (age>4520 || age<4320 || globeWeight<.001) return [];
    const alpha=Math.max(0,Math.min(1,(age-4320)/30))*globeWeight;
    const approach=Math.max(0,Math.min(1,(4520-age)/20));
    const formed=Math.max(0,Math.min(1,(elapsed-5)/55));
    const orbit=elapsed*.11;
    const body=bodies[0];
    if (elapsed<0) {
      body.position[0]=-2.3+approach*1.65;
      body.position[1]=.85-approach*.6;
      body.position[2]=.4;
      body.radius=.23;
      body.color[0]=230;body.color[1]=100;body.color[2]=45;
      body.color[3]=255*alpha;
    } else {
      body.position[0]=Math.cos(orbit)*1.45;
      body.position[1]=Math.sin(orbit)*.38+.25;
      body.position[2]=Math.sin(orbit)*1.1;
      body.radius=.22*formed;
      body.color[0]=230;body.color[1]=130+formed*65;body.color[2]=60+formed*115;
      body.color[3]=255*alpha*formed;
    }
    const ring=Math.max(0,Math.min(1,elapsed/3))*(1-formed);
    for(let i=0;i<debris.length;i++) {
      const p=debris[i], angle=i*2.399963+elapsed*(.15+(i%7)*.004);
      const r=1.18+(i%13)/35;
      p.position[0]=Math.cos(angle)*r;
      p.position[1]=Math.sin(angle)*r*.32;
      p.position[2]=Math.sin(angle)*r*.94;
      // Visually gather the dispersing ring into the growing Moon.
      const gather=formed*formed*formed;
      for(let axis=0;axis<3;axis++) p.position[axis]+=(body.position[axis]-p.position[axis])*gather;
      p.radius=.006+(i%5)*.002;
      p.color[3]=220*ring*alpha;
    }
    const common={coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,radiusUnits:'meters',
      getPosition:position,getFillColor:color,getRadius:radius,pickable:false,
      updateTriggers:{getPosition:time,getFillColor:[time,globeWeight],getRadius:time}};
    // Transparent debris must not write depth and hide the assembling Moon.
    return [new ScatterplotLayer({...common,id:'formation-debris',data:debris,
      parameters:{depthWriteEnabled:false}}),
      new CelestialBodyLayer({...common,id:'formation-moon',data:bodies})];
  };
}
