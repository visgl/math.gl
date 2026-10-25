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
   }else if(mode=="D"){
    std::string text;std::getline(std::cin,text);DMS::flag indicator;auto value=DMS::Decode(text,indicator);std::cout<<value<<'\n';
   }else if(mode=="R"){
    std::string text;std::cin>>text;int zone,prec;bool north;Math::real x,y;MGRS::Reverse(text,zone,north,x,y,prec,true);
    std::cout<<zone<<' '<<north<<' '<<x<<' '<<y<<' '<<prec<<'\n';
   }
  }catch(const std::exception&e){std::cout<<"ERROR\n";}
 }
}
