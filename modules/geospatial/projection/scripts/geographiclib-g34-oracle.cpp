// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original API driver for offline GeographicLib 2.7 MIT comparisons; no upstream test data copied.
#include <GeographicLib/Ellipsoid.hpp>
#include <GeographicLib/Geodesic.hpp>
#include <GeographicLib/GeodesicExact.hpp>
#include <GeographicLib/PolygonArea.hpp>
#include <iostream>
#include <iomanip>
#include <vector>
#include <limits>
using namespace GeographicLib;
using R = Math::real;
template<class G> void polygon(const G& g, bool line, bool reverse, bool sign, const std::vector<std::vector<R>>& ops) {
  PolygonAreaT<G> p(g,line);
  for (auto& o:ops) { if(o[0]==0) p.AddPoint(o[1],o[2]); else p.AddEdge(o[1],o[2]); }
  R perimeter=0,area=0; auto n=p.Compute(reverse,sign,perimeter,area);
  std::cout<<' '<<n<<' '<<perimeter<<' '<<area;
}
int main(int argc,char**) {
  if(argc>1) {std::cout<<GEOGRAPHICLIB_VERSION_STRING<<' '<<std::numeric_limits<R>::digits<<'\n';return 0;}
  std::cout<<std::setprecision(21);
  char mode; double da,db;
  while(std::cin>>mode>>da>>db) {
    R a=da, f=(da-db)/da;
    if(mode=='M') {
      R phi; std::cin>>phi; Ellipsoid e(a,f);
      std::cout<<e.Area()<<' '<<e.Volume()<<' '<<e.QuarterMeridian()<<' '<<e.MeridianDistance(phi)<<' '
        <<e.MeridionalCurvatureRadius(phi)<<' '<<e.TransverseCurvatureRadius(phi)<<' '<<e.NormalCurvatureRadius(phi,37)<<' '
        <<e.GeocentricLatitude(phi)<<' '<<e.ParametricLatitude(phi)<<' '<<e.RectifyingLatitude(phi)<<' '
        <<e.AuthalicLatitude(phi)<<' '<<e.ConformalLatitude(phi)<<' '<<e.IsometricLatitude(phi)<<' '
        <<e.InverseGeocentricLatitude(phi)<<' '<<e.InverseParametricLatitude(phi)<<' '<<e.InverseRectifyingLatitude(phi)<<' '
        <<e.InverseAuthalicLatitude(phi)<<' '<<e.InverseConformalLatitude(phi)<<' '<<e.InverseIsometricLatitude(phi);
    } else if(mode=='D') {
      R lat,lon,azi,d,s,t,S; std::cin>>lat>>lon>>azi>>d;
      Geodesic g(a,f); GeodesicExact e(a,f);
      R arc=g.GenDirect(lat,lon,azi,false,d,Geodesic::ALL,s,t,t,t,t,t,t,S); std::cout<<S;
      e.GenDirect(lat,lon,azi,false,d,GeodesicExact::ALL,s,t,t,t,t,t,t,S); std::cout<<' '<<S;
      g.GenDirect(lat,lon,azi,true,arc,Geodesic::ALL,s,t,t,t,t,t,t,S); std::cout<<' '<<S;
      e.GenDirect(lat,lon,azi,true,arc,GeodesicExact::ALL,s,t,t,t,t,t,t,S); std::cout<<' '<<S<<' '<<arc;
    } else if(mode=='E') {
      R x,y,u,v,s,t,S; std::cin>>x>>y>>u>>v;
      Geodesic g(a,f); GeodesicExact e(a,f);
      g.GenInverse(x,y,u,v,Geodesic::AREA,s,t,t,t,t,t,S); std::cout<<S;
      e.GenInverse(x,y,u,v,GeodesicExact::AREA,s,t,t,t,t,t,S); std::cout<<' '<<S;
    } else {
      int line,reverse,sign,n; std::cin>>line>>reverse>>sign>>n;
      std::vector<std::vector<R>> ops(n,std::vector<R>(3));
      for(auto& o:ops) std::cin>>o[0]>>o[1]>>o[2];
      polygon(Geodesic(a,f),line,reverse,sign,ops);
      polygon(GeodesicExact(a,f),line,reverse,sign,ops);
    }
    std::cout<<'\n';
  }
}
