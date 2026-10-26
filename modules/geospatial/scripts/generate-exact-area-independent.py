#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original Decimal analytic area controls; no production quadrature or GeographicLib calculations.
import argparse, hashlib, json
from decimal import Decimal as D, localcontext
from pathlib import Path
DEST=Path(__file__).resolve().parents[1]/'test/exact-area-independent.json'
def atan(x):
 sign=-1 if x<0 else 1;x=abs(x);factor=1
 while x>D('.1'):x=x/(1+(1+x*x).sqrt());factor*=2
 term=x;total=x;n=1
 while abs(term)>D('1e-115'):
  term*=-x*x;total+=term/D(2*n+1);n+=1
 return total*factor*sign
def sine(x):
 term=x;total=x;n=1
 while abs(term)>D('1e-115'):
  term*=-x*x/D(2*n*(2*n+1));total+=term;n+=1
 return total
def controls():
 with localcontext() as ctx:
  ctx.prec=120;pi=16*atan(D(1)/5)-4*atan(D(1)/239);rows=[]
  for ratio in ['.25','.5','.8','1','1.25','2','4']:
   b=D(ratio);e2=1-b*b
   if e2==0:area=4*pi
   elif e2>0:
    e=e2.sqrt();area=2*pi*(1+b*b*((1+e)/(1-e)).ln()/(2*e))
   else:
    e=(-e2).sqrt();area=2*pi*(1+b*b*atan(e)/e)
   rows.append(dict(mode='lune',ratio=float(b),degrees=10,expected=float(area/72)))
   for degrees in ['.0001','.000001','.0000001']:
    delta=D(degrees)*pi/180
    rows.append(dict(mode='tiny',ratio=float(b),degrees=float(degrees),expected=float(b*b*delta*delta/2)))
    rows.append(dict(mode='edge',ratio=float(b),distance=float(delta),expected=float(delta*delta/4)))
  for degrees in ['45','1','.0001','.0000001']:
   delta=D(degrees)*pi/180;t=sine(delta/2)/sine(pi/2-delta/2)
   rows.append(dict(mode='sphere',ratio=1,degrees=float(degrees),expected=float(2*atan(t*t))))
  for ratio in [.25,1,4]:
   for latitude in [-90,90]:
    for arc in [-720,-360,360,720]:rows.append(dict(mode='polar',ratio=ratio,latitude=latitude,arc=arc,expected=0))
  return rows
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
data=dict(provenance=dict(precisionDigits=120,generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()),rows=controls())
if args.check:assert json.loads(DEST.read_text())==data
else:DEST.write_text(json.dumps(data,indent=2)+'\n')
print('Independent exact-area controls:',len(data['rows']))
