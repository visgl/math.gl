#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original independent 220-digit line/quadric silhouette controls; no upstream test data copied.
import argparse
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'modules/geospatial/test/c8-reference.json'
DEST=ROOT/'modules/geospatial/test/c8-contact-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def d(values):return list(map(D.from_float,values))
def generate():
 data=json.loads(SOURCE.read_text());planes=[];rows=[]
 with localcontext() as ctx:
  ctx.prec=220
  base=data['planes'][:]
  for scale in [1e-60,1.,1e60]:
   radii=[2*scale,2*scale,3*scale];r=d(radii)
   for direction in [[1.,0.,0.],[0.,1.,0.],[0.,0.,1.],[.36,.48,.8],[-.48,.36,-.8]]:
    n=d(direction);norm=sum(x*x for x in n).sqrt();n=[x/norm for x in n]
    support=sum((rr*x)**2 for rr,x in zip(r,n)).sqrt()
    anchor=[float(rr*rr*x/support) for rr,x in zip(r,n)]
    n=[x/(rr*rr) for x,rr in zip(d(anchor),r)];norm=sum(x*x for x in n).sqrt();n=[x/norm for x in n]
    h=(n[0]*n[0]+n[1]*n[1]).sqrt();e=[-n[1]/h,n[0]/h,D(0)] if h else [D(0),D(1),D(0)]
    north=[n[1]*e[2]-n[2]*e[1],n[2]*e[0]-n[0]*e[2],n[0]*e[1]-n[1]*e[0]]
    base.append(dict(radii=radii,origin=anchor,footpoint=anchor,basis=list(map(float,e+north+n))))
  for index,plane in enumerate(base):
   geometry=dict(radii=plane['radii'],origin=plane['origin'],anchor=plane['footpoint'],east=plane['basis'][:3],north=plane['basis'][3:6],normal=plane['basis'][6:])
   planes.append(geometry)
   r,o,e,h,n=map(d,[geometry[k] for k in ['radii','anchor','east','north','normal']])
   def dot(x,y):return sum(a*b/(rr*rr) for a,b,rr in zip(x,y,r))
   a=dot(n,n);b0=dot(n,o);c0=dot(o,o)-1
   for direction in [[1.,0.],[0.,1.],[.6,.8]]:
    u,v=d(direction);w=[x*u+y*v for x,y in zip(e,h)]
    b1=dot(n,w);c1=dot(o,w);c2=dot(w,w)
    z0=b0*b0-a*c0;z1=b0*b1-a*c1;z2=b1*b1-a*c2
    boundary=(-z1-(z1*z1-z2*z0).sqrt())/z2
    shifts=[D(k)*D(2)**-52 for k in [-32,-2,-1,0,1,2,32]]+[D('-1e-4'),D('-1e-8'),D('1e-8'),D('1e-4')]
    for shift in shifts:
     local=[float(boundary*(1+shift)*x) for x in [u,v]]
     q=[x+y*D.from_float(local[0])+z*D.from_float(local[1]) for x,y,z in zip(o,e,h)]
     # Exact rational signs avoid a false miss from Decimal cancellation at
     # an exactly tangent line. Coordinates/root evaluation remain 220-digit.
     fr,fo,fe,fh,fn=map(lambda v:list(map(F,v)),[geometry[k] for k in ['radii','anchor','east','north','normal']])
     fq=[x+y*F(local[0])+z*F(local[1]) for x,y,z in zip(fo,fe,fh)]
     def fdot(x,y):return sum(xx*yy/(rr*rr) for xx,yy,rr in zip(x,y,fr))
     fa=fdot(fn,fn);fb=fdot(fn,fq);fc=fdot(fq,fq)-1;disc=fb*fb-fa*fc
     def dec(x):return D(x.numerator)/D(x.denominator)
     a,b,discriminant=map(dec,[fa,fb,disc])
     expected=None
     if discriminant>=0:
      t=(-b+discriminant.sqrt())/a;expected=[float(x+t*y) for x,y in zip(q,n)]
     axis=sum(x!=0 for x in geometry['origin'])==1
     rows.append(dict(plane=index,local=local,expected=expected,public=axis or abs(shift)>=D('1e-4')))
 return dict(provenance=dict(generatorSHA256=sha(Path(__file__)),geometrySHA256=sha(SOURCE),precision=220),planes=planes,rows=rows)
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();data=generate()
 if a.check:assert json.loads(DEST.read_text())==data;print('C8 independent contact controls passed')
 else:DEST.write_text(json.dumps(data,separators=(',',':'),allow_nan=False)+'\n');print('C8 contact rows:',len(data['rows']))
if __name__=='__main__':main()
