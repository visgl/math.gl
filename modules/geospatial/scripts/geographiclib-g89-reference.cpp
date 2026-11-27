// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original API caller for pinned GeographicLib 2.7 (Charles Karney, MIT); no native implementation or upstream fixtures copied.
#include <GeographicLib/GeodesicExact.hpp>
#include <GeographicLib/GeodesicLineExact.hpp>
#include <GeographicLib/Triaxial/Cartesian3.hpp>
#include <GeographicLib/Triaxial/Geodesic3.hpp>
#include <GeographicLib/Triaxial/GeodesicLine3.hpp>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#ifndef MATHGL_DRIVER_SHA
#define MATHGL_DRIVER_SHA "unrecorded"
#endif
using namespace GeographicLib;
using R=Math::real;
int main(int argc,char**argv){
 std::cout<<std::setprecision(17);
 if(argc==2&&std::string(argv[1])=="--metadata"){
  std::cout<<"{\"version\":\""<<GEOGRAPHICLIB_VERSION_STRING<<"\",\"precisionBits\":"<<std::numeric_limits<R>::digits<<",\"driverSHA256\":\""<<MATHGL_DRIVER_SHA<<"\",\"compiler\":\""<<__VERSION__<<"\"}\n";return 0;
 }
 std::string mode;double a,b,c,p0,p1,p2,p3;int system;
 while(std::cin>>mode>>a>>b>>c>>system>>p0>>p1>>p2>>p3){
  try{
   if(mode=="D"||mode=="A"||mode=="I"){
    GeodesicExact g(a,(a-b)/a);R lat,lon,azi1=p2,azi2,s,m,M,N,area,arc;
    const unsigned mask=(GeodesicExact::ALL&~GeodesicExact::AREA)|GeodesicExact::LONG_UNROLL;
    if(mode=="I"){lat=p2;lon=p3;arc=g.GenInverse(p0,p1,p2,p3,mask,s,azi1,azi2,m,M,N,area);}
    else arc=g.GenDirect(p0,p1,p2,mode=="A",p3,mask,lat,lon,azi2,s,m,M,N,area);
    std::cout<<double(lat)<<' '<<double(lon)<<' '<<double(azi1)<<' '<<double(azi2)<<' '<<double(s)<<' '<<double(m)<<' '<<double(M)<<' '<<double(N)<<' '<<double(arc)<<'\n';
   }else if(mode=="S"){
    GeodesicExact g(a,(a-b)/a);std::cout<<double(g.EllipsoidArea())<<'\n';
   }else{
    Triaxial::Ellipsoid3 shape(a,b,c);Triaxial::Cartesian3 t(shape);Triaxial::Ellipsoid3::vec3 position,direction;
    t.anytocart2(static_cast<Triaxial::Cartesian3::coord>(system),p0,p1,p2,position,direction);
    if(mode=="T"){
     Triaxial::Geodesic3 g(shape);Angle beta,omega,alpha;
     shape.cart2toellip(position,direction,beta,omega,alpha);
     auto line=g.Line(beta,omega,alpha);line.Position(p3,beta,omega,alpha);
     shape.elliptocart2(beta,omega,alpha,position,direction);
    }
    for(int i=0;i<3;i++)std::cout<<(i?" ":"")<<double(position[i]);
    for(int i=0;i<3;i++)std::cout<<' '<<double(direction[i]);std::cout<<'\n';
   }
  }catch(const std::exception& e){std::cout<<"ERROR "<<e.what()<<'\n';}
 }
}
