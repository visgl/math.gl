// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original native API caller for GeographicLib 2.7 MIT; no upstream implementation or fixtures incorporated.
#include <GeographicLib/GeodesicExact.hpp>
#include <GeographicLib/GeodesicLineExact.hpp>
#include <GeographicLib/PolygonArea.hpp>
#include <iostream>
#include <iomanip>
#include <limits>
#include <string>
using namespace GeographicLib;
int main(int argc,char**argv){
 std::cout<<std::setprecision(17);
 if(argc==2&&std::string(argv[1])=="--metadata"){
  std::cout<<"{\"version\":\""<<GEOGRAPHICLIB_VERSION_STRING<<"\",\"precisionBits\":"<<std::numeric_limits<Math::real>::digits<<",\"driverSHA256\":\""<<MATHGL_DRIVER_SHA<<"\"}\n";return 0;
 }
 std::string mode; double a,b,p,q,r,s;
 while(std::cin>>mode>>a>>b){
  GeodesicExact g(a,(a-b)/a);
  if(mode=="P"){
   int count,reverse,unsignedArea;std::cin>>count>>reverse>>unsignedArea;PolygonAreaT<GeodesicExact> polygon(g);
   for(int i=0;i<count;i++){std::cin>>p>>q;polygon.AddPoint(p,q);}
   Math::real perimeter,area;polygon.Compute(reverse,!unsignedArea,perimeter,area);std::cout<<perimeter<<' '<<area<<'\n';
  }else{
   std::cin>>p>>q>>r>>s;Math::real lat,lon,azimuth,distance,reduced,M,N,area;
   if(mode=="I")g.GenInverse(p,q,r,s,GeodesicExact::ALL,distance,azimuth,lat,reduced,M,N,area);
   else g.GenDirect(p,q,r,mode=="A",s,GeodesicExact::ALL|GeodesicExact::LONG_UNROLL,lat,lon,azimuth,distance,reduced,M,N,area);
   std::cout<<distance<<' '<<area<<'\n';
  }
 }
}
