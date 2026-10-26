#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original exact-binary64-input Decimal frame/plane controls; no native source or test data copied.
"""Offline standard-library oracle. --check validates stored provenance without native builds."""
import argparse
from decimal import Decimal as D, localcontext
import hashlib
import importlib.util
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
ORACLE = ROOT / 'modules/geospatial/projection/scripts/generate-interior-reference.py'
P0 = ROOT / 'modules/geospatial/projection/test/fixtures/ellipsoid-p0-reference.json'
DEST = ROOT / 'modules/geospatial/test/c8-reference.json'
spec = importlib.util.spec_from_file_location('decimal_nearest', ORACLE)
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(v):
    n=dot(v,v).sqrt()
    return [x/n for x in v]
def f(v): return list(map(float,v))
def d(v): return list(map(D.from_float,v))
def basis(normal):
    up=unit(normal)
    east=unit([-up[1],up[0],D(0)]) if up[0] or up[1] else [D(0),D(1),D(0)]
    return [east,cross(up,east),up]
def rotate(columns,v): return [sum(columns[j][i]*v[j] for j in range(3)) for i in range(3)]
def trig(value):
    x=D.from_float(value);s=x;c=D(1);ts=x;tc=D(1)
    for k in range(1,180):
        ts*=-x*x/D((2*k)*(2*k+1));tc*=-x*x/D((2*k-1)*(2*k));s+=ts;c+=tc
        if max(abs(ts),abs(tc))<D('1e-160'):break
    return s,c
def attitude(columns,hpr):
    sh,ch=trig(-hpr[0]);sp,cp=trig(-hpr[1]);sr,cr=trig(hpr[2])
    local=[[ch*cp,sh*cp,-sp],[ch*sp*sr-sh*cr,sh*sp*sr+ch*cr,cp*sr],[ch*sp*cr+sh*sr,sh*sp*cr-ch*sr,cp*cr]]
    return [float(x) for col in local for x in rotate(columns,col)]
def generate():
    frames=[];planes=[]
    with localcontext() as ctx:
        ctx.prec=180
        shapes=[[1.,1.,1.],[6378137.,6378137.,6356752.314245179],[10.,10.,5.],[1e-60,1e-60,.5e-60],[1e60,1e60,.5e60]]
        directions=[[1.,0.,0.],[0.,0.,1.],[0.,0.,-1.],[.36,.48,.8],[-.48,.36,-.8],[1e-12,.6,.8],[.6e-12,.8e-12,1.],[.6e-12,-.8e-12,-1.],[-1.,1e-12,.3]]
        for radii in shapes:
            r=d(radii);scale=max(r)
            for direction in directions:
                n=unit(d(direction));support=dot([x*y for x,y in zip(r,n)],[x*y for x,y in zip(r,n)]).sqrt()
                for height in [-.05,0.,.25]:
                    origin=f([rr*rr*nn/support+D.from_float(height)*scale*nn for rr,nn in zip(r,n)])
                    ref=oracle.nearest(radii,origin,iterations=600);columns=basis(d(ref['normal']))
                    local=f([scale*D('.125'),-scale*D('.2'),scale*D('.3')]);v=d(local);o=d(origin)
                    forward=f([x+y for x,y in zip(o,rotate(columns,v))])
                    delta=[x-y for x,y in zip(d(forward),o)]
                    inverse=f([dot(col,delta) for col in columns])
                    poses=[dict(angles=a,rotation=attitude(columns,a)) for a in [[0.,0.,0.],[.7,-.9,.4],[-2.4,1.3,1.8],[.7,1.5707963267948966,-.3]]]
                    velocity=[.3,.4,.5];vx=unit(d(velocity));vy=unit(cross(columns[2],vx));vz=cross(vx,vy)
                    frames.append(dict(radii=radii,height=height,origin=origin,basis=[float(x) for col in columns for x in col],local=local,
                        forward=forward,vector=f(rotate(columns,v)),inverse=inverse,poses=poses,velocity=velocity,
                        velocityRotation=[float(x) for col in [vx,vy,vz] for x in col]))
        for radii in shapes+[[3.,2.,1.]]:
            r=d(radii);scale=min(r)
            for direction in directions[:5]:
                n=unit(d(direction));support=sum((rr*nn)**2 for rr,nn in zip(r,n)).sqrt()
                origin=f([rr*rr*nn/support for rr,nn in zip(r,n)])
                ref=oracle.nearest(radii,origin,iterations=600);o=d(ref['footpoint']);columns=basis([x/(rr*rr) for x,rr in zip(o,r)])
                local=f([scale*D('.2'),-scale*D('.15')]);offset=rotate(columns,[*d(local),D(0)]);p=[x+y for x,y in zip(o,offset)]
                radial=[x/sum((y/rr)**2 for y,rr in zip(p,r)).sqrt() for x in p]
                n=columns[2];a=sum((x/rr)**2 for x,rr in zip(n,r));b=sum(x*y/(rr*rr) for x,y,rr in zip(n,p,r));c=sum((x/rr)**2 for x,rr in zip(p,r))-1
                t=(-b+(b*b-a*c).sqrt())/a;normal=[x+t*y for x,y in zip(p,n)]
                planes.append(dict(radii=radii,origin=origin,footpoint=f(o),basis=[float(x) for col in columns for x in col],local=local,
                    tangent=f(p),radial=f(radial),normal=f(normal)))
    native=json.loads(P0.read_text())
    local=[dict(radii=[r['radii'][0],r['radii'][0],r['radii'][1]],input=r['input'],expected=r['expected']) for r in native['cpp']
           if r['mode']=='L' and r['expected'] and r['radii'][1]/r['radii'][0]>=.5 and abs(r['input'][1])<90 and r['input'][2]>=0]
    return dict(frames=frames,planes=planes,nativeLocal=local)
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    provenance=dict(generatorSHA256=sha(Path(__file__)),decimalOracleSHA256=sha(ORACLE),nativeReferenceSHA256=sha(P0),
        method='180-digit Decimal nearest normals and linear algebra; rational normal directions and Taylor sin/cos; stored binary64 inputs',nativeVersion='GeographicLib C++ 2.7',precisionBits=53)
    if args.check:
        data=json.loads(DEST.read_text());assert data['provenance']==provenance
        assert len(data['frames'])==135 and len(data['planes'])==30 and len(data['nativeLocal'])>0
        assert {k:data[k] for k in ['frames','planes','nativeLocal']}==generate()
        print('C8 independent controls and native provenance passed');return
    result=generate();result=dict(provenance=provenance,**result)
    header=json.dumps({'provenance':provenance},indent=2)[:-2]
    for name,rows in result.items():
        if name=='provenance':continue
        header+=',\n  '+json.dumps(name)+': [\n'+',\n'.join('    '+json.dumps(row,separators=(',',':'),allow_nan=False) for row in rows)+'\n  ]'
    DEST.write_text(header+'\n}\n');print({k:len(v) for k,v in result.items() if k!='provenance'})
if __name__=='__main__':main()
