// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline API driver for GeographicLib 2.7 (Charles Karney, MIT); no upstream implementation or test data copied.
#include <GeographicLib/Geodesic.hpp>
#include <GeographicLib/GeodesicExact.hpp>
#include <GeographicLib/GeodesicLine.hpp>
#include <GeographicLib/GeodesicLineExact.hpp>
#include <GeographicLib/Geocentric.hpp>
#include <GeographicLib/LocalCartesian.hpp>
#include <GeographicLib/Gnomonic.hpp>
#include <GeographicLib/Triaxial/Cartesian3.hpp>
#include <cmath>
#include <iostream>
#include <iomanip>
#include <limits>
using namespace GeographicLib;
using R = Math::real;
template<class G> void geodesic(char mode, R a, R f, const double* p) {
  G g(a, f);
  R lat=p[2],lon=p[3],az1=p[2],az2,s,m,M,N,S,arc;
  if (mode=='I') arc=g.Inverse(p[0],p[1],p[2],p[3],s,az1,az2,m,M,N,S);
  else {
    auto line=g.Line(p[0],p[1],p[2],G::ALL);
    arc=line.GenPosition(mode=='A'||mode=='V',p[3],G::ALL|((mode=='U'||mode=='V')?G::LONG_UNROLL:0),lat,lon,az2,s,m,M,N,S);
  }
  std::cout<<double(lat)<<' '<<double(lon)<<' '<<double(az1)<<' '<<double(az2)<<' '<<double(s)<<' '<<double(m)<<' '<<double(M)<<' '<<double(N)<<' '<<double(arc)<<'\n';
}
int main(int argc,char**) {
  if(argc>1) {std::cout<<GEOGRAPHICLIB_VERSION_STRING<<' '<<std::numeric_limits<R>::digits<<'\n';return 0;}
  char mode,backend;double a,b,c,p[6];std::cout<<std::setprecision(17);
  while(std::cin>>mode>>backend>>a>>b>>c>>p[0]>>p[1]>>p[2]>>p[3]>>p[4]>>p[5]) {
    // Match the facade's binary64 flattening; preserve every stored input before
    // promotion. The independent Decimal controls separately use exact axes.
    try {
    R f=double((a-b)/a);
    if(backend=='S') geodesic<Geodesic>(mode,a,f,p);
    else if(backend=='E') geodesic<GeodesicExact>(mode,a,f,p);
    else if(mode=='Q') {
      Triaxial::Cartesian3 g(a,b,c);Triaxial::Cartesian3::vec3 q;
      g.anytocart(Triaxial::Cartesian3::GEODETIC,p[1],p[0],p[2],q);
      std::cout<<double(q[0])<<' '<<double(q[1])<<' '<<double(q[2])<<'\n';
    } else if(mode=='T') {
      Triaxial::Cartesian3 g(a,b,c);Triaxial::Cartesian3::vec3 q;
      R h;g.carttocart2({p[0],p[1],p[2]},q,h);
      R nx=q[0]/a/a,ny=q[1]/b/b,nz=q[2]/c/c,n=std::hypot(nx,ny,nz);
      std::cout<<double(q[0])<<' '<<double(q[1])<<' '<<double(q[2])<<' '<<double(nx/n)<<' '<<double(ny/n)<<' '<<double(nz/n)<<' '<<double(h)<<'\n';
    } else {
      Geocentric earth(a,f);R x,y,z;
      if(mode=='F') earth.Forward(p[1],p[0],p[2],x,y,z);
      else if(mode=='R') {earth.Reverse(p[0],p[1],p[2],y,x,z);}
      else if(mode=='L') {
        LocalCartesian local(p[1],p[0],p[2],earth);local.Forward(p[4],p[3],p[5],x,y,z);
        R ox,oy,oz,tx,ty,tz;earth.Forward(p[1],p[0],p[2],ox,oy,oz);earth.Forward(p[4],p[3],p[5],tx,ty,tz);
        std::cout<<double(x)<<' '<<double(y)<<' '<<double(z)<<' '<<double(ox)<<' '<<double(oy)<<' '<<double(oz)<<' '<<double(tx)<<' '<<double(ty)<<' '<<double(tz)<<'\n';continue;
      } else {
        Gnomonic g{Geodesic(a,f)};R az,rk;
        if(mode=='G') g.Forward(p[1],p[0],p[3],p[2],x,y,az,rk);
        else g.Reverse(p[1],p[0],p[2],p[3],y,x,az,rk);
        z=rk;
      }
      std::cout<<double(x)<<' '<<double(y)<<' '<<double(z)<<'\n';
    }
    } catch(const GeographicErr& e) {std::cout<<"error "<<e.what()<<'\n';}
  }
}
