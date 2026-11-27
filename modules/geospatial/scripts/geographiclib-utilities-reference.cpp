// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline caller for pinned GeographicLib 2.7 MIT; no upstream implementation or fixtures copied.
#include <GeographicLib/UTMUPS.hpp>
#include <GeographicLib/MGRS.hpp>
#include <GeographicLib/DMS.hpp>
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
 std::string mode;
 while(std::cin>>mode){
  try{
   if(mode=="G"){
    double lat,lon;int prec;std::cin>>lat>>lon>>prec;int zone;bool north;Math::real x,y;std::string text;
    UTMUPS::Forward(lat,lon,zone,north,x,y);MGRS::Forward(zone,north,x,y,lat,prec,text);
    int rz,rp;bool rn;Math::real rx,ry,rlat,rlon;MGRS::Reverse(text,rz,rn,rx,ry,rp,true);UTMUPS::Reverse(rz,rn,rx,ry,rlat,rlon);
    std::cout<<zone<<' '<<north<<' '<<x<<' '<<y<<' '<<text<<' '<<rx<<' '<<ry<<' '<<rlat<<' '<<rlon<<'\n';
   }else if(mode=="F"){
    double lat,lon;int requested,hemisphere;std::cin>>lat>>lon>>requested>>hemisphere;
    int zone;bool north;Math::real x,y,rlat,rlon;UTMUPS::Forward(lat,lon,zone,north,x,y,requested);
    if(hemisphere>=0){int result;Math::real tx,ty;UTMUPS::Transfer(zone,north,x,y,zone,hemisphere!=0,tx,ty,result);x=tx;y=ty;north=hemisphere!=0;}
    UTMUPS::Reverse(zone,north,x,y,rlat,rlon);
    std::cout<<zone<<' '<<north<<' '<<x<<' '<<y<<' '<<rlat<<' '<<rlon<<'\n';
   }else if(mode=="T"){
    int zone,target,hemisphere,result;bool north;Math::real x,y,tx,ty;std::cin>>zone>>north>>x>>y>>target>>hemisphere;
    UTMUPS::Transfer(zone,north,x,y,target,hemisphere!=0,tx,ty,result);
    std::cout<<result<<' '<<hemisphere<<' '<<tx<<' '<<ty<<'\n';
   }else if(mode=="Z"){
    std::string text;std::cin>>text;int zone,prec;bool north;Math::real x,y;MGRS::Reverse(text,zone,north,x,y,prec,true);
    std::cout<<zone<<' '<<north<<'\n';
   }else if(mode=="H"){
    Math::real lat,lon,x,y;int requested,prec,zone;bool north;std::string text;std::cin>>lat>>lon>>requested>>prec;
    UTMUPS::Forward(lat,lon,zone,north,x,y,requested,true);MGRS::Forward(zone,north,x,y,lat,prec,text);std::cout<<text<<'\n';
   }else if(mode=="V"){
    int zone;bool north;Math::real x,y,lat,lon;std::cin>>zone>>north>>x>>y;UTMUPS::Reverse(zone,north,x,y,lat,lon);std::cout<<lat<<' '<<lon<<'\n';
   }else if(mode=="D"){
    std::string text;std::getline(std::cin,text);DMS::flag indicator;auto value=DMS::Decode(text,indicator);std::cout<<value<<'\n';
   }else if(mode=="R"){
    std::string text;std::cin>>text;int zone,prec;bool north;Math::real x,y;MGRS::Reverse(text,zone,north,x,y,prec,true);
    std::cout<<zone<<' '<<north<<' '<<x<<' '<<y<<' '<<prec<<'\n';
   }
  }catch(const std::exception&e){std::cout<<"ERROR\n";}
 }
}
