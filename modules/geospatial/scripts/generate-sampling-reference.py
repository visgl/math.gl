#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original independent normal-coordinate surface quadrature; not the production parametric rejection formula.
import argparse,hashlib,json,math
from pathlib import Path
DEST=Path(__file__).resolve().parents[1]/'test/sampling-reference.json'
def nodes(order):
 result=[]
 for i in range(1,order+1):
  x=math.cos(math.pi*(i-.25)/(order+.5))
  for _ in range(30):
   p,q=1.,0.
   for j in range(1,order+1):p,q=((2*j-1)*x*p-(j-1)*q)/j,p
   derivative=order*(x*p-q)/(x*x-1);step=p/derivative;x-=step
   if abs(step)<2e-16:break
  result.append((x,2/((1-x*x)*derivative*derivative)))
 return result
def moments(axes,n):
 scale=max(axes);r=[x/scale for x in axes];product=math.prod(r)**2;total=0.;sums=[0.,0.,0.]
 angles=[(math.cos(2*math.pi*(j+.5)/(4*n)),math.sin(2*math.pi*(j+.5)/(4*n))) for j in range(4*n)]
 for z,w in nodes(n):
  radius=math.sqrt((1-z)*(1+z))
  for c,s in angles:
   normal=[radius*c,radius*s,z];h=sum(r[i]**2*normal[i]**2 for i in range(3));weight=w*product/(h*h)
   total+=weight
   for i in range(3):sums[i]+=weight*r[i]**2*normal[i]**2/h
 return dict(area=total*2*math.pi/(4*n)*scale*scale,normalizedSecondMoments=[x/total for x in sums])
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();rows=[]
 for axes in [[1,1,1],[4,2,1],[1,4,2],[3,3,1],[3,1,1]]:
  low=moments(axes,64);high=moments(axes,128)
  assert abs(low['area']-high['area'])/high['area']<1e-10
  assert max(abs(x-y) for x,y in zip(low['normalizedSecondMoments'],high['normalizedSecondMoments']))<1e-10
  rows.append(dict(axes=axes,**high))
 data=dict(provenance=dict(generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),method='Independent Gauss-map area measure 1/K; 64/128 Gauss-Legendre by 256/512 periodic longitude convergence'),rows=rows)
 if a.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==data['provenance'];assert len(stored['rows'])==len(rows)
  for expected,actual in zip(stored['rows'],rows):
   assert expected['axes']==actual['axes']
   assert abs(expected['area']-actual['area'])<1e-10*actual['area']
   assert max(abs(x-y) for x,y in zip(expected['normalizedSecondMoments'],actual['normalizedSecondMoments']))<1e-11
 else:DEST.write_text(json.dumps(data,indent=2)+'\n')
 print('Independent surface moment controls:',len(rows))
if __name__=='__main__':main()
