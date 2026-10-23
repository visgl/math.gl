#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Pinned native comparisons plus independently computed 80-digit rhumb integrals.
No Python dependencies; --check recomputes independent controls and verifies provenance.
Native inputs are original deterministic workloads. See G5/G6 documentation.
"""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import random
import subprocess
from decimal import Decimal as D
HERE=Path(__file__).resolve().parent
DEST=HERE.parents[1]/'test/ellipsoid/g56-reference.json'
spec=importlib.util.spec_from_file_location('independent',HERE/'generate-g34-reference.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)

def independent():
    rows=[]
    for ratio in [.5,.9966471893352525,1.,1.01,2.]:
        r=D.from_float(ratio); e2=1-r*r
        def I(s):
            if e2==0:return s
            e=abs(e2).sqrt()
            return (((1+e*s)/(1-e*s)).ln()/2 if e2>0 else h.atan(e*s))/e
        def psi(phi):
            s,c=h.sc(phi)
            return ((1+s)/c).ln()-e2*I(s)
        def M(phi):
            s,c=h.sc(phi);return r*r/(c*c+r*r*s*s)**D('1.5')
        def F(phi):
            s,c=h.sc(phi);return r*r*(s/(c*c+r*r*s*s)+I(s))/2
        def P(phi):
            s,c=h.sc(phi);return r*r/(c*(c*c+r*r*s*s))
        for p,q,dl in [(0.,12.5,20.),(-45.,60.,70.),(78.,78.1,.01),(1e-9,2e-9,3e-9),(45.,45.,.00001),(89.999999,89.999999,170.),(-12.,-12.,360.),(0.,0.,2**-45),(45.,45.,2**-45)]:
            x=D.from_float(p)*h.PI/180;y=D.from_float(q)*h.PI/180;lam=D.from_float(dl)*h.PI/180
            if p==q:
                distance=abs(lam*M(x)/P(x));area=lam*F(x);azi=90.
            else:
                dm=h.integral(M,y)-h.integral(M,x);dp=psi(y)-psi(x)
                distance=(dm*dm+(lam*dm/dp)**2).sqrt()
                area=lam*(h.integral(lambda t:F(t)*P(t),y)-h.integral(lambda t:F(t)*P(t),x))/dp
                azi=float(h.atan(lam/dp)*180/h.PI)
            rows.append(dict(ratio=ratio,point=[p,0.,q,dl],expected=list(map(float,[distance,azi,area]))))
    return rows

def independent_direct():
    rows=[]
    paths=[[lat,89.999999,d] for lat,d in [(89.999999,1e-9),(-89.999999,1e-9),(90-2**-46,1e-17),(-90+2**-46,1e-17)]]
    paths += [[sign*lat,45. if sign*direction>0 else 135.,direction*d] for lat,d in [(0.,2.2214414443965),(60.,.7404804797988333),(80.,.2468268265996111)] for sign in [-1,1] for direction in [-1,1]]
    for lat,az,distance in paths:
        phi=D.from_float(lat)*h.PI/180;azi=D.from_float(az)*h.PI/180;d=D.from_float(distance)
        sa,ca=h.sc(azi);p2=phi+d*ca
        def psi(p):
            s,c=h.sc(p);return ((1+s)/c).ln()
        dp=psi(p2)-psi(phi);lon=sa/ca*dp
        c1=h.sc(phi)[1];c2=h.sc(p2)[1]
        area=sa/ca*(c1/c2).ln()
        rows.append(dict(path=[lat,0.,az,distance],expected=list(map(float,[p2*180/h.PI,lon*180/h.PI,area]))))
    for ratio in [.5,.9966471893352525,1.01,2.]:
        for a in [1e-100,1.,6378137.,1e100]:
            for sign in [-1,1]:
                b=a*ratio;r=D.from_float(b)/D.from_float(a);e2=1-r*r
                theta1=h.PI/3
                def density(t):
                    c,s=h.sc(t);return r*r/(c*c+r*r*s*s)**D('1.5')
                az=45. if sign>0 else 135.;sa,ca=h.sc(D.from_float(az)*h.PI/180)
                distance=float(D.from_float(a)*(h.integral(density,theta1)-D('1e-8'))/abs(ca))
                target=h.integral(density,theta1)-D.from_float(distance)/D.from_float(a)*abs(ca)
                theta2=target*r
                for _ in range(8):theta2-=(h.integral(density,theta2)-target)/density(theta2)
                def values(t):
                    c,s=h.sc(t);den=c*c+r*r*s*s;e=abs(e2).sqrt()
                    I=s if e==0 else ((((1+e*s)/(1-e*s)).ln()/2 if e2>0 else h.atan(e*s))/e)
                    return ((1+s)/c).ln()-e2*I,r*r*(s/den+I)/2,r*r/(c*den)
                p1=values(theta1)[0];p2=values(theta2)[0]
                e=abs(e2).sqrt();I=(((1+e)/(1-e)).ln()/2 if e2>0 else h.atan(e))/e
                pole=r*r*(1/(r*r)+I)/2
                correction=h.integral(lambda t:(values(t)[1]-pole)*values(t)[2],theta1)-h.integral(lambda t:(values(t)[1]-pole)*values(t)[2],theta2)
                area=D.from_float(a)**2*sa/ca*(pole*(p2-p1)+correction)
                rows.append(dict(a=a,b=b,path=[sign*30.,0.,az,distance],expected=list(map(float,[sign*(90-theta2*180/h.PI),sign*sa/ca*(p2-p1)*180/h.PI,area]))))
    return rows

POLAR_RULE=h.rule(12)

def polar_direct(row):
    # On this tiny polar interval (theta < 2e-8), 12-node Gauss error is
    # far below 80-digit rounding; use a distinct rule from production.
    def quad(fn,end):return end/2*sum(w*fn(end*(1+x)/2) for x,w in POLAR_RULE)
    a=D.from_float(row['a']);r=D.from_float(row['b'])/a;e2=1-r*r
    lat,lon,azi,distance=map(D.from_float,row['path']);sign=D(1) if lat>0 else D(-1)
    theta1=(90-abs(lat))*h.PI/180;sa,ca=h.sc(azi*h.PI/180);d=distance/a
    def M(theta):
        c,s=h.sc(theta);return r*r/(c*c+r*r*s*s)**D('1.5')
    target=quad(M,theta1)-sign*d*ca;theta2=theta1-sign*d*ca*r
    for _ in range(20):
        step=(quad(M,theta2)-target)/M(theta2);theta2-=step
        if abs(step)<D('1e-74'):break
    def values(t):
        theta=theta1+t*(theta2-theta1);c,s=h.sc(theta);den=c*c+r*r*s*s
        p=r*r/(c*den);e=abs(e2).sqrt()
        I=s if e==0 else ((((1+e*s)/(1-e*s)).ln()/2 if e2>0 else h.atan(e*s))/e)
        F=r*r*(s/den+I)/2
        return M(theta),p,F
    meanM=quad(lambda t:M(theta1+t*(theta2-theta1)),D(1))
    def P(t):
        c,s=h.sc(theta1+t*(theta2-theta1));return r*r/(c*(c*c+r*r*s*s))
    meanP=quad(P,D(1))
    def FP(t):
        v=values(t);return v[1]*v[2]
    meanF=quad(FP,D(1))/meanP
    delta=d*sa*meanP/meanM
    return list(map(float,[sign*(90-theta2*180/h.PI),lon+delta*180/h.PI,sign*a*a*delta*meanF]))

def workloads():
    rng=random.Random(560627)
    inverse=[];direct=[];polygons=[];intersections=[]
    for ratio in [.5,.99,.9966471893352525,1.,1.00000000000001,1.01,2.]:
        for a in [1.,6378137.]:
            for point in [[0,0,0,170],[0,180-2**-45,0,-180],[0,-180,0,180-2**-45],[45,180-2**-45,45,-180],[45,-180,45,180-2**-45],[45,170,45,-170],[-80,0,80,179],[89.999999,1,89.999999,-170],[89.99,0,89.999999,120],[1e-9,0,2e-9,3e-9],[-10,180,-10,-180]]+[[rng.uniform(-85,85),rng.uniform(-180,180),rng.uniform(-85,85),rng.uniform(-180,180)] for _ in range(12)]:
                inverse.append(dict(a=a,b=a*ratio,point=point))
            for path in [[0,0,90,.1],[89.999999,0,89.999999,1e-9],[-89.999999,0,90.000001,1e-9],[89.999999,0,89.999999,-1e-9],[45,170,90,.2],[-20,30,0,.1],[78,45,-135,-.01],[0,0,37,1e-16]]+[[rng.uniform(-70,70),rng.uniform(-180,180),rng.uniform(-180,180),rng.uniform(-.1,.1)] for _ in range(7)]:
                direct.append(dict(a=a,b=a*ratio,path=path[:3]+[path[3]*a]))
            for points in [[[0,0],[0,90],[45,90],[45,0]],[[80,170],[82,-160],[78,-120]],[[.00001,.00001],[.00001,.00002],[.00002,.00002],[.00002,.00001]]]:
                polygons.append(dict(a=a,b=a*ratio,points=points))
    for ratio in [.99,.9966471893352525,1.,1.01]:
        for paths in [[[0,-30,90],[-20,0,0]],[[45,-100,30],[-20,80,-60]],[[89,0,160],[88,100,-30]]]+[[[rng.uniform(-80,80),rng.uniform(-180,180),rng.uniform(-180,180)] for _ in range(2)] for _ in range(8)]:
            intersections.append(dict(a=1.,b=ratio,paths=paths,maxDistance=7.,origin=[0.,0.]))
    for row in direct:
        if abs(row['path'][0])>89 and abs(row['path'][3]/row['a'])<1e-8:
            row['independentExpected']=polar_direct(row)
    return inverse,direct,polygons,intersections

def provenance():
    return dict(version='2.7',precisionBits=53,archiveSHA256=h.ARCHIVE_SHA,sourceSHA256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__).resolve(),HERE/'generate-g34-reference.py',HERE/'geographiclib-g56-oracle.cpp']})

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--oracle');parser.add_argument('--archive');parser.add_argument('--check',action='store_true');args=parser.parse_args()
    inv,direct,polygons,intersections=workloads()
    data=dict(provenance=provenance(),inverse=inv,direct=direct,polygons=polygons,intersections=intersections,independent=independent(),independentDirect=independent_direct())
    if args.check:
        stored=json.loads(DEST.read_text())
        for key in ['provenance','independent','independentDirect']:assert stored[key]==data[key],key+' drift'
        for key in ['inverse','direct','polygons','intersections']:
            assert [{k:v for k,v in row.items() if k!='expected'} for row in stored[key] if 'constructed' not in row]==data[key],key+' input drift'
            if key=='intersections':
                constructed=[row for row in stored[key] if 'constructed' in row]
                assert len(constructed)==48
                assert [row['constructed'] for row in constructed]==[[lat,lon,37.,37.+angle,.1,.2] for ratio in [.99,.9966471893352525,1.,1.01] for lat,lon in [(0.,0.),(67.,179.),(-80.,-90.)] for angle in [.0001,.1,45.,90.]]
            assert all(all(math.isfinite(x) for x in (row['expected'] if key!='intersections' else sum(row['expected'],[]))) for row in stored[key])
        print('G5/G6 provenance, original workloads and 80-digit controls verified');return
    if not args.oracle or not args.archive:parser.error('--oracle and --archive required for regeneration')
    assert hashlib.sha256(Path(args.archive).read_bytes()).hexdigest()==h.ARCHIVE_SHA
    assert subprocess.check_output([args.oracle,'--version'],text=True).strip()=='2.7 53'
    construction=[]
    for ratio in [.99,.9966471893352525,1.,1.01]:
        for lat,lon in [(0.,0.),(67.,179.),(-80.,-90.)]:
            for angle in [.0001,.1,45.,90.]:
                construction.append(dict(a=1.,b=ratio,crossing=[lat,lon,37.,37.+angle,.1,.2]))
    commandsC=[' '.join(map(str,['C',r['a'],r['b'],*r['crossing']])) for r in construction]
    starts=subprocess.check_output([args.oracle],input='\n'.join(commandsC)+'\n',text=True).splitlines()
    for row,line in zip(construction,starts):
        v=list(map(float,line.split()));intersections.append(dict(a=row['a'],b=row['b'],paths=[v[:3],v[3:]],maxDistance=.8,origin=[0.,0.],constructed=row['crossing']))
    commands=[]
    for mode,rows,key in [('I',inv,'point'),('D',direct,'path')]:
        commands += [' '.join(map(str,[mode,r['a'],r['b'],*r[key]])) for r in rows]
    commands += [' '.join(map(str,['P',r['a'],r['b'],len(r['points']),*sum(r['points'],[])])) for r in polygons]
    commands += [' '.join(map(str,['X',r['a'],r['b'],*sum(r['paths'],[]),r['maxDistance'],*r['origin']])) for r in intersections]
    lines=subprocess.check_output([args.oracle],input='\n'.join(commands)+'\n',text=True).splitlines();assert len(lines)==len(commands)
    for row,line in zip(inv+direct+polygons+intersections,lines):
        values=list(map(float,line.split()))
        row['expected']=[values[i:i+3] for i in range(1,len(values),3)] if 'paths' in row else values
    DEST.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n');print('Wrote',len(lines),'native and',len(data['independent']),'independent controls')
if __name__=='__main__':main()
