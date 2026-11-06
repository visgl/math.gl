// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {createInterruptedSinusoidalMap, getMapLayout} from '@math.gl/geospatial/discontinuous';
export const POLAR_CRS='+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +datum=WGS84 +units=m';
export const UTM_CRS='+proj=utm +zone=60 +datum=WGS84 +units=m';
const engine=new FullProjectionEngine();
export const rectangle=(w,s,e,n)=>[[w,s],[e,s],[e,n],[w,n],[w,s]];
const domain=ring=>({polygons:[{outer:ring}]});
const closed=ring=>[...ring,ring[0]];
const radians=Math.PI/180;
export function createSource(name='antarctica') {
  if(!['antarctica','rotated-polar','fiji','utm60','world'].includes(name)) throw new RangeError('Unknown raster');
  const polar=name==='antarctica'||name==='rotated-polar';
  const definition=polar ? POLAR_CRS : name==='utm60' ? UTM_CRS : 'WGS84';
  const projection=engine.createProjection({from:'WGS84',to:definition});
  const bounds=polar ? [-4000000,-4000000,4000000,4000000] : name==='utm60' ? [400000,0,900000,1000000] : name==='fiji' ? [-35,-20,35,20] : [-180,-90,180,90];
  const angle=name==='rotated-polar' ? .4 : name==='fiji' ? Math.PI/6 : 0;
  const center=name==='fiji' ? [180,-15] : [0,0], c=Math.cos(angle),s=Math.sin(angle);
  return {name,definition,bounds,angle,center,width:256,height:256,
    geographicToPixel(p) {return this.coordinateToPixel(projection.project(p));},
    coordinateToPixel(p) {
      let [x,y]=p;
      if(name==='fiji') x+=360*Math.round((180-x)/360);
      x-=center[0];y-=center[1];
      return [(c*x+s*y-bounds[0])/(bounds[2]-bounds[0])*256,(-s*x+c*y-bounds[1])/(bounds[3]-bounds[1])*256];
    },
    pixelToCoordinate(p) {
      const x=bounds[0]+p[0]/256*(bounds[2]-bounds[0]), y=bounds[1]+p[1]/256*(bounds[3]-bounds[1]);
      return [c*x-s*y+center[0],s*x+c*y+center[1]];
    },
    pixelToGeographic(p) {return projection.unproject(this.pixelToCoordinate(p));}
  };
}

/** These are declared, fixture-specific processing charts, not inferred global
 * domains. Their extents conservatively cover the source footprint. */
export function createCharts(sourceName='antarctica', target='world', {center=[0,-50]}={}) {
  const source=createSource(sourceName), row=['antarctica','rotated-polar','fiji','utm60','world'].indexOf(sourceName);
  const base={source,width:source.width,height:source.height,row};
  const make=(id,ring,toGeographic,fromGeographic)=>({...base,id,domain:domain(ring),toGeographic,fromGeographic,
    inverse:p=>source.geographicToPixel(toGeographic(p)),forward:p=>fromGeographic(source.pixelToGeographic(p))});
  if(target==='world') {
    // The polar square lies south of -30 degrees, including after rotation.
    // This conservative footprint avoids evaluating its antipodal singularity.
    const bounds=sourceName==='world' ? [[-180,-90,180,90]] : sourceName==='fiji' ? [[-180,-60,-125,30],[125,-60,180,30]] : sourceName==='utm60' ? [[-180,-5,-170,20],[170,-5,180,20]] : [[-180,-90,180,-25]];
    return bounds.map((b,i)=>make(`world-${i}`,rectangle(...b),p=>p,p=>p[0]>=b[0]&&p[0]<=b[2]?p:[p[0]+360*Math.round(((b[0]+b[2])/2-p[0])/360),p[1]]));
  }
  if(target==='interrupted') {
    if(!['antarctica','rotated-polar'].includes(sourceName)) throw new RangeError('Interrupted fixture requires a polar source grid');
    const map=createInterruptedSinusoidalMap();
    const layout=getMapLayout(map,{maxAngularStep:4,tolerance:.0005});
    return layout.regions.filter(r=>r.id.startsWith('south')).map(region=>{
      const ring=region.outlines[0], chart=make(region.id,closed(ring.slice(0,-1)),
        p=>{const q=map.unprojectPoint(p,region.id);if(!q.length) throw new RangeError('Outside chart');return q[0].position;},
        p=>{const q=map.projectPoint(p,region.id);if(!q) throw new RangeError('Outside chart');return q.position;});
      return {...chart,boundaryTolerance:.001};
    });
  }
  if(!['orthographic','perspective'].includes(target) || !['antarctica','rotated-polar'].includes(sourceName))
    throw new RangeError('Unsupported source/target fixture');
  const [lon,lat]=center;
  if(![lon,lat].every(Number.isFinite)||lat > -25 || lat < -90) throw new RangeError('Polar fixture center must stay south of 25°S');
  const definition=target==='orthographic'
    ? `+proj=ortho +lat_0=${lat} +lon_0=${lon} +R=1`
    : `+proj=tpers +lat_0=${lat} +lon_0=${lon} +R=1 +h=1 +tilt=20 +azi=0`;
  const projection=engine.createProjection({from:'WGS84',to:definition});
  // A slightly interior horizon avoids ambiguous exact-tangent arithmetic.
  // The polygon is an explicitly sampled approximation, with its own error.
  const radius=(target==='orthographic'?Math.PI/2:Math.PI/3)-1e-7;
  const ring=Array.from({length:128},(_,i)=>{
    const bearing=i*2*Math.PI/128, phi=lat*radians, lambda=lon*radians;
    const latitude=Math.asin(Math.sin(phi)*Math.cos(radius)+Math.cos(phi)*Math.sin(radius)*Math.cos(bearing));
    const longitude=lambda+Math.atan2(Math.sin(bearing)*Math.sin(radius)*Math.cos(phi),Math.cos(radius)-Math.sin(phi)*Math.sin(latitude));
    return projection.project([longitude/radians,latitude/radians]).slice(0,2);
  });
  return [make(target,closed(ring),p=>projection.unproject(p).slice(0,2),p=>projection.project(p).slice(0,2))];
}
