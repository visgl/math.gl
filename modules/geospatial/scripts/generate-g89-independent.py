#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original Decimal elliptic-quarter series and independent near-equator elliptic-series controls.
import argparse
from decimal import Decimal as D, localcontext
import hashlib
import json
from pathlib import Path
DEST=Path(__file__).resolve().parents[1]/'test/g89-independent.json'
def atan(x):
 s=x;t=x
 for n in range(1,1000):
  t*=-x*x;v=t/(2*n+1);s+=v
  if abs(v)<D('1e-130'):return s
 raise ValueError('atan convergence')
def sincos(x):
 s=x;c=D(1);ts=x;tc=D(1)
 for n in range(1,500):
  ts*=-x*x/((2*n)*(2*n+1));tc*=-x*x/((2*n-1)*(2*n));s+=ts;c+=tc
  if max(abs(ts),abs(tc))<D('1e-130'):return s,c
 raise ValueError('trig convergence')
def generate():
 quarters=[];near=[]
 with localcontext() as ctx:
  ctx.prec=150;pi=16*atan(D(1)/5)-4*atan(D(1)/239)
  for a,b in [[1.,1.],[1.,.25],[1.,.5],[1.,.8],[1.,1.25],[1.,2.],[1.,4.],[3.,2.],[3.,1.],[4.,1.],[4.,2.]]:
   major=max(D.from_float(a),D.from_float(b));minor=min(D.from_float(a),D.from_float(b));m=1-(minor/major)**2
   central=D(1);power=D(1);total=D(1)
   for n in range(1,8000):
    central*=D(2*n-1)/(2*n);power*=m;term=central*central*power/(2*n-1);total-=term
    if abs(term)<D('1e-125'):break
   else:raise ValueError('elliptic series convergence')
   quarters.append(dict(axes=[a,b],quarter=float(major*pi/2*total)))
  # Independent convergent binomial/geometric elliptic series for this
  # near-equatorial profile. No production quadrature or native inverse is used.
  def general_atan(x):
   if x<0:return -general_atan(-x)
   if x>1:return pi/2-general_atan(1/x)
   factor=D(1)
   while x>D('.2'):x=x/(1+(1+x*x).sqrt());factor*=2
   return factor*atan(x)
  def atan2(y,x):
   return pi/2 if x==0 else general_atan(y/x)+(pi if x<0 else 0)
  for b in [1.25,2.,4.]:
   ratio=D.from_float(b);lat=D.from_float(.00001)*pi/180;lam=D.from_float(179.999)*pi/180
   sp,cp=sincos(lat);sb=ratio*sp/(cp*cp+ratio*ratio*sp*sp).sqrt();ep2=1/(ratio*ratio)-1
   powers=[D(1)]
   while powers[-1]>D('1e-135'):powers.append(powers[-1]*(-ep2))
   ec=[D(1)];dc=[D(1)]
   for j in range(1,9):ec.append(ec[-1]*(D('.5')-(j-1))/j);dc.append(dc[-1]*(D('-.5')-(j-1))/j)
   sigma=lam/ratio
   def evaluate(sigma):
    sn,cn=sincos(sigma);ca=sb/sn;sa=(1-ca*ca).sqrt();k2=ep2*ca*ca;dn=(1+ep2*sb*sb).sqrt()
    moments=[sigma];power=sn
    for n in range(1,len(powers)+10):
     moments.append(D(2*n-1)/(2*n)*moments[-1]-power*cn/(2*n));power*=sn*sn
    E=sum(ec[j]*k2**j*moments[j] for j in range(9))
    J=k2*sum(dc[j]*k2**j*moments[j+1] for j in range(9))
    H=sum(dc[j]*k2**j*sum(w*(moments[n+j]-moments[n+j+1]) for n,w in enumerate(powers)) for j in range(9))
    longitude=atan2(sa*sn,ratio*dn*cn)-(1-ratio*ratio)/ratio*sa*H
    return longitude,E,J,sn,cn,ca,sa,dn
   for _ in range(20):
    value=evaluate(sigma);residual=value[0]-lam
    if abs(residual)<D('1e-80'):break
    sigma-=residual/ratio
   else:raise ValueError('near-equator reference convergence')
   longitude,E,J,sn,cn,ca,sa,dn=value
   expected=[.00001,179.999,float(atan2(sa,ca)*180/pi),float(atan2(sa,ca*cn)*180/pi),float(ratio*E),
    float(ratio*(dn*sn-cn*J)),float(cn),float(cn+J*sn/dn),float(sigma*180/pi)]
   near.append(dict(ratio=b,expected=expected))
 return dict(provenance=dict(generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),precision=150),quarters=quarters,nearEquator=near)
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();data=generate()
 if a.check:assert json.loads(DEST.read_text())==data;print('G8/G9 independent controls passed')
 else:DEST.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')
if __name__=='__main__':main()
