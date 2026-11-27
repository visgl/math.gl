// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline GeographicLib 2.7 oblique-circle root controls; no upstream fixtures copied. Dense sign-change discovery is independent of production extremum splitting.
#include <GeographicLib/Geodesic.hpp>
#include <GeographicLib/GeodesicLine.hpp>
#include <GeographicLib/Rhumb.hpp>
#include <GeographicLib/Ellipsoid.hpp>
#include <iostream>
#include <iomanip>
#include <limits>
#include <vector>
#include <algorithm>
#include <cmath>
using namespace GeographicLib;
int main(int argc,char**argv){
 std::cout<<std::setprecision(17);
 if(argc==2&&std::string(argv[1])=="--metadata"){
  std::cout<<"{\"version\":\""<<GEOGRAPHICLIB_VERSION_STRING<<"\",\"precisionBits\":"<<std::numeric_limits<Math::real>::digits<<",\"driverSHA256\":\""<<MATHGL_DRIVER_SHA<<"\"}\n";return 0;
 }
 char mode;double a,b,lat1,lon1,lat2,lon2,vx,vy,vz,offset;int turns;
 while(std::cin>>mode>>a>>b>>lat1>>lon1>>lat2>>lon2>>turns>>vx>>vy>>vz>>offset){
  Geodesic g(a,(a-b)/a);Rhumb r(a,(a-b)/a,true);Math::real distance,azi,other,S;
  if(mode=='G')g.Inverse(lat1,lon1,lat2,lon2,distance,azi,other);
  else {
   // Rhumb::Inverse chooses the shortest longitude difference. Build the
   // explicitly wound bearing from native auxiliary latitudes instead.
   Ellipsoid e(a,(a-b)/a);
   double dl=(Math::AngDiff(lon1,lon2)+360*turns)*Math::degree();
   double dp=(e.IsometricLatitude(lat2)-e.IsometricLatitude(lat1))*Math::degree();
   azi=Math::atan2d(dl,dp);
   distance=lat1==lat2?std::abs(dl)*e.CircleRadius(lat1):
     std::abs((e.MeridianDistance(lat2)-e.MeridianDistance(lat1))/Math::cosd(azi));
  }
  auto sample=[&](double t){Math::real lat,lon,az,ds,m,M1,M2,area;
   if(mode=='G')g.GenDirect(lat1,lon1,azi,false,distance*t,Geodesic::ALL|Geodesic::LONG_UNROLL,lat,lon,az,ds,m,M1,M2,area);
   else r.GenDirect(lat1,lon1,azi,distance*t,Rhumb::ALL|Rhumb::LONG_UNROLL,lat,lon,area);
   // Exact input endpoints and the rhumb monotonicity/parallel identities
   // take precedence over last-bit native direct roundoff.
   if(t==0){lat=lat1;lon=lon1;}
   if(t==1)lat=lat2;
   if(mode=='R')lat=std::max(std::min(lat1,lat2),std::min(std::max(lat1,lat2),double(lat)));
   return std::pair<double,double>(lat,lon);
  };
  double norm=std::hypot(vx,vy,vz);vx/=norm;vy/=norm;vz/=norm;
  auto value=[&](double t){auto p=sample(t);Math::real sp,cp,sl,cl;Math::sincosd(p.first,sp,cp);Math::sincosd(p.second,sl,cl);return vx*cp*cl+vy*cp*sl+vz*sp-offset;};
  std::vector<double> cuts={0,1};
  for(int j=0;j<1024;j++){
   double lo=j/1024.,hi=(j+1)/1024.,fl=value(lo),fh=value(hi);
   if(fl==0)cuts.push_back(lo);if(fh==0)cuts.push_back(hi);
   if(fl*fh>=0)continue;
   for(int k=0;k<90;k++){double mid=(lo+hi)/2,fm=value(mid);if(fm==0){lo=hi=mid;break;}if((fm<0)==(fl<0)){lo=mid;fl=fm;}else hi=mid;}
   cuts.push_back((lo+hi)/2);
  }
  std::sort(cuts.begin(),cuts.end());cuts.erase(std::unique(cuts.begin(),cuts.end()),cuts.end());
  std::vector<std::pair<double,double>> intervals;
  for(size_t i=1;i<cuts.size();i++){if(cuts[i]==cuts[i-1]||value((cuts[i]+cuts[i-1])/2)<=0)continue;
   if(!intervals.empty()&&intervals.back().second==cuts[i-1])intervals.back().second=cuts[i];else intervals.push_back({cuts[i-1],cuts[i]});}
  std::cout<<distance<<' '<<intervals.size();for(auto v:intervals){auto x=sample(v.first),y=sample(v.second);std::cout<<' '<<v.first<<' '<<v.second<<' '<<x.first<<' '<<x.second<<' '<<y.first<<' '<<y.second;}std::cout<<'\n';
 }
}
