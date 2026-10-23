#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Offline C++ 2.7 and independent 80-digit integral/spherical controls.
No third-party Python packages. --check verifies provenance and recomputes independent controls.
--oracle builds native rows with the companion driver against pinned r2.7 (see docs).
"""
import argparse
from decimal import Decimal as D, getcontext
import hashlib
import json
import math
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
DEST = HERE.parents[1] / 'test/ellipsoid/g34-reference.json'
ARCHIVE_SHA = '5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5'
getcontext().prec = 80
EPS = D('1e-76')

def atan(x):
    if x < 0: return -atan(-x)
    if x > 1: return PI/2 - atan(1/x)
    for _ in range(5): x = x / (1 + (1+x*x).sqrt())
    total = term = x
    for k in range(1, 500):
        term *= -x*x
        delta = term / (2*k+1)
        total += delta
        if abs(delta) < EPS: break
    return total * 32

PI = 16*atan(D(1)/5) - 4*atan(D(1)/239)

def sc(x):
    s, c, ts, tc = x, D(1), x, D(1)
    for k in range(1, 200):
        ts *= -x*x / ((2*k)*(2*k+1)); tc *= -x*x / ((2*k-1)*(2*k))
        s += ts; c += tc
        if max(abs(ts),abs(tc)) < EPS: break
    return s,c

def rule(n):
    result=[]
    for i in range(n):
        x=D.from_float(math.cos(math.pi*(i+.75)/(n+.5)))
        for _ in range(20):
            p, prev = D(1), D(0)
            for k in range(1,n+1): p,prev=((2*k-1)*x*p-(k-1)*prev)/k,p
            dp=n*(x*p-prev)/(x*x-1)
            delta=p/dp; x-=delta
            if abs(delta)<EPS: break
        result.append((x,2/((1-x*x)*dp*dp)))
    return result
RULE=rule(48)

def integral(fn, end):
    total=D(0)
    for j in range(4):
        h=end/8; mid=(2*j+1)*h
        total+=h*sum(w*fn(mid+h*x) for x,w in RULE)
    return total

def independent():
    rows=[]
    for ratio in [.5,.9966471893352525,1.,1.00000000000001,2.]:
        r=D.from_float(ratio); e2=1-r*r
        def I(s):
            if e2==0:return s
            e=abs(e2).sqrt()
            return (((1+e*s)/(1-e*s)).ln()/2 if e2>0 else atan(e*s))/e
        qp=1+r*r*I(D(1))
        def M(t):
            s,c=sc(t); return r*r/(c*c+r*r*s*s)**D('1.5')
        quarter=integral(M,PI/2)
        for phi in [0.,1e-9,12.5,45.,78.,89.999999,90.]:
            t=D.from_float(phi)*PI/180; s,c=sc(t)
            if phi==90:s,c=D(1),D(0)
            meridian=integral(M,t)
            if phi==90: aux=[90.]*5+[None]
            else:
                theta=atan(r*r*s/c)*180/PI
                beta=atan(r*s/c)*180/PI
                mu=meridian/quarter*90
                q=r*r*(s/(c*c+r*r*s*s)+I(s)); x=q/qp
                xi=atan(x/(1-x*x).sqrt())*180/PI
                psi=((s/c)+(1+(s/c)**2).sqrt()).ln()-e2*I(s)
                chi=atan(((psi.exp()-(-psi).exp())/2))*180/PI
                aux=list(map(float,[theta,beta,mu,xi,chi,psi*180/PI]))
            n=1/(c*c+r*r*s*s).sqrt()
            azi=D(37)*PI/180; sa,ca=sc(azi)
            rows.append(dict(ratio=ratio,latitude=phi,metrics=list(map(float,[2*PI*qp,4*PI*r/3,quarter,meridian,M(t),n,1/(ca*ca/M(t)+sa*sa/n)])),auxiliary=aux))
    sphere=[]
    for delta in [90.,30.,1.,.01,.0001,.0000001]:
        t=D.from_float(delta)*PI/180; s,c=sc(t)
        area=2*atan((s/(1+c))**2)
        hyp=atan((1-c**4).sqrt()/(c*c)) if c!=0 else PI/2
        sphere.append(dict(delta=delta,area=float(area),perimeter=float(2*t+hyp)))
    x,y=D(20)*PI/180,D(10)*PI/180
    sx,cx=sc(x);sy,cy=sc(y);c=cx*cy
    sphere.append(dict(delta=10.,longitudeDelta=20.,area=float(2*atan((sx/(1+cx))*(sy/(1+cy)))),perimeter=float(x+y+atan((1-c*c).sqrt()/c))))
    return dict(metrics=rows,sphere=sphere)

def native_inputs():
    metrics=[]; edges=[]; polygons=[]; directs=[]
    lats=[-90.,-89.999999999,-78.,-45.,-1e-9,-0.,1e-9,12.5,45.,78.,89.999999999,90.]
    for r in [.5,.9966471893352525,1.,1-2**-40,1+2**-40,1.01,2.]:
        for a in [1e-30,1.,6378137.,1e30]:
            for lat in lats: metrics.append(dict(a=a,b=a*r,latitude=lat))
    shapes=[(1.,1.),(6378137.,6356752.314245179),(6378137.,6378137.*1.01)]
    points=[(0,0,0,180),(0,0,1e-7,1e-7),(40,-75,35,140),(89,170,89,-170),(-90,-180,90,180),(-50,-179,70,179),(0,180,0,360),(0,-180,0,-360)]
    paths=[[[0,0,0],[0,0,90],[0,90,0]],[[0,89,0],[0,89,120],[0,89,-120]],
        [[0,10,179],[0,10,-179],[0,-10,-179],[0,-10,179]],
        [[0,0,0],[0,10,10],[0,0,10],[0,10,0]],[[0,1,1]],[],
        [[0,0,0],[0,0,180],[0,0,360]],[[0,0,-180],[0,0,-360],[0,0,-540]],
        [[0,0,0],[0,0,1e-7],[0,1e-7,0]],
        [[0,35,179],[1,37,None],[1,-100,None],[1,80,None]],
        [[0,0,0],[1,90,None],[1,0,None],[1,-90,None]],
        [[0,0,0]]+[[0,0,.00001],[0,.00001,0],[0,0,0]]*1000]
    for a,b in shapes:
        for p in points: edges.append(dict(a=a,b=b,point=p))
        for lat,lon,azi in [(0,0,45),(40,179,-70),(89.999999,-180,170),(-90,20,30)]:
            for distance in [1e-9*a,1e-8*a,-.2*a,8*math.pi*a]:
                directs.append(dict(a=a,b=b,point=[lat,lon,azi,distance]))
        for index,path in enumerate(paths):
            ops=[o[:] for o in path]
            for i,o in enumerate(ops):
                if o[2] is None:o[2]=a*([math.pi*8+.2,-.3,1.2][(i-1)%3] if index==9 else [math.pi*8,math.pi/2,math.pi][(i-1)%3])
            for line,reverse,unsigned in [(False,False,False),(False,True,False),(False,False,True),(True,False,False)]:
                polygons.append(dict(a=a,b=b,ops=ops,polyline=line,reverse=reverse,unsigned=unsigned))
    # Both directions across negative 360/720 cuts, translated by whole circuits.
    for a,b in shapes:
        for shift in range(-1440,1441,360):
            for direction in [-1,1]:
                lon=(-350 if direction<0 else -370)+shift
                ops=[[0,0,lon],[1,direction*90,20*math.pi/180*a],[0,10,lon]]
                for line,reverse,unsigned in [(False,False,False),(False,True,False),(False,False,True),(True,False,False)]:
                    polygons.append(dict(a=a,b=b,ops=ops,polyline=line,reverse=reverse,unsigned=unsigned,longitudeShift=shift,direction=direction))
    return metrics,edges,polygons,directs

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def safe(v):return float(v) if math.isfinite(float(v)) else None

def generate(oracle):
    version,bits=subprocess.check_output([oracle,'--version'],text=True).split()
    assert version=='2.7'
    metrics,edges,polygons,directs=native_inputs()
    lines=[]
    for r in metrics:lines.append(f"M {r['a']!r} {r['b']!r} {r['latitude']!r}")
    for r in edges:lines.append('E '+ ' '.join(map(str,[r['a'],r['b'],*r['point']])))
    for r in polygons:lines.append('P '+' '.join(map(str,[r['a'],r['b'],int(r['polyline']),int(r['reverse']),int(not r['unsigned']),len(r['ops']),*[v for o in r['ops'] for v in o]])))
    for r in directs:lines.append('D '+' '.join(map(str,[r['a'],r['b'],*r['point']])))
    out=subprocess.run([oracle],input='\n'.join(lines)+'\n',text=True,capture_output=True,check=True).stdout.splitlines()
    assert len(out)==len(lines)
    for r,line in zip(metrics+edges+polygons+directs,out):r['expected']=list(map(safe,line.split()))
    for r in edges:
        if r['point']==(0,0,1e-7,1e-7):
            t=D.from_float(1e-7)*PI/180
            r['independentArea']=float(D.from_float(r['b'])**2*t*t/2)
    for index,r in enumerate(polygons):
        path=(index//4)%12
        if index<144 and path in [8,11]:
            t=D.from_float(1e-7 if path==8 else .00001)*PI/180
            value=D.from_float(r['b'])**2*t*t/2*(1 if path==8 else 1000)
            r['independentArea']=float(-value if r['reverse'] else value)
    for r in directs:
        if r['point'][0]==0 and abs(r['point'][3])<=1e-8*r['a']:
            r['independentArea']=float(D.from_float(r['point'][3])**2/4)
        if 89<abs(r['point'][0])<90 and abs(r['point'][3])<1e-6*r['a']:
            r['exactDiagnostic']='Near-pole distance inversion amplifies Exact phase rounding; series and independent sphere controls remain gated'
            if r['a']==r['b']:
                phi=D.from_float(r['point'][0])*PI/180
                azi=D.from_float(r['point'][2])*PI/180
                delta=D.from_float(r['point'][3])/D.from_float(r['a'])
                sp,cp=sc(phi); sa,ca=sc(azi); sd,cd=sc(delta)
                salp0=cp*sa
                num=salp0*(cp*ca*(1-cd)+sp*sd)
                den=salp0*salp0+cp*ca*(cp*ca*cd-sp*sd)
                value=atan(num/den)
                if den<0:value+=PI if num>=0 else -PI
                r['independentArea']=float(D.from_float(r['a'])**2*value)
    native=dict(metrics=metrics,edges=edges,polygons=polygons,directs=directs)
    return dict(provenance=dict(oracle='GeographicLib C++ 2.7 r2.7, series and elliptic-integral Exact',archiveSha256=ARCHIVE_SHA,precision=f'GEOGRAPHICLIB_PRECISION=3; actual significand bits={bits}',nativeSha256=hashlib.sha256(json.dumps(native,sort_keys=True).encode()).hexdigest(),driverSha256=digest(HERE/'geographiclib-g34-oracle.cpp'),generatorSha256=digest(Path(__file__))),independent=independent(),**native)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--oracle');p.add_argument('--archive');p.add_argument('--check',action='store_true');args=p.parse_args()
    if args.oracle:
        assert args.archive and digest(Path(args.archive))==ARCHIVE_SHA, 'Pass the pinned --archive to verify source provenance'
        data=generate(args.oracle)
        if args.check:assert json.loads(DEST.read_text())==json.loads(json.dumps(data))
        else:
            chunks=['  '+json.dumps(k)+': '+json.dumps(data[k],separators=(',',':'),allow_nan=False) for k in ['provenance','independent']]
            for k in ['metrics','edges','polygons','directs']:
                chunks.append('  '+json.dumps(k)+': [\n'+',\n'.join('    '+json.dumps(r,separators=(',',':'),allow_nan=False) for r in data[k])+'\n  ]')
            DEST.write_text('{\n'+',\n'.join(chunks)+'\n}\n')
    else:
        data=json.loads(DEST.read_text())
        assert data['provenance']['driverSha256']==digest(HERE/'geographiclib-g34-oracle.cpp')
        assert data['provenance']['generatorSha256']==digest(Path(__file__))
        assert data['independent']==independent()
        native={key:data[key] for key in ['metrics','edges','polygons','directs']}
        assert data['provenance']['nativeSha256']==hashlib.sha256(json.dumps(native,sort_keys=True).encode()).hexdigest()
        for key,rows in zip(['metrics','edges','polygons','directs'],native_inputs()):
            assert [{k:v for k,v in r.items() if k not in ['expected','independentArea','exactDiagnostic']} for r in data[key]]==json.loads(json.dumps(rows))
    print('G3–G4 reference provenance, workloads and independent controls verified')
