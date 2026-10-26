#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original binary64 inputs, native controls and independent Decimal potential/finite-difference gradient oracle.
import argparse,hashlib,json,subprocess
from decimal import Decimal,localcontext
from pathlib import Path
HERE=Path(__file__).resolve().parent;DEST=HERE.parent/'test/normal-gravity-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def models():
 return [dict(semiMajorAxis=a,flattening=f,gravitationalParameter=gm,angularVelocity=w) for a,f,gm,w in [(6378137.,1/298.257223563,3.986004418e14,7.292115e-5),(6378137.,1/298.257222101,3.986005e14,7.292115e-5),(2.,0.,8.,0.),(2.,0.,8.,.1),(1e6,.02,1e11,1e-5),(1e6,1e-10,1e11,0.)]]
def inputs():
 return [dict(model=m,latitude=lat,longitude=lon,height=h*m['semiMajorAxis']) for m in models() for lat in [-90.,-89.999999,-60.,-1.,-0.,0.,30.,45.,89.999999,90.] for lon in [-180.,30.,90.] for h in [0.,.001,1.,100.]]
def independent_inputs():
 return [dict(model=m,position=[float(x) for x in xyz]) for m in models() for xyz in [(m['semiMajorAxis'],0,0),(0,0,m['semiMajorAxis']*(1-m['flattening'])),(m['semiMajorAxis'],)*3,(1.5*m['semiMajorAxis'],-.4*m['semiMajorAxis'],.6*m['semiMajorAxis']),(3*m['semiMajorAxis'],-4*m['semiMajorAxis'],2*m['semiMajorAxis']),(100*m['semiMajorAxis'],0,0)]]
def d(x):return Decimal.from_float(float(x))
def atan(x):
 term=x;total=x
 for n in range(1,160):term*=-x*x;total+=term/(2*n+1)
 return total
def potential(m,xyz):
 a,f,gm,w=(d(m[k]) for k in ['semiMajorAxis','flattening','gravitationalParameter','angularVelocity']);x,y,z=xyz;b=a*(1-f);e2=a*a-b*b;r2=x*x+y*y+z*z
 u=((r2-e2+((r2-e2)**2+4*e2*z*z).sqrt())/2).sqrt();sb=z/u
 if e2:
  e=e2.sqrt()
  def q(v):return ((1+3*v*v/e2)*atan(e/v)-3*v/e)/2
  ratio=q(u)/q(b);mono=gm*atan(e/u)/e
 else:ratio=(b/u)**3;mono=gm/u
 v=mono+w*w*a*a*ratio*(sb*sb-Decimal(1)/3)/2
 return v+w*w*(x*x+y*y)/2

def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
 provenance=dict(version='2.7',precisionBits=53,archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',generatorSHA256=sha(Path(__file__)),driverSHA256=sha(HERE/'normal-gravity-reference.cpp'),builderSHA256=sha(HERE/'build-normal-gravity-native.py'))
 rows=inputs();controls=independent_inputs()
 with localcontext() as ctx:
  ctx.prec=110
  for r in controls:
   xyz=list(map(d,r['position']));m=r['model'];step=d(m['semiMajorAxis'])*Decimal('1e-25');gradient=[]
   for axis in range(3):
    low=xyz.copy();high=xyz.copy();low[axis]-=step;high[axis]+=step;gradient.append(float((potential(m,high)-potential(m,low))/(2*step)))
   r['expected']=[float(potential(m,xyz))]+gradient
 if args.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==provenance
  assert [{k:v for k,v in r.items() if k!='expected'} for r in stored['native']]==rows
  assert stored['independent']==controls
 else:
  if not args.native:p.error('--native required')
  meta=json.loads(subprocess.check_output([str(args.native),'--metadata'],text=True));assert all(meta[k]==provenance[k] for k in ['version','precisionBits','driverSHA256'])
  requests=[' '.join(format(v,'.17g') for v in [r['model'][k] for k in ['semiMajorAxis','flattening','gravitationalParameter','angularVelocity']]+[r['latitude'],r['longitude'],r['height']]) for r in rows]
  lines=subprocess.check_output([str(args.native)],input='\n'.join(requests)+'\n',text=True).splitlines();assert len(lines)==len(rows)
  for r,line in zip(rows,lines):r['expected']=list(map(float,line.split()));assert len(r['expected'])==9
  DEST.write_text(json.dumps(dict(provenance=provenance,native=rows,independent=controls),separators=(',',':'),allow_nan=False)+'\n')
 print('Normal gravity:',len(rows),'native controls;',len(controls),'independent Decimal gradients')
if __name__=='__main__':main()
